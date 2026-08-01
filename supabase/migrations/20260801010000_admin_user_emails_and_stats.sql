-- Admin-only function to fetch emails for all users (client cannot call auth.admin API directly)
CREATE OR REPLACE FUNCTION public.get_all_user_emails()
RETURNS TABLE (id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can access user emails';
  END IF;

  RETURN QUERY
  SELECT au.id, au.email::TEXT
  FROM auth.users au;
END;
$$;

-- Admin-only dashboard stats aggregated server-side
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_suppliers BIGINT,
  total_customers BIGINT,
  total_rfqs BIGINT,
  pending_rfqs BIGINT,
  total_products BIGINT,
  total_orders BIGINT,
  pending_orders BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can access dashboard stats';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.profiles),
    (SELECT COUNT(*) FROM public.user_roles WHERE role = 'supplier'),
    (SELECT COUNT(*) FROM public.user_roles WHERE role = 'customer'),
    (SELECT COUNT(*) FROM public.rfqs),
    (SELECT COUNT(*) FROM public.rfqs WHERE rfq_status = 'pending'),
    (SELECT COUNT(*) FROM public.products),
    (SELECT COUNT(*) FROM public.orders),
    (SELECT COUNT(*) FROM public.orders WHERE status = 'pending');
END;
$$;
