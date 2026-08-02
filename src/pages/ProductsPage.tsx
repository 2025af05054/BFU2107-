import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Filter, Grid, List, Heart, Plus, Loader2, FileText, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useProductsDirect } from "@/hooks/useProducts";
import { useRFQCart } from "@/contexts/RFQCartContext";
import { formatCurrency } from "@/lib/currency";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { ProductDetailDialog } from "@/components/ProductDetailDialog";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  priceMin?: number;
  priceMax?: number;
  image: string;
  images: string[];
  supplier: string;
  rating: number;
  inStock: boolean;
  isWishlisted: boolean;
}

const ProductsPage = () => {
  const { addIdentifiedProduct } = useRFQCart();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [supplierQuery, setSupplierQuery] = useState('');

  const handleSupplierSearch = () => {
    const handle = supplierQuery.trim().toLowerCase().replace(/^@/, '');
    if (!handle) return;
    navigate(`/s/${handle}`);
  };

  useEffect(() => {
    const search = searchParams.get('search');
    if (search !== null) setSearchQuery(search);
  }, [searchParams]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [priceRange, setPriceRange] = useState('all');
  const [wishlistedItems, setWishlistedItems] = useState<Set<string>>(new Set());
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Fetch products from Supabase
  const { data: productsData, isLoading, error } = useProductsDirect();

  // Deterministic pseudo-random number in [0, 1) seeded by product id, so
  // display values stay stable across re-renders/refetches instead of
  // flickering every time productsData changes.
  const seededRandom = (id: string): number => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    return (hash >>> 0) / 4294967295;
  };

  const categories = ['all', 'Electronics', 'Industrial', 'Safety Equipment', 'Machinery', 'Tools & Hardware', 'Materials', 'Chemicals', 'Textiles', 'Automotive', 'Medical Equipment'];

  // Filter thresholds are fixed at ₹1,000 / ₹10,000; labels display in the
  // viewer's currency without changing the underlying INR comparison.
  const priceRangeLabels = {
    low: `${formatCurrency(0)} - ${formatCurrency(1000)}`,
    medium: `${formatCurrency(1000)} - ${formatCurrency(10000)}`,
    high: `${formatCurrency(10000)}+`,
  };

  // Transform Supabase data to match Product interface
  const products: Product[] = useMemo(() => {
    if (!productsData || !Array.isArray(productsData)) return [];
    
    return productsData.map(product => {
      // Calculate price display - use range if available, otherwise single price
      let displayPrice = 0;
      if (product.price_min && product.price_max) {
        displayPrice = product.price_max; // Use max for sorting
      } else if (product.price) {
        displayPrice = product.price;
      } else if (product.price_min) {
        displayPrice = product.price_min;
      }

      return {
        id: product.id,
        name: product.name,
        category: product.category || getProductCategory(product.name, product.description),
        description: product.description,
        price: displayPrice,
        priceMin: product.price_min,
        priceMax: product.price_max,
        image: product.images && product.images.length > 0 ? product.images[0] : '/placeholder.svg',
        images: product.images || [],
        supplier: product.supplier.company_name || 'Unknown Supplier',
        rating: 4.0 + seededRandom(product.id) * 1, // Stable placeholder rating between 4.0-5.0
        inStock: seededRandom(product.id + '-stock') > 0.1, // Stable placeholder stock status
        isWishlisted: wishlistedItems.has(product.id)
      };
    });
  }, [productsData, wishlistedItems]);

  // Helper function to categorize products based on name/description
  const getProductCategory = (name: string, description: string): string => {
    const text = (name + ' ' + description).toLowerCase();
    
    if (text.includes('electronic') || text.includes('led') || text.includes('circuit')) return 'Electronics';
    if (text.includes('steel') || text.includes('metal') || text.includes('pipe')) return 'Industrial';
    if (text.includes('safety') || text.includes('helmet') || text.includes('ppe')) return 'Safety';
    if (text.includes('pump') || text.includes('motor') || text.includes('machine')) return 'Machinery';
    if (text.includes('tool') || text.includes('wrench') || text.includes('hammer')) return 'Tools';
    
    return 'Materials';
  };

  const handleAddToRFQ = (product: Product) => {
    addIdentifiedProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      supplier_name: product.supplier,
      category: product.category
    });
  };

  const handleWishlist = (productId: string) => {
    const newWishlistedItems = new Set(wishlistedItems);
    const product = products.find(p => p.id === productId);
    
    if (wishlistedItems.has(productId)) {
      newWishlistedItems.delete(productId);
      toast.success(`${product?.name} removed from wishlist`);
    } else {
      newWishlistedItems.add(productId);
      toast.success(`${product?.name} added to wishlist`);
    }
    
    setWishlistedItems(newWishlistedItems);
  };

  const handleOpenDetail = (productId: string) => {
    setSelectedProductId(productId);
    setDetailOpen(true);
  };

  // Helper function to format price display. Stored prices are in INR;
  // formatCurrency converts to USD automatically for non-Indian viewers.
  const formatPrice = (product: Product): string => {
    if (product.priceMin && product.priceMax) {
      if (product.priceMin === product.priceMax) {
        return formatCurrency(product.priceMin);
      }
      return `${formatCurrency(product.priceMin)} - ${formatCurrency(product.priceMax)}`;
    } else if (product.priceMin) {
      return `${formatCurrency(product.priceMin)}+`;
    } else if (product.price > 0) {
      return formatCurrency(product.price);
    }
    return 'Price on request';
  };
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesPrice = priceRange === 'all' || 
        (priceRange === 'low' && (product.priceMax || product.price) <= 1000) ||
        (priceRange === 'medium' && (product.priceMin || product.price) > 1000 && (product.priceMax || product.price) <= 10000) ||
        (priceRange === 'high' && (product.priceMin || product.price) > 10000);
      
      return matchesSearch && matchesCategory && matchesPrice;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [products, searchQuery, selectedCategory, priceRange, sortBy]);

  const selectedProduct = products.find(p => p.id === selectedProductId) || null;

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
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Products</h3>
            <p className="text-muted-foreground">Failed to load products. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">🛒 Product Catalog</h1>
        <p className="text-muted-foreground">Browse our extensive catalog of admin-curated products. Add items to your RFQ or save them to your wishlist</p>
      </div>

      {/* Search Supplier by Portfolio ID */}
      <Card className="shadow-card mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search supplier by portfolio ID (e.g. rayban_traders)..."
                value={supplierQuery}
                onChange={(e) => setSupplierQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSupplierSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSupplierSearch} disabled={!supplierQuery.trim()}>
              View Supplier Portfolio
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="shadow-card mb-6 md:mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products by name, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters - desktop */}
            <div className="hidden lg:flex flex-row gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="low">{priceRangeLabels.low}</SelectItem>
                  <SelectItem value="medium">{priceRangeLabels.medium}</SelectItem>
                  <SelectItem value="high">{priceRangeLabels.high}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters - mobile: compact sheet trigger */}
            <div className="flex lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters & Sort
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters & Sort</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 mt-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Category</p>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category === 'all' ? 'All Categories' : category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Price Range</p>
                      <Select value={priceRange} onValueChange={setPriceRange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Price Range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Prices</SelectItem>
                          <SelectItem value="low">{priceRangeLabels.low}</SelectItem>
                          <SelectItem value="medium">{priceRangeLabels.medium}</SelectItem>
                          <SelectItem value="high">{priceRangeLabels.high}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Sort By</p>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name A-Z</SelectItem>
                          <SelectItem value="price-low">Price: Low to High</SelectItem>
                          <SelectItem value="price-high">Price: High to Low</SelectItem>
                          <SelectItem value="rating">Highest Rated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <p className="text-sm md:text-base text-muted-foreground">
              Showing {filteredProducts.length} of {products.length} products
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-3' : 'space-y-4'}>
          {filteredProducts.map((product) => (
            viewMode === 'grid' ? (
              <div
                key={product.id}
                className="relative aspect-square rounded-md sm:rounded-lg overflow-hidden bg-muted cursor-pointer group"
                onClick={() => handleOpenDetail(product.id)}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Watermark: product name overlay, Instagram-style bottom gradient */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-8 pb-2 px-2">
                  <p className="text-white text-xs sm:text-sm font-semibold drop-shadow-md line-clamp-1">
                    {product.name}
                  </p>
                  <p className="text-white/90 text-[11px] sm:text-xs font-medium drop-shadow-md">
                    {formatPrice(product)}
                  </p>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10 h-7 w-7 sm:h-8 sm:w-8 bg-black/30 hover:bg-black/50 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWishlist(product.id);
                  }}
                >
                  <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${product.isWishlisted ? 'fill-current text-red-500' : ''}`} />
                </Button>

                {product.images.length > 1 && (
                  <div className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10 flex gap-0.5">
                    {product.images.slice(0, 5).map((_, i) => (
                      <span key={i} className="w-1 h-1 rounded-full bg-white/80" />
                    ))}
                  </div>
                )}

                {!product.inStock && (
                  <Badge variant="destructive" className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10 text-[10px]">
                    Out of Stock
                  </Badge>
                )}
              </div>
            ) : (
            <Card key={product.id} className="shadow-card hover:shadow-button transition-spring group flex-row overflow-hidden">
              {(
                <div className="flex flex-col sm:flex-row w-full">
                  <div className="w-full sm:w-64 p-4 shrink-0">
                    <div className="relative">
                      <ProductImageCarousel
                        images={product.images}
                        productName={product.name}
                      />
                      {!product.inStock && (
                        <Badge variant="destructive" className="absolute bottom-1 left-1 text-xs z-10">
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div>
                        <CardTitle className="text-lg sm:text-xl mb-1">{product.name}</CardTitle>
                        <Badge variant="secondary">{product.category}</Badge>
                      </div>
                      <Button
                        size="icon"
                        variant={product.isWishlisted ? "default" : "outline"}
                        onClick={() => handleWishlist(product.id)}
                        className="shrink-0"
                      >
                        <Heart className={`w-4 h-4 ${product.isWishlisted ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                    <CardDescription className="mb-4">
                      {product.description}
                    </CardDescription>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {formatPrice(product)}
                          </p>
                          <p className="text-sm text-muted-foreground">{product.supplier} • ⭐ {product.rating.toFixed(1)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWishlist(product.id)}
                          >
                            <Heart className={`w-4 h-4 ${product.isWishlisted ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            onClick={() => handleAddToRFQ(product)}
                            disabled={!product.inStock}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Add to RFQ
                          </Button>
                        </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
            )
          ))}
        </div>
      )}

      <ProductDetailDialog
        product={selectedProduct}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        formatPrice={formatPrice}
        onWishlist={handleWishlist}
        onAddToRFQ={handleAddToRFQ}
      />
    </div>
  );
};

export default ProductsPage;