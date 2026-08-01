import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useSuppliersDirect } from '@/hooks/useSuppliers';

interface ProductRow {
  name: string;
  brand: string;
  price_max: number;
  price_min: number;
  category: string;
  subcategory: string;
  quantity: string;
  description: string;
  breadcrumbs: string;
}

export default function AdminBulkProductImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: []
  });
  const [defaultSupplier, setDefaultSupplier] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: suppliers } = useSuppliersDirect();

  const parseCSV = (text: string): ProductRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(/[,\t]/).map(h => h.trim().toLowerCase());
    
    const products: ProductRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,\t]/);
      if (values.length < headers.length) continue;
      
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });
      
      products.push({
        name: row.name || '',
        brand: row.brand || '',
        price_max: parseFloat(row['price max'] || row.price_max || '0'),
        price_min: parseFloat(row['price min'] || row.price_min || '0'),
        category: row.category || 'Uncategorized',
        subcategory: row.subcategory || '',
        quantity: row.quantity || '',
        description: row.description || '',
        breadcrumbs: row.breadcrumbs || ''
      });
    }
    
    return products;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults({ success: 0, failed: 0, errors: [] });
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to import',
        variant: 'destructive'
      });
      return;
    }

    if (!defaultSupplier) {
      toast({
        title: 'No supplier selected',
        description: 'Please select a default supplier for the products',
        variant: 'destructive'
      });
      return;
    }

    setImporting(true);
    setProgress(0);
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    try {
      const text = await file.text();
      const products = parseCSV(text);
      
      if (products.length === 0) {
        throw new Error('No valid products found in file');
      }

      // Process in batches of 50
      const batchSize = 50;
      const batches = Math.ceil(products.length / batchSize);

      for (let b = 0; b < batches; b++) {
        const batchStart = b * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, products.length);
        const batch = products.slice(batchStart, batchEnd);

        const productsToInsert = batch.map(product => {
          const supplierName = product.brand || defaultSupplier;
          const fullName = product.brand 
            ? `${product.brand} ${product.name}`.trim()
            : product.name;
          
          const description = [
            product.description,
            product.quantity ? `Package: ${product.quantity}` : '',
            product.breadcrumbs ? `Category: ${product.breadcrumbs}` : ''
          ].filter(Boolean).join('\n\n');

          return {
            name: fullName,
            supplier_id: defaultSupplier,
            supplier_name: supplierName,
            description: description || null,
            price: product.price_min || null,
            price_min: product.price_min || null,
            price_max: product.price_max || null,
            category: product.category || 'Uncategorized',
            status: 'pending'
          };
        });

        const { data, error } = await supabase
          .from('supplier_products')
          .insert(productsToInsert)
          .select();

        if (error) {
          errors.push(`Batch ${b + 1}: ${error.message}`);
          failedCount += batch.length;
        } else {
          successCount += data?.length || 0;
        }

        setProgress(Math.round(((b + 1) / batches) * 100));
      }

      setResults({
        success: successCount,
        failed: failedCount,
        errors
      });

      toast({
        title: 'Import completed',
        description: `Successfully imported ${successCount} products. ${failedCount} failed.`,
        variant: successCount > 0 ? 'default' : 'destructive'
      });

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive'
      });
      setResults({
        success: 0,
        failed: 0,
        errors: [error.message]
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/admin/products')}>
          ← Back to Products
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Product Import
          </CardTitle>
          <CardDescription>
            Upload a CSV file with product data. Expected columns: Name, Brand, Price Max, Price Min, Category, SubCategory, Quantity, Description, BreadCrumbs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="supplier">Default Supplier *</Label>
              <Select
                value={defaultSupplier}
                onValueChange={setDefaultSupplier}
                disabled={importing}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Products with a Brand column use that as the display name, but are all assigned to this supplier account
              </p>
            </div>

            <div>
              <Label htmlFor="file">CSV File *</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileChange}
                disabled={importing}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Supported formats: CSV, TSV (tab-separated)
              </p>
            </div>

            {file && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <p className="text-sm">
                    <strong>Selected file:</strong> {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Size: {(file.size / 1024).toFixed(2)} KB
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing products...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {(results.success > 0 || results.failed > 0) && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">{results.success} products imported successfully</span>
                  </div>
                  {results.failed > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">{results.failed} products failed</span>
                    </div>
                  )}
                </div>

                {results.errors.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Errors:</p>
                    <div className="text-sm text-muted-foreground space-y-1 max-h-40 overflow-y-auto">
                      {results.errors.map((error, index) => (
                        <p key={index}>• {error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleImport}
              disabled={!file || !defaultSupplier || importing}
              className="flex-1"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Start Import
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/products')}
              disabled={importing}
            >
              Cancel
            </Button>
          </div>

          <Card className="bg-muted">
            <CardContent className="pt-6">
              <h4 className="font-medium mb-2">CSV Format Example:</h4>
              <pre className="text-xs overflow-x-auto bg-background p-3 rounded">
{`Name,Brand,Price max,Price min,Category,SubCategory,Quantity,Description,BreadCrumbs
Badam (Almonds),Premia,451,329,Grocery,Dry Fruits,500 gm,Premium quality,Grocery > Dry Fruits`}
              </pre>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
