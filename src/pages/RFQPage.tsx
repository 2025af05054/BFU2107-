import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Package, Loader2, Upload, ShoppingCart, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSupabaseWorkflow, CreateRFQData } from "@/hooks/useSupabaseWorkflow";
import { useAuth } from "@/contexts/AuthContext";
import { useRFQCart } from "@/hooks/useRFQCart";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  name?: string;
  company?: string;
  mobile?: string;
  address?: string;
  gst?: string;
}

const RFQPage = () => {
  const navigate = useNavigate();
  const { submitRFQ } = useSupabaseWorkflow();
  const { user } = useAuth();
  const { products, addUnidentifiedProduct, addMultipleUnidentifiedProducts, updateProduct, removeProduct, clearCart } = useRFQCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [uploading, setUploading] = useState<string | null>(null);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('name, company, mobile, address, gst')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data) {
        setUserProfile(data);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  // Check for sourcing data and auto-fill products (works for both authenticated and non-authenticated users)
  useEffect(() => {
    const sourcingDataStr = localStorage.getItem('sourcingData');
    if (!sourcingDataStr) return;
    
    try {
      const sourcingData = JSON.parse(sourcingDataStr);
      
      // Check if data is not too old (within 1 hour)
      const isRecent = (Date.now() - sourcingData.timestamp) < 3600000;
      
      if (isRecent && sourcingData.product_candidates?.length > 0) {
        console.log('Auto-filling products from sourcing data:', sourcingData.product_candidates);
        
        // Transform candidates into product data format
        const productsData = sourcingData.product_candidates.map((candidate: any) => ({
          name: candidate.productName || '',
          description: candidate.description || '',
          quantity: candidate.quantity || 1,
          targetPrice: candidate.targetPrice || 0,
          targetLeadTime: candidate.targetLeadTime || 14,
          manufacturer: candidate.manufacturer || '',
        }));
        
        // Add all products at once
        addMultipleUnidentifiedProducts(productsData);
        
        toast.success(`Auto-filled ${sourcingData.product_candidates.length} product(s) from AI Sourcing Assistant!`);
        
        // Clear the sourcing data after using it
        localStorage.removeItem('sourcingData');
      }
    } catch (err) {
      console.error('Error parsing sourcing data:', err);
      localStorage.removeItem('sourcingData');
    }
  }, [addMultipleUnidentifiedProducts]);

  const handleImageUpload = async (productId: string, file: File) => {
    if (!user) return;
    
    setUploading(productId);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${productId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      
      const product = products.find(p => p.id === productId);
      const currentImages = product?.images || [];
      
      updateProduct(productId, {
        images: [...currentImages, publicUrl]
      });
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(null);
    }
  };

  const removeImage = (productId: string, imageUrl: string) => {
    const product = products.find(p => p.id === productId);
    if (product?.images) {
      updateProduct(productId, {
        images: product.images.filter(img => img !== imageUrl)
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to submit RFQ");
      return;
    }

    if (products.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const rfqData: CreateRFQData = {
        products: products.map(p => ({
          type: p.type,
          name: p.name,
          description: p.description || '',
          ...(p.manufacturer && { manufacturer: p.manufacturer }),
          quantity: p.quantity,
          ...(p.targetPrice && { target_price: p.targetPrice }),
          ...(p.targetLeadTime && { target_lead_time: p.targetLeadTime }),
          ...(p.images && p.images.length > 0 && { images: p.images }),
        }))
      };

      const rfqId = await submitRFQ(rfqData);
      
      if (rfqId) {
        toast.success("RFQ submitted successfully!");
        clearCart(); // Clear the cart after successful submission
        navigate('/rfq-dashboard');
      }
    } catch (error) {
      toast.error("Failed to submit RFQ. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Create Request for Quote (RFQ)</h1>
        <p className="text-muted-foreground">Submit your product requirements to receive competitive quotes from verified suppliers.</p>
        {products.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              <ShoppingCart className="w-4 h-4 inline mr-1" />
              {products.length} product{products.length > 1 ? 's' : ''} in RFQ cart
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input value={userProfile.name || user?.user_metadata?.name || ''} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Company</Label>
                <Input value={userProfile.company || user?.user_metadata?.company || ''} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Mobile</Label>
                <Input value={userProfile.mobile || ''} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>GST Number</Label>
                <Input value={userProfile.gst || ''} readOnly className="bg-muted" />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Textarea value={userProfile.address || ''} readOnly className="bg-muted" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Product Requirements</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add identified products from our catalog or specify unidentified products manually
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button type="button" onClick={() => navigate('/products')} variant="outline">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Browse Products
              </Button>
              <Button type="button" onClick={() => addUnidentifiedProduct()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Product
              </Button>
            </div>
            
            {products.map((product, index) => (
              <Card key={product.id} className="mb-4">
                <CardContent className="pt-6">
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {product.type === 'identified' ? (
                          <Package className="w-4 h-4 text-green-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-600" />
                        )}
                        <h4 className="font-medium">
                          {product.type === 'identified' ? 'Catalog Product' : 'Custom Product'} {index + 1}
                        </h4>
                        {product.supplierName && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {product.supplierName}
                          </span>
                        )}
                      </div>
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeProduct(product.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Product Name *</Label>
                        <Input
                          value={product.name}
                          onChange={(e) => updateProduct(product.id, { name: e.target.value })}
                          required
                          disabled={product.type === 'identified'}
                          className={product.type === 'identified' ? 'bg-muted' : ''}
                        />
                      </div>
                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => updateProduct(product.id, { quantity: parseInt(e.target.value) || 1 })}
                          required
                        />
                      </div>
                    </div>

                    {product.type === 'unidentified' && (
                      <div>
                        <Label>Manufacturer</Label>
                        <Input
                          value={product.manufacturer || ''}
                          onChange={(e) => updateProduct(product.id, { manufacturer: e.target.value })}
                          placeholder="Enter manufacturer name"
                        />
                      </div>
                    )}

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={product.description}
                        onChange={(e) => updateProduct(product.id, { description: e.target.value })}
                        disabled={product.type === 'identified'}
                        className={product.type === 'identified' ? 'bg-muted' : ''}
                        placeholder={product.type === 'identified' ? 'Description from catalog' : 'Enter product description'}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Target Price (optional)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={product.targetPrice || ''}
                          onChange={(e) => updateProduct(product.id, { targetPrice: parseFloat(e.target.value) || undefined })}
                          placeholder="Enter target price"
                        />
                      </div>
                      <div>
                        <Label>Target Lead Time (days)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={product.targetLeadTime || 14}
                          onChange={(e) => updateProduct(product.id, { targetLeadTime: parseInt(e.target.value) || 14 })}
                          placeholder="Days"
                        />
                      </div>
                    </div>

                    {product.type === 'unidentified' && (
                      <div>
                        <Label>Product Images</Label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(product.id, file);
                                }
                              }}
                              className="hidden"
                              id={`image-upload-${product.id}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`image-upload-${product.id}`)?.click()}
                              disabled={uploading === product.id}
                            >
                              {uploading === product.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              Upload Image
                            </Button>
                          </div>
                          
                          {product.images && product.images.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {product.images.map((imageUrl, imgIndex) => (
                                <div key={imgIndex} className="relative group">
                                  <img
                                    src={imageUrl}
                                    alt={`Product ${index + 1} - ${imgIndex + 1}`}
                                    className="w-full h-20 object-cover rounded border"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeImage(product.id, imageUrl)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" size="lg" disabled={isSubmitting || products.length === 0}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit RFQ
        </Button>
      </form>
    </div>
  );
};

export default RFQPage;