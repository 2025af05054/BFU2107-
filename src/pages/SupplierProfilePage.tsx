import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Loader2, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useProductsDirect } from "@/hooks/useProducts";
import { useRFQCart } from "@/contexts/RFQCartContext";
import { formatCurrency } from "@/lib/currency";

interface SupplierRecord {
  id: string;
  company_name: string;
  contact_info: any;
  created_at: string;
}

const PLACEHOLDER_COMPANY_NAME = 'Company Name Required';

const useSupplierById = (id: string | undefined) =>
  useQuery<SupplierRecord | null>({
    queryKey: ['supplier', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, company_name, contact_info, created_at')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

const SupplierProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: supplier, isLoading, error } = useSupplierById(id);
  const { data: productsData, isLoading: productsLoading } = useProductsDirect();
  const { addIdentifiedProduct } = useRFQCart();

  const supplierProducts = useMemo(
    () => (productsData || []).filter((p) => p.supplier_id === id),
    [productsData, id]
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading supplier...</p>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Supplier Not Found</h3>
            <p className="text-muted-foreground mb-4">This supplier profile doesn't exist or is unavailable.</p>
            <Button asChild variant="outline">
              <Link to="/suppliers">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Suppliers
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contactInfo = (typeof supplier.contact_info === 'object' && supplier.contact_info !== null)
    ? supplier.contact_info as any
    : {};
  const displayName = supplier.company_name === PLACEHOLDER_COMPANY_NAME || !supplier.company_name
    ? 'Company name not provided'
    : supplier.company_name;
  const categories: string[] = Array.isArray(contactInfo.categories) ? contactInfo.categories : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-4 -ml-2">
        <Link to="/suppliers">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Suppliers
        </Link>
      </Button>

      <Card className="shadow-card mb-8">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-2xl">{displayName}</CardTitle>
                <Badge variant="secondary" className="bg-success/10 text-success">✓ Verified</Badge>
              </div>
              {contactInfo.description && (
                <CardDescription className="mt-2">{contactInfo.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {contactInfo.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{contactInfo.address}</span>
              </div>
            )}
            {contactInfo.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{contactInfo.phone}</span>
              </div>
            )}
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge key={category} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold mb-4">Products from {displayName}</h2>

      {productsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : supplierProducts.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">This supplier hasn't listed any approved products yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {supplierProducts.map((product) => (
            <Card key={product.id} className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                <Badge variant="secondary" className="w-fit text-xs">{product.category}</Badge>
                <CardDescription className="line-clamp-2">{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm font-medium">
                  {product.price_min && product.price_max
                    ? `${formatCurrency(product.price_min)} - ${formatCurrency(product.price_max)}`
                    : product.price
                      ? formatCurrency(product.price)
                      : 'Price on request'}
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    addIdentifiedProduct({
                      id: product.id,
                      name: product.name,
                      description: product.description,
                      supplier_name: product.supplier.company_name,
                      category: product.category,
                    })
                  }
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Add to RFQ
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupplierProfilePage;
