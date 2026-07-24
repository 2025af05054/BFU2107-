-- Create chat_messages table for customer-admin communication
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'admin')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat messages
CREATE POLICY "Customers can view messages for their RFQs" 
ON public.chat_messages 
FOR SELECT 
USING (
  has_role(auth.uid(), 'customer'::app_role) AND 
  EXISTS (
    SELECT 1 FROM rfqs 
    WHERE rfqs.id = chat_messages.rfq_id 
    AND rfqs.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers can send messages for their RFQs" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'customer'::app_role) AND 
  sender_id = auth.uid() AND
  sender_role = 'customer' AND
  EXISTS (
    SELECT 1 FROM rfqs 
    WHERE rfqs.id = chat_messages.rfq_id 
    AND rfqs.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can send messages to any RFQ" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND 
  sender_id = auth.uid() AND
  sender_role = 'admin'
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime to chat_messages
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;