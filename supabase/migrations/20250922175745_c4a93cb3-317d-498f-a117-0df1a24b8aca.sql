-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT,
  company TEXT,
  mobile TEXT,
  address TEXT,
  gst TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'supplier', 'admin')),
  avatar_url TEXT
);

-- Create RFQs table
CREATE TABLE public.rfqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rfq_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'Created' CHECK (status IN ('Created', 'In Progress', 'Quoted', 'Closed')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create products table
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('identified', 'unidentified')) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  manufacturer TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  target_price DECIMAL(10,2),
  target_lead_time INTEGER,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create quotes table
CREATE TABLE public.quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE CASCADE NOT NULL,
  quote_number TEXT UNIQUE NOT NULL,
  supplier_id UUID,
  supplier_name TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  valid_until DATE NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create product quotes table
CREATE TABLE public.product_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  lead_time INTEGER NOT NULL,
  terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE CASCADE NOT NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT UNIQUE NOT NULL,
  po_number TEXT NOT NULL,
  status TEXT DEFAULT 'PO Accepted' CHECK (status IN ('PO Accepted', 'Order in Progress', 'Out for Delivery', 'Delivered')) NOT NULL,
  payment_status TEXT DEFAULT 'Not Indicated' CHECK (payment_status IN ('Not Indicated', 'Partial', 'Done')) NOT NULL,
  delivery_date DATE,
  delivery_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for RFQs
CREATE POLICY "Users can view their own RFQs" ON public.rfqs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own RFQs" ON public.rfqs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own RFQs" ON public.rfqs FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for products
CREATE POLICY "Users can view products from their RFQs" ON public.products FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.rfqs WHERE rfqs.id = products.rfq_id AND rfqs.user_id = auth.uid())
);
CREATE POLICY "Users can insert products to their RFQs" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.rfqs WHERE rfqs.id = products.rfq_id AND rfqs.user_id = auth.uid())
);
CREATE POLICY "Users can update products in their RFQs" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.rfqs WHERE rfqs.id = products.rfq_id AND rfqs.user_id = auth.uid())
);

-- Create policies for quotes
CREATE POLICY "Users can view quotes for their RFQs" ON public.quotes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.rfqs WHERE rfqs.id = quotes.rfq_id AND rfqs.user_id = auth.uid())
);

-- Create policies for product quotes
CREATE POLICY "Users can view product quotes for their RFQs" ON public.product_quotes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.rfqs r ON r.id = q.rfq_id
    WHERE q.id = product_quotes.quote_id AND r.user_id = auth.uid()
  )
);

-- Create policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.rfqs WHERE rfqs.id = orders.rfq_id AND rfqs.user_id = auth.uid())
);

-- Create functions for auto-generating numbers
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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

-- Create triggers for auto-generating numbers
CREATE OR REPLACE FUNCTION set_rfq_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rfq_number = generate_rfq_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.quote_number = generate_quote_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = generate_order_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_set_rfq_number
  BEFORE INSERT ON public.rfqs
  FOR EACH ROW EXECUTE FUNCTION set_rfq_number();

CREATE TRIGGER trigger_set_quote_number
  BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION set_quote_number();

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_rfqs_updated_at
  BEFORE UPDATE ON public.rfqs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create trigger for auto profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', COALESCE(NEW.raw_user_meta_data->>'role', 'customer'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;