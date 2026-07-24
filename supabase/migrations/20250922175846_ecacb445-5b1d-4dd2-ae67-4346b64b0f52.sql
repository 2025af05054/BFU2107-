-- Fix security warnings by setting search_path for all functions

-- Update generate functions with proper search_path
CREATE OR REPLACE FUNCTION generate_rfq_number()
RETURNS TEXT AS $$
DECLARE
  next_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(rfq_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_id
  FROM public.rfqs;
  
  RETURN 'RFQ' || TO_CHAR(next_id, 'FM000');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  next_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_id
  FROM public.quotes;
  
  RETURN 'QUO' || TO_CHAR(next_id, 'FM000');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_id
  FROM public.orders;
  
  RETURN 'ORD' || TO_CHAR(next_id, 'FM000');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update trigger functions with proper search_path
CREATE OR REPLACE FUNCTION set_rfq_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rfq_number = generate_rfq_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION set_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.quote_number = generate_quote_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = generate_order_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update updated_at function with proper search_path
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update new user function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', COALESCE(NEW.raw_user_meta_data->>'role', 'customer'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();