import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';

interface Message {
  id: string;
  message: string;
  sender_role: 'customer' | 'admin';
  created_at: string;
  sender_id: string;
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfqId: string;
  rfqNumber: string;
}

export const ChatDialog = ({ open, onOpenChange, rfqId, rfqNumber }: ChatDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { role: userRole } = useUserRole();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (open && rfqId) {
      fetchMessages();
      cleanup = setupRealtimeSubscription();
    }
    
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [open, rfqId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        ...msg,
        sender_role: msg.sender_role as 'customer' | 'admin'
      })));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `rfq_id=eq.${rfqId}`
        },
        (payload) => {
          const newMessage = {
            ...payload.new,
            sender_role: payload.new.sender_role as 'customer' | 'admin'
          } as Message;
          
          // Don't add if it's already in the list (optimistic update)
          setMessages(prev => {
            const messageExists = prev.some(msg => 
              msg.id === newMessage.id || 
              (msg.message === newMessage.message && 
               msg.sender_id === newMessage.sender_id &&
               Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000)
            );
            
            if (messageExists) {
              return prev.map(msg => 
                msg.id.startsWith('temp-') && 
                msg.message === newMessage.message && 
                msg.sender_id === newMessage.sender_id 
                  ? newMessage 
                  : msg
              );
            }
            
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistically add the message to UI
    const optimisticMessage: Message = {
      id: tempId,
      message: messageText,
      sender_role: userRole as 'customer' | 'admin',
      created_at: new Date().toISOString(),
      sender_id: user.id
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      setSending(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          rfq_id: rfqId,
          sender_id: user.id,
          sender_role: userRole,
          message: messageText
        })
        .select()
        .single();

      if (error) throw error;
      
      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? {
          ...data,
          sender_role: data.sender_role as 'customer' | 'admin'
        } as Message : msg
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageText); // Restore message text
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat - {rfqNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground">Start the conversation!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={message.sender_role === 'admin' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {message.sender_role === 'admin' ? 'Admin' : 'Customer'}
                        </Badge>
                        <span className="text-xs opacity-70">
                          {format(new Date(message.created_at), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};