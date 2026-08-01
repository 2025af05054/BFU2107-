import { useState, useMemo } from "react";
import { Search, MapPin, Users, ArrowRight, Loader2 } from "lucide-react";
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
  verified: boolean;
}

const PLACEHOLDER_COMPANY_NAME = 'Company Name Required';

const SuppliersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch suppliers from Supabase
  const { data: suppliersData, isLoading, error } = useSuppliersDirect();

  // Transform Supabase data to match Supplier interface using only real
  // profile data (contact_info) - no fabricated ratings/orders/locations.
  const suppliers: Supplier[] = useMemo(() => {
    if (!suppliersData || !Array.isArray(suppliersData)) return [];

    return suppliersData
      .filter(supplier => supplier.company_name && supplier.company_name !== PLACEHOLDER_COMPANY_NAME)
      .map(supplier => {
        const contactInfo = (typeof supplier.contact_info === 'object' && supplier.contact_info !== null)
          ? supplier.contact_info as any
          : {};
        return {
          id: supplier.id,
          name: supplier.company_name,
          description: contactInfo.description || 'No description provided yet.',
          location: contactInfo.address || 'Location not provided',
          categories: Array.isArray(contactInfo.categories) && contactInfo.categories.length > 0
            ? contactInfo.categories
            : ['Uncategorized'],
          verified: true,
        };
      });
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
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">{suppliers.length}</div>
              <div className="text-muted-foreground">Verified Suppliers</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-secondary mb-1">
                {new Set(suppliers.flatMap(s => s.categories)).size}
              </div>
              <div className="text-muted-foreground">Categories</div>
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
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                  {supplier.name.charAt(0).toUpperCase()}
                </div>
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

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button variant="default" className="w-full" asChild>
                  <Link to={`/suppliers/${supplier.id}`}>
                    View Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Suppliers Found</h3>
            <p className="text-muted-foreground">Try adjusting your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SuppliersPage;