-- Create status enum for RFQs
CREATE TYPE public.rfq_status AS ENUM ('pending', 'approved', 'rejected');

-- Create suppliers table
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create new products table for supplier products (different from existing RFQ products)
CREATE TABLE public.supplier_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on supplier_products
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

-- Modify existing RFQs table to add new status and better structure
ALTER TABLE public.rfqs 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS rfq_status rfq_status DEFAULT 'pending';

-- Update existing RFQs to use customer_id (copy from user_id)
UPDATE public.rfqs SET customer_id = user_id WHERE customer_id IS NULL;

-- Create RLS policies for suppliers table
CREATE POLICY "Suppliers can manage their own profile"
ON public.suppliers
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view suppliers"
ON public.suppliers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage all suppliers"
ON public.suppliers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for notifications table
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for supplier_products table
CREATE POLICY "Suppliers can manage their own products"
ON public.supplier_products
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.suppliers 
        WHERE suppliers.id = supplier_products.supplier_id 
        AND suppliers.id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.suppliers 
        WHERE suppliers.id = supplier_products.supplier_id 
        AND suppliers.id = auth.uid()
    )
);

CREATE POLICY "Anyone can view supplier products"
ON public.supplier_products
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage all supplier products"
ON public.supplier_products
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update RFQ policies to use new rfq_status
CREATE POLICY "Admins can update RFQ status"
ON public.rfqs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger for new tables
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_supplier_products_updated_at
    BEFORE UPDATE ON public.supplier_products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to create supplier profile when user role is set to supplier
CREATE OR REPLACE FUNCTION public.handle_supplier_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If role is being set to supplier, create supplier profile if it doesn't exist
    IF NEW.role = 'supplier' AND (OLD IS NULL OR OLD.role != 'supplier') THEN
        INSERT INTO public.suppliers (id, company_name)
        VALUES (NEW.user_id, 'Company Name Required')
        ON CONFLICT (id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for automatic supplier profile creation
CREATE TRIGGER on_supplier_role_assigned
    AFTER INSERT OR UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_supplier_role_assignment();