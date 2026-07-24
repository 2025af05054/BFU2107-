-- Fix storage policies for RFQ image uploads
CREATE POLICY "Users can upload RFQ images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view RFQ images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Users can update their RFQ images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their RFQ images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure all authenticated users have a default customer role
INSERT INTO public.user_roles (user_id, role)
SELECT auth.users.id, 'customer'::app_role
FROM auth.users
LEFT JOIN public.user_roles ON auth.users.id = public.user_roles.user_id
WHERE public.user_roles.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;