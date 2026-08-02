import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Heart, FileText, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductDetailProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  images: string[];
  supplier: string;
  rating: number;
  inStock: boolean;
  isWishlisted: boolean;
}

interface ProductDetailDialogProps {
  product: ProductDetailProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formatPrice: (product: ProductDetailProduct) => string;
  onWishlist: (productId: string) => void;
  onAddToRFQ: (product: ProductDetailProduct) => void;
}

export const ProductDetailDialog = ({
  product,
  open,
  onOpenChange,
  formatPrice,
  onWishlist,
  onAddToRFQ,
}: ProductDetailDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (open) setCurrentIndex(0);
  }, [open, product?.id]);

  if (!product) return null;

  const images = product.images && product.images.length > 0 ? product.images : ["/placeholder.svg"];

  const goToPrevious = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goToNext = () => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-4xl w-[95vw] sm:w-full overflow-hidden max-h-[90vh]">
        <div className="flex flex-col md:flex-row max-h-[90vh] overflow-y-auto md:overflow-hidden">
          {/* Image side */}
          <div className="relative w-full md:w-1/2 shrink-0 bg-muted flex items-center justify-center aspect-square">
            <img
              src={images[currentIndex]}
              alt={`${product.name} - ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />

            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full shadow-md"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full shadow-md"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        index === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-background/70"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            {!product.inStock && (
              <Badge variant="destructive" className="absolute top-3 left-3">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Details side */}
          <div className="flex flex-col w-full md:w-1/2 p-5 sm:p-6 pr-12 sm:pr-14">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 pr-2">{product.name}</h2>

            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{product.category}</Badge>
              <span className="text-sm font-medium text-muted-foreground">⭐ {product.rating.toFixed(1)}</span>
            </div>

            <p className="text-sm text-muted-foreground mb-6 whitespace-pre-line">{product.description}</p>

            <div className="mt-auto space-y-4">
              <div className="flex items-baseline justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="text-lg font-semibold text-foreground">{formatPrice(product)}</span>
              </div>
              <p className="text-sm text-muted-foreground">Supplier: {product.supplier}</p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onWishlist(product.id);
                    onOpenChange(false);
                  }}
                >
                  <Heart className={`w-4 h-4 mr-2 ${product.isWishlisted ? "fill-current" : ""}`} />
                  {product.isWishlisted ? "Wishlisted" : "Wishlist"}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    onAddToRFQ(product);
                    onOpenChange(false);
                  }}
                  disabled={!product.inStock}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Add to RFQ
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
