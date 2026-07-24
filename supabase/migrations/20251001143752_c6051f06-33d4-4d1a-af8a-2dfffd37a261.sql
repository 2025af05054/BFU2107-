-- Create storage bucket for sourcing documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for documents bucket
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view documents in sourcing folder"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'sourcing');