import { useState, useMemo } from "react";
import { Search, Loader2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useProductsDirect } from "@/hooks/useProducts";
import { useRFQCart } from "@/contexts/RFQCartContext";
import { formatCurrency } from "@/lib/currency";

interface BrowseProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BrowseProductsDialog = ({ open, onOpenChange }: BrowseProductsDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: productsData, isLoading } = useProductsDirect();
  const { addIdentifiedProduct } = useRFQCart();

  const filteredProducts = useMemo(() => {
    if (!productsData) return [];
    const query = searchQuery.toLowerCase();
    return productsData.filter(
      (p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
    );
  }, [productsData, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Browse Products</DialogTitle>
        </DialogHeader>

        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 -mx-1 px-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No products found.</p>
          ) : (
            filteredProducts.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <img
                    src={product.images?.[0] || '/placeholder.svg'}
                    alt={product.name}
                    className="w-14 h-14 rounded object-cover bg-muted shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {product.price_min && product.price_max
                          ? `${formatCurrency(product.price_min)} - ${formatCurrency(product.price_max)}`
                          : product.price
                            ? formatCurrency(product.price)
                            : 'Price on request'}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0"
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
                    <FileText className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BrowseProductsDialog;
