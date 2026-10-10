import { ArrowRight, Search, Users, Globe, Zap, Shield, Truck, Star, Heart, ShoppingCart, FileText, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import heroImage from "@/assets/hero-b2b.jpg";
import industriesImage from "@/assets/industries-showcase.jpg";
import capabilitiesImage from "@/assets/manufacturing-capabilities.jpg";
import qualityExportImage from "@/assets/quality-export-readiness.jpg";
import { useProducts } from "@/hooks/useProducts";
import { useRFQCart } from "@/contexts/RFQCartContext";

const HomePage = () => {
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const { addIdentifiedProduct } = useRFQCart();
  const navigate = useNavigate();
  const [supplierQuery, setSupplierQuery] = useState("");

  const handleSupplierSearch = () => {
    const handle = supplierQuery.trim().toLowerCase().replace(/^@/, '');
    if (!handle) return;
    navigate(`/s/${handle}`);
  };

  const handleAddToRFQ = (product: any) => {
    addIdentifiedProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      supplier_id: product.supplier_id,
      supplier_name: product.supplier.company_name,
      category: product.category || 'General'
    });
    toast.success(`${product.name} added to RFQ cart`);
  };

  const featuredProducts = productsData?.products?.slice(0, 12) || [];
  const categories = ['Castings', 'Forged Components', 'Custom-Machined Parts', 'Industrial', 'Machinery'];
  const features = [
    {
      icon: Search,
      title: "Factory-Direct Quotations",
      description: "We source quotations for industrial castings, forged components, and custom-machined metal parts directly from vetted Indian factories."
    },
    {
      icon: Users,
      title: "For Industrial Buyers",
      description: "Built for OEMs, industrial distributors, contract manufacturers, MRO companies, and machinery importers across Europe."
    },
    {
      icon: Globe,
      title: "Export to Europe",
      description: "We manage HS code classification, customs duty, CE marking applicability, and EU Machinery Regulation (2023/1230) scope for every order."
    },
    {
      icon: Zap,
      title: "Start Small, Scale Up",
      description: "Begin with samples and small trial orders before committing to full production runs — lower risk, faster qualification."
    },
    {
      icon: Shield,
      title: "Verified Quality Documentation",
      description: "Material certificates, dimensional inspection reports, traceability records, and required testing provided with every shipment."
    },
    {
      icon: Truck,
      title: "End-to-End Coordination",
      description: "We manage supplier reliability, production timelines, payment terms, shipping, and customer complaints on your behalf."
    }
  ];

  const steps = [
    {
      step: "01",
      title: "Share Your Requirement",
      description: "Send us your drawing, specification, or sample for the casting, forged part, or machined component you need."
    },
    {
      step: "02",
      title: "Factory Quotation",
      description: "We obtain a competitive quotation from a qualified Indian factory, including HS code and estimated landed cost to Europe."
    },
    {
      step: "03",
      title: "Sample & Qualification",
      description: "We coordinate first samples, inspection reports, and material certificates so you can qualify the part before committing."
    },
    {
      step: "04",
      title: "Production & Delivery",
      description: "We oversee production, quality checks, and export documentation, then ship and track delivery to your facility in Europe."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-foreground text-background overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}></div>
        <div className="absolute -top-24 -right-24 w-[32rem] h-[32rem] rounded-full bg-accent/20 blur-3xl"></div>

        <div className="relative container mx-auto px-4 py-16 md:py-28">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-5">
                <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-accent">
                  India → Europe · Industrial Sourcing
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                  Your Industrial Sourcing Partner in India
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-background/70 leading-relaxed max-w-lg">
                  Connect with qualified Indian manufacturers for castings, forgings, CNC-machined and
                  custom industrial components. From technical requirements and supplier qualification
                  to inspection and export coordination, we help simplify your sourcing journey.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="xl" className="text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                  <Link to="/rfq">
                    Submit an RFQ
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" className="text-lg font-semibold bg-transparent border-background/30 text-background hover:bg-background/10 hover:text-background" asChild>
                  <Link to="/products">
                    <FileText className="w-5 h-5 mr-2" />
                    Explore Our Capabilities
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4 border-t border-background/10">
                <div>
                  <div className="text-lg font-bold">Castings</div>
                  <div className="text-xs text-background/60">Sand, Investment, Die</div>
                </div>
                <div>
                  <div className="text-lg font-bold">Forgings</div>
                  <div className="text-xs text-background/60">Open & Closed Die</div>
                </div>
                <div>
                  <div className="text-lg font-bold">CNC Parts</div>
                  <div className="text-xs text-background/60">Custom Machining</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-accent/30 rounded-2xl blur-2xl opacity-40"></div>
              <img
                src={heroImage}
                alt="Industrial castings and machined parts ready for export to Europe"
                className="relative w-full h-auto rounded-2xl shadow-hover border border-background/10"
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

            <div className="mt-8 pt-8 border-t border-border text-center">
              <h3 className="text-lg font-semibold text-foreground mb-1">Know a Supplier's Portfolio ID?</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Search their unique ID to view their product portfolio directly
              </p>
              <div className="flex gap-3 max-w-lg mx-auto">
                <div className="flex-1 relative">
                  <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="e.g. trp"
                    value={supplierQuery}
                    onChange={(e) => setSupplierQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSupplierSearch()}
                    className="h-12 pl-10 shadow-card"
                  />
                </div>
                <Button size="lg" className="px-8" onClick={handleSupplierSearch} disabled={!supplierQuery.trim()}>
                  View Portfolio
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">How We Export to Europe</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A clear, documented process from first inquiry to delivery at your facility
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

      {/* Manufacturing Capabilities */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="sr-only">Our Manufacturing Capabilities</h2>
          <div className="group relative max-w-6xl mx-auto overflow-hidden rounded-2xl border border-border shadow-card hover:shadow-hover transition-shadow duration-300">
            <img
              src={capabilitiesImage}
              alt="Our manufacturing capabilities: castings, forgings, CNC machining, fabricated components, shafts and gears, and pump and valve components, sourced from trusted Indian suppliers for European industrial buyers. Quality focused, verified suppliers, on-time coordination, export ready."
              className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Industries We Serve */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="sr-only">Industries We Serve</h2>
          <div className="group relative max-w-6xl mx-auto overflow-hidden rounded-2xl border border-border shadow-card hover:shadow-hover transition-shadow duration-300">
            <img
              src={industriesImage}
              alt="Industries we serve: automotive and EV components, construction and earthmoving equipment, agricultural machinery, pumps valves and fluid handling, material handling and cranes, energy and power generation, rail and transportation, and general industrial machinery"
              className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Why European Buyers Choose Us</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We handle sourcing, quality, compliance, and logistics so you don't have to manage an Indian factory directly
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
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Featured Products</h2>
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

      {/* Quality Assurance & Export Readiness */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="sr-only">Quality Assurance &amp; Export Readiness</h2>
          <div className="group relative max-w-6xl mx-auto overflow-hidden rounded-2xl border border-border shadow-card hover:shadow-hover transition-shadow duration-300">
            <img
              src={qualityExportImage}
              alt="Quality and compliance: material certificates, dimensional inspection, traceability, supplier certifications, testing requirements, HS code and customs, EU product legislation, and CBAM and environmental assessment. Export readiness: from Indian factory to European industry via manufacturing and inspection, export documentation, shipping and logistics, and delivery to Europe."
              className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-6">
            Looking for a Reliable Manufacturing Partner in India?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-background/70 mb-8 max-w-2xl mx-auto">
            Share your technical requirements and let us help identify suitable manufacturing options —
            including factory quotation, HS code and compliance review for your casting, forging, or
            machined part.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" className="text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-button" asChild>
              <Link to="/rfq">
                Submit Your RFQ
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" className="text-lg font-semibold bg-transparent border-background/30 text-background hover:bg-background/10 hover:text-background shadow-button" asChild>
              <Link to="/about">
                Talk to Our Team
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;