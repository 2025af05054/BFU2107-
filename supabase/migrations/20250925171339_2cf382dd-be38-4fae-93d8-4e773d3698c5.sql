-- Update RLS policies for supplier_products to handle approval status

-- Drop existing policy for public viewing
DROP POLICY IF EXISTS "Anyone can view supplier products" ON public.supplier_products;

-- Create new policies for different user types
CREATE POLICY "Admins can view all supplier products" 
ON public.supplier_products 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view approved supplier products" 
ON public.supplier_products 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Suppliers can view their own products regardless of status" 
ON public.supplier_products 
FOR SELECT 
USING (supplier_id = auth.uid());

-- Update existing supplier management policy to allow status updates
-- (This policy already exists but we need to ensure admins can update status)
CREATE POLICY "Admins can approve/reject supplier products" 
ON public.supplier_products 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));