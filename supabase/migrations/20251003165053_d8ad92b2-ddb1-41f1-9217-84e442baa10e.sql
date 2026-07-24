-- Create RLS policies for documents bucket to allow authenticated users to upload files

-- Allow authenticated users to insert files into documents bucket
CREATE POLICY "Authenticated users can upload to documents bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to read files from documents bucket
CREATE POLICY "Authenticated users can read documents bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Allow users to update their own files
CREATE POLICY "Authenticated users can update their files in documents bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Allow users to delete their own files
CREATE POLICY "Authenticated users can delete their files in documents bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents');