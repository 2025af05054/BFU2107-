-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload RFQ images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view RFQ images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their RFQ images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their RFQ images" ON storage.objects;

-- Create proper storage policies for RFQ image uploads
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

-- Assign customer role to current user if they don't have one
DO $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  SELECT '881027fd-0137-4d47-87e2-d7c97240d000'::uuid, 'customer'::app_role
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = '881027fd-0137-4d47-87e2-d7c97240d000'::uuid
  );
END $$;