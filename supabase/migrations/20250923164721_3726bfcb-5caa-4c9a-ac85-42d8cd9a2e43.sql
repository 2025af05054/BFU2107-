-- Update the handle_new_user function to use role from signup data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, name, company)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'company');
  
  -- Assign role from signup data, default to customer if not provided
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::app_role);
  
  RETURN NEW;
END;
$$;