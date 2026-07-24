-- Function to automatically assign customer role to new users
CREATE OR REPLACE FUNCTION public.assign_customer_role_to_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert customer role for the new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to assign customer role when profile is created
DROP TRIGGER IF EXISTS assign_customer_role_on_profile_creation ON public.profiles;
CREATE TRIGGER assign_customer_role_on_profile_creation
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_customer_role_to_new_user();

-- Assign customer role to existing users who don't have any role
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'customer'::app_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;