import { useState, useEffect } from "react";
import { CategoryCascadeSelect } from "@/components/CategoryCascadeSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCategoryTree, Category } from "@/hooks/useCategories";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Upload, Image, IndianRupee, Package, AlertCircle, CheckCircle, Sparkles } from "lucide-react";

const generateProductCode = () => `BFU${Math.floor(100000 + Math.random() * 900000)}`;

interface SupplierProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  category_id: string | null;
  sku: string | null;
  price: number | null;
  price_min: number | null;
  price_max: number | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
  supplier_name: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
}


const SupplierProducts = () => {
  const { user } = useAuth();
  const { data: categoryTree } = useCategoryTree();
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
  const [uploading, setUploading] = useState(false);
  const [beautifying, setBeautifying] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    category_id: '',
    price: '',
    price_min: '',
    price_max: '',
    images: [] as string[]
  });

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('supplier_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const findCategoryName = (categoryId: string): string => {
    const traverse = (cats: Category[]): string | null => {
      for (const cat of cats) {
        if (cat.id === categoryId) return cat.name;
        if (cat.children) {
          const found = traverse(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    return traverse(categoryTree || []) || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const productData = {
        name: formData.name,
        // Auto-generated once on creation; never asked of the supplier and
        // never regenerated on edit.
        sku: editingProduct ? formData.sku : generateProductCode(),
        description: formData.description,
        category: findCategoryName(formData.category_id) || formData.category,
        category_id: formData.category_id || null,
        price: formData.price ? parseFloat(formData.price) : null,
        price_min: formData.price_min ? parseFloat(formData.price_min) : null,
        price_max: formData.price_max ? parseFloat(formData.price_max) : null,
        images: formData.images.length > 0 ? formData.images : null,
        supplier_id: user.id,
        supplier_name: user.email || 'Unknown Supplier'
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('supplier_products')
          .update({...productData, status: 'pending'})
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success("Product updated successfully! It will need admin approval to be visible.");
      } else {
        const { error } = await supabase
          .from('supplier_products')
          .insert([{...productData, status: 'pending'}]);

        if (error) throw error;
        toast.success("Product added successfully! It will be visible after admin approval.");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error("Failed to save product");
    }
  };

  const handleBeautify = async () => {
    if (!formData.name.trim()) {
      toast.error("Enter a product name first");
      return;
    }

    setBeautifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('beautify-product', {
        body: {
          name: formData.name,
          category: findCategoryName(formData.category_id) || formData.category,
          price: formData.price || formData.price_min || formData.price_max,
          description: formData.description,
        },
      });

      if (error) throw error;
      if (!data?.description) throw new Error("No description returned");

      setFormData(prev => ({ ...prev, description: data.description }));
      toast.success("Description beautified! Feel free to edit it further.");
    } catch (error) {
      console.error('Error beautifying product:', error);
      toast.error("Couldn't beautify description right now. Your text is unchanged.");
    } finally {
      setBeautifying(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    setUploading(true);
    try {
      const uploadedImages = [];

      for (let i = 0; i < Math.min(files.length, 5); i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedImages.push(publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));

      toast.success(`${uploadedImages.length} image(s) uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (product: SupplierProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      description: product.description || '',
      category: product.category || '',
      category_id: product.category_id || '',
      price: product.price?.toString() || '',
      price_min: product.price_min?.toString() || '',
      price_max: product.price_max?.toString() || '',
      images: product.images || []
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('supplier_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      toast.success("Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error("Failed to delete product");
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: '',
      category_id: '',
      price: '',
      price_min: '',
      price_max: '',
      images: []
    });
    setEditingProduct(null);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
              <p className="text-muted-foreground mt-2">Manage your product catalog</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    {editingProduct ? (
                      <p className="text-sm text-muted-foreground mt-1">
                        Product Code: <span className="font-medium">{formData.sku}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">
                        A product code will be generated automatically on save.
                      </p>
                    )}
                  </div>

                  <CategoryCascadeSelect
                    value={formData.category_id || ''}
                    onChange={(value) => setFormData({ ...formData, category_id: value })}
                    label="Category"
                    required
                    showIcons
                  />

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Description</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleBeautify}
                        disabled={beautifying || !formData.name.trim()}
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        {beautifying ? "Beautifying..." : "Beautify with AI"}
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Describe your product, specifications, features... or fill in the basics and click Beautify with AI"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: fill in name, category, price and a rough description, then click "Beautify with AI" to polish it. Skip it if you'd rather write your own.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price">Fixed Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price_min">Min Price (₹)</Label>
                      <Input
                        id="price_min"
                        type="number"
                        step="0.01"
                        value={formData.price_min}
                        onChange={(e) => setFormData({ ...formData, price_min: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price_max">Max Price (₹)</Label>
                      <Input
                        id="price_max"
                        type="number"
                        step="0.01"
                        value={formData.price_max}
                        onChange={(e) => setFormData({ ...formData, price_max: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Product Images</Label>
                    <div className="mt-2">
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" disabled={uploading} asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading ? "Uploading..." : "Upload Images"}
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload up to 5 images. JPG, PNG or WEBP. Max 5MB each.
                      </p>
                    </div>

                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Product ${index + 1}`}
                              className="w-full h-24 object-cover rounded-md border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={() => removeImage(index)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingProduct ? 'Update Product' : 'Add Product'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No Products Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start building your product catalog by adding your first product
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Product
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden shadow-card hover:shadow-lg transition-shadow pt-0 gap-0">
                  {/* Image with overlaid status + actions, matching the public catalog's card style */}
                  <div className="relative aspect-video bg-muted">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-muted-foreground/40" />
                      </div>
                    )}
                    {product.images && product.images.length > 1 && (
                      <Badge className="absolute bottom-2 right-2">
                        <Image className="w-3 h-3 mr-1" />
                        +{product.images.length - 1}
                      </Badge>
                    )}
                    <Badge
                      className="absolute top-2 left-2"
                      variant={
                        product.status === 'approved' ? 'default' :
                        product.status === 'pending' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {product.status === 'approved' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                       product.status === 'pending' ? <AlertCircle className="w-3 h-3 mr-1" /> :
                       <AlertCircle className="w-3 h-3 mr-1" />}
                      {product.status}
                    </Badge>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 shadow-sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="secondary" className="h-8 w-8 shadow-sm">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{product.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(product.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <CardTitle className="text-base line-clamp-1">{product.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {product.category && (
                          <Badge variant="outline" className="text-xs font-normal">
                            {product.category}
                          </Badge>
                        )}
                        {product.sku && (
                          <span className="text-xs text-muted-foreground">{product.sku}</span>
                        )}
                      </div>
                    </div>

                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1 text-sm pt-1">
                      <IndianRupee className="w-4 h-4 text-muted-foreground" />
                      {product.price ? (
                        <span className="font-semibold">{product.price.toLocaleString('en-IN')}</span>
                      ) : product.price_min && product.price_max ? (
                        <span className="font-semibold">
                          {product.price_min.toLocaleString('en-IN')} - {product.price_max.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Price on request</span>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Added {new Date(product.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierProducts;