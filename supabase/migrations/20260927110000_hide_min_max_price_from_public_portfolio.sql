-- The supplier's floor price (price_min) is meant for their own private
-- negotiation reference only -- it should never reach a customer. This RPC
-- backs the public supplier portfolio page (get_supplier_portfolio is
-- SECURITY DEFINER and callable by anyone), so it was leaking price_min at
-- the data layer even though the UI didn't render it as a labeled field.
-- price_max is being dropped from the product entirely (fixed price is the
-- only customer-facing price now).
DROP FUNCTION IF EXISTS public.get_supplier_portfolio(text);

CREATE FUNCTION public.get_supplier_portfolio(p_username text)
RETURNS TABLE(
  supplier_id uuid,
  username text,
  company_name text,
  bio text,
  logo_url text,
  contact_info jsonb,
  supplier_created_at timestamp with time zone,
  product_id uuid,
  product_name text,
  product_description text,
  product_price numeric,
  product_images text[],
  product_category text,
  product_sku text,
  product_status text,
  product_created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    p.images,
    p.category,
    p.sku,
    p.status,
    p.created_at
  FROM public.suppliers s
  LEFT JOIN public.supplier_products p ON p.supplier_id = s.id
  WHERE s.username = lower(p_username);
$function$;
