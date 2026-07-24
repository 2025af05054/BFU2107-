import { ArrowRight, Search, Users, Globe, Zap, Shield, Truck, Star, Heart, ShoppingCart, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import heroImage from "@/assets/hero-b2b.jpg";
import { useProducts } from "@/hooks/useProducts";
import { useRFQCart } from "@/hooks/useRFQCart";

const HomePage = () => {
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const { addIdentifiedProduct } = useRFQCart();

  const handleAddToRFQ = (product: any) => {
    addIdentifiedProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      supplier_name: product.supplier.company_name,
      category: product.category || 'General'
    });
    toast.success(`${product.name} added to RFQ cart`);
  };

  const featuredProducts = productsData?.products?.slice(0, 12) || [];
  const categories = ['Electronics', 'Industrial', 'Safety Equipment', 'Machinery', 'Materials'];
  const features = [
    {
      icon: Search,
      title: "Smart RFQ System",
      description: "Submit detailed requirements and get competitive quotes from verified suppliers."
    },
    {
      icon: Users,
      title: "Verified Network",
      description: "Connect with pre-screened suppliers and manufacturers you can trust."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Access suppliers from around the world with local support."
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description: "Get quotes quickly with our streamlined sourcing process."
    },
    {
      icon: Shield,
      title: "Secure Transactions",
      description: "Trade with confidence through our secure platform."
    },
    {
      icon: Truck,
      title: "End-to-End Tracking",
      description: "Monitor your orders from placement to delivery."
    }
  ];

  const steps = [
    {
      step: "01",
      title: "Submit RFQ",
      description: "Tell us what you need with detailed product requirements and specifications."
    },
    {
      step: "02", 
      title: "Get Matched",
      description: "Our team finds the best suppliers and aggregates competitive quotes for you."
    },
    {
      step: "03",
      title: "Compare & Choose", 
      description: "Review quotes, terms, and supplier profiles to make informed decisions."
    },
    {
      step: "04",
      title: "Place Order",
      description: "Confirm your purchase and track delivery through our platform."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section - Alibaba Style */}
      <section className="relative bg-gradient-to-br from-background via-muted/30 to-accent/10 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-repeat" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,.05) 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 text-sm font-semibold">
                  🚀 Smart Sourcing Solutions
                </Badge>
                <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
                  Making Sourcing
                  <span className="text-accent block"> Smarter & Faster</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                  Connect with verified suppliers, get competitive quotes, and streamline your procurement process with BUY FOR US.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="xl" className="text-lg font-bold" asChild>
                  <Link to="/rfq">
                    Start Sourcing Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" className="text-lg font-semibold" asChild>
                  <Link to="/rfq">
                    <FileText className="w-5 h-5 mr-2" />
                    Create RFQ
                  </Link>
                </Button>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">1000+</div>
                  <div className="text-sm text-muted-foreground">Verified Suppliers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">50K+</div>
                  <div className="text-sm text-muted-foreground">Products Sourced</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">24/7</div>
                  <div className="text-sm text-muted-foreground">Support</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 gradient-hero rounded-2xl blur-lg opacity-20"></div>
              <img 
                src={heroImage} 
                alt="B2B Sourcing Platform" 
                className="relative w-full h-auto rounded-2xl shadow-hover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Search */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Find What You Need</h2>
              <p className="text-muted-foreground">Search our extensive catalog of products and suppliers</p>
            </div>
            <div className="flex gap-3">
              <Input 
                placeholder="Search for products, categories, or suppliers..." 
                className="h-12 text-lg shadow-card"
              />
              <Button size="lg" className="px-8">
                <Search className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {categories.map((category) => (
                <Badge key={category} variant="secondary" className="cursor-pointer hover:bg-accent/20 transition-colors">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">How BUY FOR US Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our streamlined process makes B2B sourcing simple, efficient, and reliable
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="card-hover border-border shadow-card text-center">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 bg-foreground text-background rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-button">
                    <span className="text-2xl font-bold">{step.step}</span>
                  </div>
                  <CardTitle className="text-xl text-foreground">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose BUY FOR US?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We provide comprehensive sourcing solutions that save time and reduce costs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover shadow-card border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-4">Featured Products</h2>
              <p className="text-xl text-muted-foreground">
                Discover top-quality products from our verified suppliers
              </p>
            </div>
            <Button variant="outline" size="lg" asChild>
              <Link to="/products">
                View All Products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productsLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="shadow-card">
                  <CardHeader className="p-0">
                    <Skeleton className="h-48 w-full rounded-t-lg" />
                  </CardHeader>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-4" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              featuredProducts.map((product) => (
                <Card key={product.id} className="card-hover shadow-card border-border overflow-hidden">
                  <CardHeader className="p-0 relative">
                    <div className="h-48 bg-muted flex items-center justify-center overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="text-6xl text-muted-foreground">📦</div>
                      )}
                    </div>
                    <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground">
                      {product.category || 'General'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-bold text-lg text-foreground line-clamp-2 mb-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          by {product.supplier?.company_name || 'Verified Supplier'}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                          ))}
                          <span className="text-sm text-muted-foreground ml-1">(4.8)</span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleAddToRFQ(product)}
                          className="text-xs font-semibold"
                        >
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Add to RFQ
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" asChild>
              <Link to="/products">
                View All Products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6 drop-shadow-sm">
            Ready to Transform Your Sourcing?
          </h2>
          <p className="text-xl text-black font-medium mb-8 max-w-2xl mx-auto drop-shadow-sm">
            Join thousands of businesses already using BUY FOR US to streamline their procurement process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" className="text-lg font-bold bg-black text-white hover:bg-gray-800 shadow-button" asChild>
              <Link to="/rfq">
                Start Your First RFQ
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" className="text-lg font-semibold bg-white/20 border-2 border-black text-black hover:bg-white/30 shadow-button" asChild>
              <Link to="/suppliers">
                Become a Supplier
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;