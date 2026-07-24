-- Revoke anonymous access to supplier_directory to prevent public scraping
REVOKE SELECT ON public.supplier_directory FROM anon;

-- Ensure authenticated users still have access
GRANT SELECT ON public.supplier_directory TO authenticated;