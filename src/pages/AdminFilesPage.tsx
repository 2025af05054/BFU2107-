import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { RoleBasedRoute } from '@/components/RoleBasedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UploadCloud, File as FileIcon, Download, Trash2, Loader2, FolderOpen } from 'lucide-react';

interface AdminFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

const BUCKET = 'admin-files';

const formatBytes = (bytes: number | null) => {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const AdminFilesPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { data: files, isLoading } = useQuery({
    queryKey: ['admin-files'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_files')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AdminFile[];
    },
  });

  const uploadFiles = async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    setUploading(true);
    try {
      for (const file of filesArray) {
        const fileExt = file.name.includes('.') ? file.name.split('.').pop() : '';
        const storageKey = `${Date.now()}-${Math.random().toString(36).slice(2)}${fileExt ? `.${fileExt}` : ''}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storageKey, file);
        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase.from('admin_files').insert({
          file_name: file.name,
          file_path: storageKey,
          file_type: file.type || null,
          file_size: file.size,
          uploaded_by: user?.id ?? null,
        });
        if (insertError) throw insertError;
      }

      toast({
        title: 'Upload complete',
        description: `${filesArray.length} file${filesArray.length > 1 ? 's' : ''} uploaded successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-files'] });
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (file: AdminFile) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.file_path, 60);
    if (error || !data?.signedUrl) {
      toast({ title: 'Error', description: 'Could not generate download link.', variant: 'destructive' });
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([deleteTarget.file_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('admin_files')
        .delete()
        .eq('id', deleteTarget.id);
      if (dbError) throw dbError;

      toast({ title: 'File deleted' });
      queryClient.invalidateQueries({ queryKey: ['admin-files'] });
    } catch (error) {
      console.error('File delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <RoleBasedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="container mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">File Storage</h1>
            <p className="text-muted-foreground">Upload and manage any type of file for internal admin use</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5" />
                Upload Files
              </CardTitle>
              <CardDescription>Any file type is accepted. Files are private and only visible to admins.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Uploading…</p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to browse or drag and drop files here</p>
                    <p className="text-xs text-muted-foreground">Any file type, multiple files supported</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Uploaded Files {files ? `(${files.length})` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !files || files.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  No files uploaded yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileIcon className="w-5 h-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(file.file_size)} · {new Date(file.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => handleDownload(file)}>
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(file)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this file?</AlertDialogTitle>
              <AlertDialogDescription>
                "{deleteTarget?.file_name}" will be permanently removed. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Layout>
    </RoleBasedRoute>
  );
};

export default AdminFilesPage;
