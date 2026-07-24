-- Update RLS policies for role-based access control

-- RFQs: Customers can create/view their own, suppliers can view all to respond
DROP POLICY IF EXISTS "Users can view their own RFQs" ON public.rfqs;
DROP POLICY IF EXISTS "Users can create their own RFQs" ON public.rfqs;
DROP POLICY IF EXISTS "Users can update their own RFQs" ON public.rfqs;

CREATE POLICY "Customers can create their own RFQs"
ON public.rfqs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'customer'));

CREATE POLICY "Customers can view their own RFQs"
ON public.rfqs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'customer'));

CREATE POLICY "Customers can update their own RFQs"
ON public.rfqs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'customer'));

CREATE POLICY "Suppliers can view all RFQs to respond"
ON public.rfqs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'supplier'));

CREATE POLICY "Admins can view all RFQs"
ON public.rfqs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Quotes: Only suppliers can create, customers can view quotes for their RFQs
DROP POLICY IF EXISTS "Users can view quotes for their RFQs" ON public.quotes;

CREATE POLICY "Suppliers can create quotes"
ON public.quotes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'supplier'));

CREATE POLICY "Suppliers can update their quotes"
ON public.quotes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'supplier') AND supplier_id = auth.uid());

CREATE POLICY "Suppliers can view all quotes"
ON public.quotes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'supplier'));

CREATE POLICY "Customers can view quotes for their RFQs"
ON public.quotes
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'customer') AND 
  EXISTS (
    SELECT 1 FROM public.rfqs 
    WHERE rfqs.id = quotes.rfq_id AND rfqs.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all quotes"
ON public.quotes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Products: Customers can manage products in their RFQs, suppliers can view to quote
DROP POLICY IF EXISTS "Users can view products from their RFQs" ON public.products;
DROP POLICY IF EXISTS "Users can insert products to their RFQs" ON public.products;
DROP POLICY IF EXISTS "Users can update products in their RFQs" ON public.products;

CREATE POLICY "Customers can manage products in their RFQs"
ON public.products
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'customer') AND
  EXISTS (
    SELECT 1 FROM public.rfqs 
    WHERE rfqs.id = products.rfq_id AND rfqs.user_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'customer') AND
  EXISTS (
    SELECT 1 FROM public.rfqs 
    WHERE rfqs.id = products.rfq_id AND rfqs.user_id = auth.uid()
  )
);

CREATE POLICY "Suppliers can view all products to quote"
ON public.products
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'supplier'));

CREATE POLICY "Admins can view all products"
ON public.products
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Product quotes: Suppliers can create, customers can view for their RFQs
DROP POLICY IF EXISTS "Users can view product quotes for their RFQs" ON public.product_quotes;

CREATE POLICY "Suppliers can create product quotes"
ON public.product_quotes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'supplier'));

CREATE POLICY "Suppliers can view all product quotes"
ON public.product_quotes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'supplier'));

CREATE POLICY "Customers can view product quotes for their RFQs"
ON public.product_quotes
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'customer') AND
  EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.rfqs r ON r.id = q.rfq_id
    WHERE q.id = product_quotes.quote_id AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all product quotes"
ON public.product_quotes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Orders: Customers can view their orders, suppliers can view orders for their quotes
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

CREATE POLICY "Customers can view their orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'customer') AND
  EXISTS (
    SELECT 1 FROM public.rfqs r
    WHERE r.id = orders.rfq_id AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Suppliers can view orders for their quotes"
ON public.orders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'supplier') AND
  EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = orders.quote_id AND q.supplier_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: Enhanced policies for role-based access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));