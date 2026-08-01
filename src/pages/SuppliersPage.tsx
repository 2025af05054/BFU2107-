import { useState, useMemo } from "react";
import { Search, MapPin, Star, Users, Package, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useSuppliersDirect } from "@/hooks/useSuppliers";

interface Supplier {
  id: string;
  name: string;
  description: string;
  location: string;
  categories: string[];
  rating: number;
  totalOrders: number;
  responseTime: string;
  verified: boolean;
  image: string;
  productsCount: number;
}

const SuppliersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch suppliers from Supabase
  const { data: suppliersData, isLoading, error } = useSuppliersDirect();

  // Helper functions for mock data generation
  const getSupplierDescription = (companyName: string): string => {
    const descriptions = [
      `Leading supplier of industrial equipment and automation solutions with 15+ years of experience.`,
      `Premium quality manufacturing and fabrication services for construction and industrial applications.`,
      `Specialized in industrial equipment and technical solutions for various industries.`,
      `Professional supplier of high-quality products and services for business clients.`,
      `Trusted partner for industrial solutions and equipment with excellent customer service.`
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  };

  const getRandomLocation = (): string => {
    const locations = [
      'Mumbai, Maharashtra',
      'Chennai, Tamil Nadu', 
      'Bangalore, Karnataka',
      'Pune, Maharashtra',
      'Ahmedabad, Gujarat',
      'Delhi, New Delhi',
      'Hyderabad, Telangana',
      'Kolkata, West Bengal'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  };

  const getCategoriesFromCompanyName = (companyName: string): string[] => {
    const name = companyName.toLowerCase();
    
    if (name.includes('tech') || name.includes('electronic')) return ['Electronics', 'Technology', 'Automation'];
    if (name.includes('steel') || name.includes('metal')) return ['Steel', 'Metal Fabrication', 'Construction'];
    if (name.includes('safe') || name.includes('guard')) return ['Safety Equipment', 'PPE', 'Industrial Safety'];
    if (name.includes('hydro') || name.includes('pump')) return ['Hydraulics', 'Pumps', 'Machinery'];
    if (name.includes('chemical')) return ['Chemicals', 'Laboratory Equipment', 'Processing'];
    if (name.includes('green') || name.includes('energy')) return ['Solar Equipment', 'Renewable Energy', 'Green Technology'];
    
    return ['General Equipment', 'Industrial Supplies', 'Manufacturing'];
  };

  const getRandomResponseTime = (): string => {
    const times = ['< 1 hour', '< 2 hours', '< 4 hours', '< 6 hours'];
    return times[Math.floor(Math.random() * times.length)];
  };

  // Transform Supabase data to match Supplier interface
  const suppliers: Supplier[] = useMemo(() => {
    if (!suppliersData || !Array.isArray(suppliersData)) return [];
    
    return suppliersData.map(supplier => ({
      id: supplier.id,
      name: supplier.company_name,
      description: getSupplierDescription(supplier.company_name),
      location: getRandomLocation(),
      categories: getCategoriesFromCompanyName(supplier.company_name),
      rating: 4.0 + Math.random() * 1, // Random rating between 4.0-5.0
      totalOrders: Math.floor(Math.random() * 3000) + 500,
      responseTime: getRandomResponseTime(),
      verified: Math.random() > 0.2, // 80% chance of being verified
      image: '/placeholder.svg',
      productsCount: Math.floor(Math.random() * 1000) + 100
    }));
  }, [suppliersData]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [suppliers, searchQuery]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Suppliers</h3>
            <p className="text-muted-foreground">Failed to load suppliers. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Verified Suppliers</h1>
        <p className="text-muted-foreground">Connect with trusted suppliers and manufacturers from across India</p>
      </div>

      {/* Search and Stats */}
      <div className="mb-8 space-y-6">
        {/* Search Bar */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search suppliers by name, location, or category..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">{suppliers.length}+</div>
              <div className="text-muted-foreground">Verified Suppliers</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-secondary mb-1">25+</div>
              <div className="text-muted-foreground">Categories</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-accent mb-1">98%</div>
              <div className="text-muted-foreground">Response Rate</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-success mb-1">{suppliers.length > 0 ? (suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1) : '4.7'}</div>
              <div className="text-muted-foreground">Avg. Rating</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Become a Supplier CTA */}
      <Card className="mb-8 gradient-hero text-white">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">Are you a supplier or manufacturer?</h3>
              <p className="text-white/90">Join our platform and connect with thousands of buyers looking for your products.</p>
            </div>
            <Button variant="premium" size="lg" className="bg-white text-primary hover:bg-white/90">
              <Users className="w-4 h-4 mr-2" />
              Become a Supplier
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="shadow-card hover:shadow-button transition-spring group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-3">
                <img 
                  src={supplier.image} 
                  alt={supplier.name}
                  className="w-16 h-16 rounded-lg bg-muted object-cover"
                />
                {supplier.verified && (
                  <Badge variant="secondary" className="bg-success/10 text-success">
                    ✓ Verified
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                {supplier.name}
              </CardTitle>
              <CardDescription>{supplier.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Location */}
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{supplier.location}</span>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {supplier.categories.slice(0, 3).map((category) => (
                  <Badge key={category} variant="outline" className="text-xs">
                    {category}
                  </Badge>
                ))}
                {supplier.categories.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{supplier.categories.length - 3} more
                  </Badge>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                 <div className="text-center">
                   <div className="flex items-center justify-center gap-1 mb-1">
                     <Star className="w-4 h-4 text-yellow-500 fill-current" />
                     <span className="font-semibold">{supplier.rating.toFixed(1)}</span>
                   </div>
                   <div className="text-xs text-muted-foreground">Rating</div>
                 </div>
                <div className="text-center">
                  <div className="font-semibold mb-1">{supplier.totalOrders.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Orders</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="font-semibold mb-1">{supplier.productsCount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Products</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold mb-1">{supplier.responseTime}</div>
                  <div className="text-xs text-muted-foreground">Response Time</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button variant="default" className="w-full" asChild>
                  <Link to={`/suppliers/${supplier.id}`}>
                    View Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full">
                  <Package className="w-4 h-4 mr-2" />
                  View Products
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center mt-12">
        <Button variant="outline" size="lg">
          Load More Suppliers
        </Button>
      </div>
    </div>
  );
};

export default SuppliersPage;