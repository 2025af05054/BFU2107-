-- Supplier public portfolio: unique handle + public-safe lookup function

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE public.suppliers
  ADD CONSTRAINT suppliers_username_format_check
  CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,30}$');

-- Public, scoped lookup: returns one supplier's profile + all their products
-- by handle. Kept as a SECURITY DEFINER function (not a table/view grant) so
-- anonymous visitors can only ever fetch a single known handle at a time,
-- not enumerate/scrape the full suppliers or supplier_products tables.
CREATE OR REPLACE FUNCTION public.get_supplier_portfolio(p_username TEXT)
RETURNS TABLE (
  supplier_id UUID,
  username TEXT,
  company_name TEXT,
  bio TEXT,
  logo_url TEXT,
  contact_info JSONB,
  supplier_created_at TIMESTAMP WITH TIME ZONE,
  product_id UUID,
  product_name TEXT,
  product_description TEXT,
  product_price NUMERIC,
  product_price_min NUMERIC,
  product_price_max NUMERIC,
  product_images TEXT[],
  product_category TEXT,
  product_sku TEXT,
  product_status TEXT,
  product_created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    s.id,
    s.username,
    s.company_name,
    s.bio,
    s.logo_url,
    s.contact_info,
    s.created_at,
    p.id,
    p.name,
    p.description,
    p.price,
    p.price_min,
    p.price_max,
    p.images,
    p.category,
    p.sku,
    p.status,
    p.created_at
  FROM public.suppliers s
  LEFT JOIN public.supplier_products p ON p.supplier_id = s.id
  WHERE s.username = lower(p_username);
$$;

GRANT EXECUTE ON FUNCTION public.get_supplier_portfolio(TEXT) TO anon, authenticated;

-- Public, scoped username-availability check (no row data leaked, just a boolean)
CREATE OR REPLACE FUNCTION public.is_supplier_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.suppliers WHERE username = lower(p_username)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_supplier_username_available(TEXT) TO anon, authenticated;
