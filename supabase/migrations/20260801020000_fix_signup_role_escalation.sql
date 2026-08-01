-- Security fix: signup previously trusted client-supplied role verbatim,
-- allowing any user to grant themselves 'admin' via raw_user_meta_data.
-- Only allow self-selecting 'customer' or 'supplier' at signup; admin must
-- be granted separately by an existing admin.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text;
  safe_role app_role;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, name, company)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'company');

  requested_role := NEW.raw_user_meta_data->>'role';

  IF requested_role IN ('customer', 'supplier') THEN
    safe_role := requested_role::app_role;
  ELSE
    safe_role := 'customer'::app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, safe_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
