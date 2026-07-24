import { Search, User, Bell, LogOut, Settings, Package, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import QuoteNotification from "./QuoteNotification";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

const Header = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { role, isAdmin, isSupplier, isCustomer } = useUserRole();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: "Suppliers", path: "/suppliers" },
    { name: "About Us", path: "/about" },
    { name: "Support", path: "/support" },
  ];

  const getProtectedNavItems = () => {
    const items = [];
    
    // Customer items
    if (isCustomer()) {
      items.push(
        { name: "Create RFQ", path: "/rfq" }
      );
    }
    
    // Supplier items
    if (isSupplier()) {
      items.push(
        { name: "Supplier Dashboard", path: "/supplier-dashboard" },
        { name: "RFQ Responses", path: "/rfq-responses" }
      );
    }
    
    // Admin items
    if (isAdmin()) {
      items.push(
        { name: "Admin Panel", path: "/admin" },
        { name: "Product Management", path: "/admin/products" }
      );
    }
    
    return items;
  };

  return (
    <header className="bg-card border-b border-card-border sticky top-0 z-50 shadow-card">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-4">
          {/* Logo and Company Name */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-lg flex items-center justify-center shadow-glow border-2 border-amber-300/50 sparkle-gold">
                <span className="text-black font-bold text-lg drop-shadow-sm">BFU</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">BUY FOR US</h1>
                <p className="text-xs text-muted-foreground">Smart Sourcing Solutions</p>
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products, suppliers, or categories..."
                className="pl-10 bg-muted/50 border-muted focus:bg-background transition-smooth"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button variant="rfq" size="default" asChild>
              <Link to="/sourcing-assistant">
                <Bell className="w-4 h-4 mr-2" />
                Sourcing Agent
              </Link>
            </Button>
            <QuoteNotification />
            
            {user ? (
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                      <User className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3 absolute -bottom-1 -right-1 bg-background rounded-full" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/user-dashboard" className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Profile & Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/rfq" className="flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Create RFQ
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button variant="default" size="sm" asChild>
                <Link to="/auth">
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="border-t border-card-border">
          <div className="flex items-center justify-between py-3">
            <ul className="flex items-center space-x-8">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`text-sm font-medium transition-smooth px-3 py-2 rounded-md ${
                      isActive(item.path)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              
              {user && getProtectedNavItems().map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`text-sm font-medium transition-smooth px-3 py-2 rounded-md ${
                      isActive(item.path)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            
            <div className="flex items-center space-x-3">
              {user && role && (
                <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full capitalize">
                  {role}
                </div>
              )}
              {!user && (
                <>
                  <Button variant="supplier" size="sm" asChild>
                    <Link to="/auth">Become a Supplier</Link>
                  </Button>
                  <Button variant="hero" size="sm" asChild>
                    <Link to="/auth">Become a Buyer</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;