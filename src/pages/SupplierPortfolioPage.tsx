import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Loader2, ArrowLeft, Grid3x3, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useRFQCart } from "@/contexts/RFQCartContext";
import { formatCurrency } from "@/lib/currency";
import { ProductDetailDialog } from "@/components/ProductDetailDialog";

interface PortfolioRow {
  supplier_id: string;
  username: string;
  company_name: string;
  bio: string | null;
  logo_url: string | null;
  contact_info: any;
  supplier_created_at: string;
  product_id: string | null;
  product_name: string | null;
  product_description: string | null;
  product_price: number | null;
  product_price_min: number | null;
  product_price_max: number | null;
  product_images: string[] | null;
  product_category: string | null;
  product_sku: string | null;
  product_status: string | null;
  product_created_at: string | null;
}

const usePortfolio = (username: string | undefined) =>
  useQuery<PortfolioRow[]>({
    queryKey: ["supplier-portfolio", username],
    queryFn: async () => {
      if (!username) return [];
      const { data, error } = await supabase.rpc("get_supplier_portfolio", {
        p_username: username,
      });
      if (error) throw error;
      return (data as PortfolioRow[]) || [];
    },
    enabled: !!username,
  });

const SupplierPortfolioPage = () => {
  const { username } = useParams<{ username: string }>();
  const { data: rows, isLoading, error } = usePortfolio(username);
  const { addIdentifiedProduct } = useRFQCart();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const supplier = rows && rows.length > 0 ? rows[0] : null;

  const products = useMemo(
    () => (rows || []).filter((r) => r.product_id !== null),
    [rows]
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((r) =>
      r.product_name?.toLowerCase().includes(q) ||
      r.product_description?.toLowerCase().includes(q) ||
      r.product_category?.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const formatPrice = (row: PortfolioRow): string => {
    if (row.product_price_min && row.product_price_max) {
      return row.product_price_min === row.product_price_max
        ? formatCurrency(row.product_price_min)
        : `${formatCurrency(row.product_price_min)} - ${formatCurrency(row.product_price_max)}`;
    }
    if (row.product_price_min) return `${formatCurrency(row.product_price_min)}+`;
    if (row.product_price) return formatCurrency(row.product_price);
    return "Price on request";
  };

  const selectedRow = products.find((p) => p.product_id === selectedProductId) || null;
  const selectedForDialog = selectedRow
    ? {
        id: selectedRow.product_id!,
        name: selectedRow.product_name || "",
        category: selectedRow.product_category || "Uncategorized",
        description: selectedRow.product_description || "",
        images: selectedRow.product_images || [],
        supplier: supplier?.company_name || "",
        rating: 5,
        inStock: true,
        isWishlisted: false,
      }
    : null;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Portfolio Not Found</h3>
            <p className="text-muted-foreground mb-4">
              No supplier with this ID exists, or the link is incorrect.
            </p>
            <Button asChild variant="outline">
              <Link to="/products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contactInfo = typeof supplier.contact_info === "object" && supplier.contact_info !== null
    ? (supplier.contact_info as any)
    : {};

  return (
    <div className="min-h-screen">
      {/* Cover banner */}
      <div className="h-32 sm:h-48 w-full bg-gradient-to-r from-amber-500 via-primary to-primary/80" />

      <div className="container mx-auto px-4">
        {/* Header, Instagram-profile style */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 -mt-12 sm:-mt-16 pb-6">
          <Avatar className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 border-4 border-background shadow-lg">
            <AvatarImage src={supplier.logo_url || undefined} alt={supplier.company_name} />
            <AvatarFallback className="text-3xl font-bold bg-primary/10">
              {supplier.company_name?.charAt(0)?.toUpperCase() || "S"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left pb-1">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <h1 className="text-xl sm:text-2xl font-bold">{supplier.company_name}</h1>
              <Badge className="bg-foreground text-background font-semibold px-3 py-1 text-sm shadow-sm">
                @{supplier.username}
              </Badge>
            </div>
            {supplier.bio && (
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">{supplier.bio}</p>
            )}
            <div className="flex items-center gap-4 mt-2 justify-center sm:justify-start flex-wrap">
              <span className="text-sm">
                <span className="font-semibold">{products.length}</span>{" "}
                <span className="text-muted-foreground">products</span>
              </span>
              {contactInfo.address && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {contactInfo.address}
                </span>
              )}
              {contactInfo.phone && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  {contactInfo.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="border-t mb-1" />
        <div className="flex items-center justify-center sm:justify-start gap-2 py-3 text-sm font-medium text-muted-foreground">
          <Grid3x3 className="w-4 h-4" />
          PORTFOLIO
        </div>

        {products.length > 0 && (
          <div className="relative max-w-md mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={`Search ${supplier.company_name}'s products...`}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-20 border rounded-lg">
            <p className="text-muted-foreground">This supplier hasn't added any products yet.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 border rounded-lg">
            <p className="text-muted-foreground">No products match "{productSearch}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 pb-10">
            {filteredProducts.map((row) => (
              <div
                key={row.product_id}
                className="relative aspect-square rounded-sm sm:rounded-md overflow-hidden bg-muted cursor-pointer group"
                onClick={() => {
                  setSelectedProductId(row.product_id);
                  setDetailOpen(true);
                }}
              >
                <img
                  src={row.product_images?.[0] || "/placeholder.svg"}
                  alt={row.product_name || ""}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-10 pb-2 px-2">
                  <p className="text-white text-xs sm:text-sm font-semibold drop-shadow-md line-clamp-1">
                    {row.product_name}
                  </p>
                  <p className="text-white/90 text-[11px] sm:text-xs font-medium drop-shadow-md">
                    {formatPrice(row)}
                  </p>
                </div>
                {row.product_status !== "approved" && (
                  <Badge variant="outline" className="absolute top-1.5 left-1.5 z-10 text-[10px] bg-background/90">
                    Pending approval
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ProductDetailDialog
        product={selectedForDialog}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        formatPrice={(p) => {
          const row = products.find((r) => r.product_id === p.id);
          return row ? formatPrice(row) : "Price on request";
        }}
        onWishlist={() => {}}
        onAddToRFQ={(p) => {
          addIdentifiedProduct({
            id: p.id,
            name: p.name,
            description: p.description,
            supplier_name: supplier.company_name,
            category: p.category,
          });
        }}
      />
    </div>
  );
};

export default SupplierPortfolioPage;
