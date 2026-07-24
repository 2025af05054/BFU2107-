import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Save, X, Loader2, Upload, Image as ImageIcon, Check, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSuppliersDirect } from "@/hooks/useSuppliers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CategoryCascadeSelect } from "@/components/CategoryCascadeSelect";
import { useCategories } from "@/hooks/useCategories";

interface SupplierProduct {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  price_min: number | null;
  price_max: number | null; 
  category: string | null;
  category_id: string | null;
  images: string[] | null;
  supplier_id: string | null;
  supplier_name: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  suppliers?: {
    company_name: string;
  };
  categories?: {
    name: string;
    icon_url: string | null;
  };
}

interface ProductFormData {
  name: string;
  description: string;
  price_min: string;
  price_max: string;
  category_id: string;
  supplier_name: string;
}


const AdminProductsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price_min: '',
    price_max: '',
    category_id: '',
    supplier_name: ''
  });

  const { data: categories } = useCategories();

  // Fetch suppliers for the dropdown
  const { data: suppliers } = useSuppliersDirect();

  // Fetch products
  const { data: products, isLoading, error } = useQuery<SupplierProduct[]>({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_products')
        .select(`
          id,
          name,
          description,
          price,
          price_min,
          price_max,
          category,
          category_id,
          images,
          supplier_id,
          supplier_name,
          status,
          approved_by,
          approved_at,
          created_at,
          updated_at,
          suppliers(
            company_name
          ),
          categories(
            name,
            icon_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: { 
      name: string; 
      description: string | null; 
      price_min: number | null; 
      price_max: number | null; 
      category_id: string; 
      supplier_name: string; 
      images?: string[];
    }) => {
      // Upload images first if any
      let imageUrls: string[] = [];
      if (uploadedImages.length > 0) {
        imageUrls = await uploadImages(uploadedImages);
      }

      // Find or create supplier
      let supplierId = null;
      if (productData.supplier_name.trim()) {
        const { data: existingSupplier } = await supabase
          .from('suppliers')
          .select('id')
          .eq('company_name', productData.supplier_name.trim())
          .single();

        if (existingSupplier) {
          supplierId = existingSupplier.id;
        }
      }

      const { data, error } = await supabase
        .from('supplier_products')
        .insert([{ 
          ...productData, 
          supplier_id: supplierId,
          images: imageUrls 
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products-direct'] });
      toast({
        title: "Product Created",
        description: "Product has been successfully created.",
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
      console.error('Create product error:', error);
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...productData }: { 
      id: string;
      name?: string; 
      description?: string | null; 
      price_min?: number | null; 
      price_max?: number | null; 
      category_id?: string; 
      supplier_name?: string; 
      images?: string[];
    }) => {
      // Upload new images if any
      let newImageUrls: string[] = [...(imageUrls || [])];
      if (uploadedImages.length > 0) {
        const uploadedUrls = await uploadImages(uploadedImages);
        newImageUrls = [...newImageUrls, ...uploadedUrls];
      }

      // Find or create supplier if supplier_name is provided
      let supplierId = null;
      if (productData.supplier_name && productData.supplier_name.trim()) {
        const { data: existingSupplier } = await supabase
          .from('suppliers')
          .select('id')
          .eq('company_name', productData.supplier_name.trim())
          .single();

        if (existingSupplier) {
          supplierId = existingSupplier.id;
        }
      }

      const { data, error } = await supabase
        .from('supplier_products')
        .update({ 
          ...productData, 
          supplier_id: supplierId,
          images: newImageUrls 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products-direct'] });
      toast({
        title: "Product Updated",
        description: "Product has been successfully updated.",
      });
      setEditingProduct(null);
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
      console.error('Update product error:', error);
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('supplier_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products-direct'] });
      toast({
        title: "Product Deleted",
        description: "Product has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
      console.error('Delete product error:', error);
    },
  });

  // Approve product mutation
  const approveProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('supplier_products')
        .update({ 
          status: 'approved',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products-direct'] });
      toast({
        title: "Product Approved",
        description: "Product has been approved and is now visible to customers.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve product. Please try again.",
        variant: "destructive",
      });
      console.error('Approve product error:', error);
    },
  });

  // Reject product mutation
  const rejectProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('supplier_products')
        .update({ 
          status: 'rejected',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products-direct'] });
      toast({
        title: "Product Rejected",
        description: "Product has been rejected.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reject product. Please try again.",
        variant: "destructive",
      });
      console.error('Reject product error:', error);
    },
  });

  // Upload images to Supabase storage
  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price_min: '',
      price_max: '',
      category_id: '',
      supplier_name: ''
    });
    setEditingProduct(null);
    setUploadedImages([]);
    setImageUrls([]);
  };

  const handleEdit = (product: SupplierProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price_min: product.price_min?.toString() || '',
      price_max: product.price_max?.toString() || '',
      category_id: product.category_id || '',
      supplier_name: product.suppliers?.company_name || ''
    });
    setImageUrls(product.images || []);
    setIsDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Please select only image files.",
        variant: "destructive",
      });
    }
    
    setUploadedImages(prev => [...prev, ...imageFiles]);
  };

  const removeImage = (index: number, isUploaded: boolean = false) => {
    if (isUploaded) {
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setImageUrls(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.category_id) {
      toast({
        title: "Validation Error",
        description: "Please fill in the required fields (Name and Category).",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price_min: formData.price_min ? parseFloat(formData.price_min) : null,
      price_max: formData.price_max ? parseFloat(formData.price_max) : null,
      category_id: formData.category_id,
      supplier_name: formData.supplier_name.trim()
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, ...productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-destructive">Error loading products. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Product Management</h1>
            <p className="text-muted-foreground">Manage supplier products in the system</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.href = '/admin/products/import'}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct ? 'Update the product details below.' : 'Enter the details for the new product.'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  
                  <CategoryCascadeSelect
                    value={formData.category_id}
                    onChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                    label="Category"
                    required
                    showIcons
                  />
                  
                  <div className="grid gap-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                      placeholder="Enter supplier name (optional)"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price_min">Min Price (₹)</Label>
                      <Input
                        id="price_min"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price_min}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_min: e.target.value }))}
                        placeholder="Min price"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price_max">Max Price (₹)</Label>
                      <Input
                        id="price_max"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price_max}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_max: e.target.value }))}
                        placeholder="Max price"
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter product description"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Product Images</Label>
                    <div className="space-y-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Images
                      </Button>
                      
                      {/* Display existing images */}
                      {imageUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {imageUrls.map((url, index) => (
                            <div key={index} className="relative">
                              <img 
                                src={url} 
                                alt={`Product ${index + 1}`}
                                className="w-full h-20 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                onClick={() => removeImage(index, false)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Display newly uploaded images */}
                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {uploadedImages.map((file, index) => (
                            <div key={index} className="relative">
                              <img 
                                src={URL.createObjectURL(file)} 
                                alt={`Upload ${index + 1}`}
                                className="w-full h-20 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                onClick={() => removeImage(index, true)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setIsDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  >
                    {createProductMutation.isPending || updateProductMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {editingProduct ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products ({products?.length || 0})</CardTitle>
          <CardDescription>
            All supplier products in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products && products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Price Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">ID: {product.id.slice(0, 8)}...</p>
                          {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {product.categories?.icon_url && (
                          <div className="w-6 h-6 rounded-full overflow-hidden">
                            <img src={product.categories.icon_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-sm text-sm">
                          {product.categories?.name || product.category || 'Uncategorized'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{product.supplier_name || product.suppliers?.company_name || 'No supplier'}</TableCell>
                    <TableCell>
                      {product.price_min && product.price_max ? (
                        `₹${product.price_min.toLocaleString()} - ₹${product.price_max.toLocaleString()}`
                      ) : product.price ? (
                        `₹${product.price.toLocaleString()}`
                      ) : (
                        'Not set'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          product.status === 'approved' ? 'default' : 
                          product.status === 'pending' ? 'secondary' : 
                          'destructive'
                        }
                        className="flex items-center gap-1 w-fit"
                      >
                        {product.status === 'approved' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : product.status === 'pending' ? (
                          <AlertCircle className="w-3 h-3" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        {product.status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(product.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {product.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => approveProductMutation.mutate(product.id)}
                              disabled={approveProductMutation.isPending}
                              className="text-green-700 hover:text-green-900"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => rejectProductMutation.mutate(product.id)}
                              disabled={rejectProductMutation.isPending}
                              className="text-red-700 hover:text-red-900"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this product?')) {
                              deleteProductMutation.mutate(product.id);
                            }
                          }}
                          disabled={deleteProductMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No products found.</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Product
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProductsPage;