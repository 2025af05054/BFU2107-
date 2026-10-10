import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { RoleBasedRoute } from '@/components/RoleBasedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, Users } from 'lucide-react';

const PRODUCT_CATEGORIES = [
  'Castings', 'Forgings', 'CNC machining', 'Fabricated components',
  'Shafts & gears', 'Pumps', 'Valves',
];

// Column order expected in Sheet 1 of the supplier Excel (matches the vendor-research skill output)
const SHEET1_COLUMNS = [
  's_no', 'company_name', 'key_cluster', 'locality', 'full_address', 'contact_no', 'phone_type',
  'contact_person', 'email', 'website', 'material_type', 'capability', 'company_size', 'size_basis',
  'installed_capacity', 'specialty', 'certifications', 'year_established', 'source',
] as const;

interface VendorBatch {
  id: string;
  product_category: string;
  state: string;
  cluster: string;
  source: string | null;
  status: string;
  file_name: string;
  row_count: number;
  created_at: string;
}

const AdminVendorImportPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productCategory, setProductCategory] = useState('');
  const [state, setState] = useState('');
  const [cluster, setCluster] = useState('');
  const [source, setSource] = useState('Research');
  const [status, setStatus] = useState('Draft');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: batches, isLoading } = useQuery({
    queryKey: ['vendor-import-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_import_batches')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as VendorBatch[];
    },
  });

  const { data: totalVendorCount } = useQuery({
    queryKey: ['vendor-total-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const resetForm = () => {
    setProductCategory('');
    setState('');
    setCluster('');
    setSource('Research');
    setStatus('Draft');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!productCategory || !state.trim() || !cluster.trim() || !selectedFile) {
      toast({
        title: 'Missing fields',
        description: 'Product category, State, Cluster/City, and a file are all required.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const beforeCount = totalVendorCount ?? 0;

      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];

      // Data starts after the title row, note row, and header row (row 5 onward in the skill's template)
      const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
      const headerRowIdx = raw.findIndex((r) => String(r[1]).trim().toLowerCase() === 'company name');
      if (headerRowIdx === -1) {
        throw new Error('Could not find the header row ("Company Name" in column B) in Sheet 1 of this file.');
      }
      const dataRows = raw.slice(headerRowIdx + 1).filter((r) => r[1]);

      if (dataRows.length === 0) {
        throw new Error('No supplier rows found below the header row in Sheet 1.');
      }

      const { data: batch, error: batchError } = await supabase
        .from('vendor_import_batches')
        .insert({
          product_category: productCategory,
          state: state.trim(),
          cluster: cluster.trim(),
          source: source.trim() || null,
          status,
          file_name: selectedFile.name,
          row_count: dataRows.length,
          uploaded_by: user?.id ?? null,
        })
        .select()
        .single();
      if (batchError) throw batchError;

      const vendorRows = dataRows.map((r) => {
        const rec: Record<string, unknown> = {};
        SHEET1_COLUMNS.forEach((key, i) => { rec[key] = r[i] ?? null; });
        return {
          batch_id: batch.id,
          product_category: productCategory,
          state: state.trim(),
          cluster: cluster.trim(),
          company_name: String(rec.company_name ?? '').trim(),
          key_cluster: rec.key_cluster ? String(rec.key_cluster) : null,
          locality: rec.locality ? String(rec.locality) : null,
          full_address: rec.full_address ? String(rec.full_address) : null,
          contact_no: rec.contact_no ? String(rec.contact_no) : null,
          phone_type: rec.phone_type ? String(rec.phone_type) : null,
          contact_person: rec.contact_person ? String(rec.contact_person) : null,
          email: rec.email ? String(rec.email) : null,
          website: rec.website ? String(rec.website) : null,
          material_type: rec.material_type ? String(rec.material_type) : null,
          capability: rec.capability ? String(rec.capability) : null,
          company_size: rec.company_size ? String(rec.company_size) : null,
          size_basis: rec.size_basis ? String(rec.size_basis) : null,
          installed_capacity: rec.installed_capacity ? String(rec.installed_capacity) : null,
          specialty: rec.specialty ? String(rec.specialty) : null,
          certifications: rec.certifications ? String(rec.certifications) : null,
          year_established: rec.year_established ? String(rec.year_established) : null,
          source: rec.source ? String(rec.source) : null,
          status,
        };
      }).filter((v) => v.company_name);

      const { error: vendorsError } = await supabase.from('vendors').insert(vendorRows);
      if (vendorsError) throw vendorsError;

      await queryClient.invalidateQueries({ queryKey: ['vendor-import-batches'] });
      await queryClient.invalidateQueries({ queryKey: ['vendor-total-count'] });

      toast({
        title: 'Import complete',
        description: `${vendorRows.length} vendors imported for ${productCategory} - ${state} - ${cluster}. Total vendor count: ${beforeCount} → ${beforeCount + vendorRows.length}.`,
      });
      resetForm();
    } catch (error) {
      console.error('Vendor import error:', error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Please check the file format and try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <RoleBasedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="container mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vendor Import</h1>
            <p className="text-muted-foreground">Upload a supplier Excel dataset and import it into the vendor database</p>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Total vendors in database: <span className="font-semibold text-foreground">{totalVendorCount ?? '—'}</span>
            </span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5" />
                Import Excel
              </CardTitle>
              <CardDescription>
                Expects Sheet 1 with columns: S.No, Company Name, Key Cluster, Locality, Full Address, Contact No.,
                Phone Type, Contact Person, Email, Website, Product/Material Type, Products/Capability, Company Size,
                Size Basis, Installed Capacity, Specialty, Certifications, Year Established, Source.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product category *</Label>
                  <Select value={productCategory} onValueChange={setProductCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Gujarat" />
                </div>
                <div className="space-y-2">
                  <Label>Cluster / City *</Label>
                  <Input value={cluster} onChange={(e) => setCluster(e.target.value)} placeholder="e.g. Rajkot" />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Research" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Excel file (.xlsx) *</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={uploading} className="w-full md:w-auto">
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                Import Vendors
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Import History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : !batches || batches.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No imports yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {batches.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                          <p className="font-medium truncate">{b.product_category} — {b.state} — {b.cluster}</p>
                          <Badge variant={b.status === 'Published' ? 'default' : 'secondary'}>{b.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {b.file_name} · {b.row_count} vendors · {new Date(b.created_at).toLocaleString()}
                          {b.source ? ` · Source: ${b.source}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </RoleBasedRoute>
  );
};

export default AdminVendorImportPage;
