import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";

interface LiveChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "support";
  timestamp: Date;
}

export const LiveChatDialog = ({ open, onOpenChange }: LiveChatDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! Welcome to BUY FOR US support. How can I help you today?",
      sender: "support",
      timestamp: new Date(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setNewMessage("");

    // Simulate support response
    setTimeout(() => {
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for your message. Our support team will assist you shortly.",
        sender: "support",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, supportMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Live Chat Support</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button onClick={handleSendMessage} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
