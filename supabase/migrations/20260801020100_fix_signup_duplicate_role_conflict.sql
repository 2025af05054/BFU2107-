-- Pre-existing bug: assign_customer_role_on_profile_creation (trigger on
-- public.profiles) always inserts a 'customer' user_roles row before
-- handle_new_user's own insert runs, so every signup with role 'customer'
-- hit a duplicate-key error on user_roles_user_id_role_key and signup
-- failed with "Database error saving new user". Make the insert idempotent.
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
