-- Capture mobile/address/gst supplied at signup into profiles, matching the
-- existing name/company pattern. These columns already existed but were
-- never populated by handle_new_user().
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
  INSERT INTO public.profiles (id, name, company, mobile, address, gst)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'company',
    NEW.raw_user_meta_data->>'mobile',
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'gst'
  );

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
