-- Admins could INSERT/UPDATE user_roles but never DELETE, so role changes
-- in the Admin Panel silently left the old role row behind (RLS blocked
-- the delete with no error), and since the app resolves to the highest
-- role present, demotions never actually took effect.
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
