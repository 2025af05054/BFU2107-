-- FIX: Security Definer View Issue
-- Recreate the supplier_directory view with SECURITY INVOKER to respect RLS policies
DROP VIEW IF EXISTS public.supplier_directory;

-- Create the view with security_invoker=on to respect user permissions and RLS policies
CREATE VIEW public.supplier_directory 
WITH (security_invoker=on) AS
SELECT 
  p.id,
  p.company,
  p.company_url,
  p.created_at
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'supplier'::app_role
AND p.company IS NOT NULL;

-- Grant appropriate access to the view
GRANT SELECT ON public.supplier_directory TO anon, authenticated;