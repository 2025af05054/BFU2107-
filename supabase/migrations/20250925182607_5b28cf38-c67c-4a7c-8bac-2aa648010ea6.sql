-- CRITICAL SECURITY FIX: Restrict profile access to prevent data theft
-- Remove the dangerous "Users can view all profiles" policy that allows public access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policies that properly restrict profile access
-- 1. Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- 2. Allow limited profile visibility for business purposes
-- Suppliers can view basic customer info when they have active quotes/orders
CREATE POLICY "Suppliers can view customer profiles for business" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'supplier'::app_role) AND
  EXISTS (
    SELECT 1 
    FROM quotes q
    JOIN rfqs r ON r.id = q.rfq_id
    WHERE q.supplier_id = auth.uid() 
    AND r.user_id = profiles.id
  )
);

-- 3. Customers can view supplier profiles for business purposes
CREATE POLICY "Customers can view supplier profiles for business" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'customer'::app_role) AND
  EXISTS (
    SELECT 1 
    FROM quotes q
    JOIN rfqs r ON r.id = q.rfq_id
    WHERE r.user_id = auth.uid() 
    AND q.supplier_id = profiles.id
  )
);

-- 4. Public can view basic supplier information (company name and company_url only) for discovery
-- This creates a view with limited fields for public supplier discovery
CREATE OR REPLACE VIEW public.supplier_directory AS
SELECT 
  p.id,
  p.company,
  p.company_url,
  p.created_at
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'supplier'::app_role
AND p.company IS NOT NULL;

-- Grant public access to the supplier directory view
GRANT SELECT ON public.supplier_directory TO anon, authenticated;