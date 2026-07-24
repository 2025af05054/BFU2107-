-- Drop the overly permissive public policy on suppliers table
DROP POLICY IF EXISTS "Anyone can view suppliers" ON public.suppliers;

-- Create a new policy that only allows authenticated users to view suppliers
CREATE POLICY "Authenticated users can view suppliers"
ON public.suppliers
FOR SELECT
TO authenticated
USING (true);