import { useState } from "react";
import { Search, User, Bell, LogOut, Package, ChevronDown, Menu, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import QuoteNotification from "./QuoteNotification";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useRFQCart } from "@/contexts/RFQCartContext";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role, isAdmin, isSupplier, isCustomer } = useUserRole();
  const { getCartCount } = useRFQCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const cartCount = getCartCount();

  const isActive = (path: string) => location.pathname === path;

  const runSearch = (query: string) => {
    const trimmed = query.trim();
    navigate(trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : '/products');
  };

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

  const allNavItems = [...navItems, ...(user ? getProtectedNavItems() : [])];

  return (
    <header className="bg-card border-b border-card-border sticky top-0 z-50 shadow-card">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-2 py-3 md:py-4">
          {/* Mobile menu trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-card-border">
                  <Link to="/" className="flex items-center space-x-3" onClick={() => setMobileMenuOpen(false)}>
                    <div className="w-9 h-9 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-lg flex items-center justify-center shadow-glow border-2 border-amber-300/50">
                      <span className="text-black font-bold text-base">BFU</span>
                    </div>
                    <div>
                      <h1 className="text-base font-bold text-foreground">BUY FOR US</h1>
                      <p className="text-xs text-muted-foreground">Smart Sourcing Solutions</p>
                    </div>
                  </Link>
                </div>

                <div className="p-4 border-b border-card-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search products, suppliers..."
                      className="pl-10 bg-muted/50 border-muted"
                      value={mobileSearchQuery}
                      onChange={(e) => setMobileSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setMobileMenuOpen(false);
                          runSearch(mobileSearchQuery);
                        }
                      }}
                    />
                  </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-2">
                  <ul className="space-y-1">
                    {allNavItems.map((item) => (
                      <li key={item.name}>
                        <Link
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block text-sm font-medium px-3 py-2.5 rounded-md ${
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
                </nav>

                <div className="p-4 border-t border-card-border space-y-2">
                  <Button variant="rfq" size="default" className="w-full" asChild>
                    <Link to="/sourcing-assistant" onClick={() => setMobileMenuOpen(false)}>
                      <Bell className="w-4 h-4 mr-2" />
                      Sourcing Agent
                    </Link>
                  </Button>
                  {user ? (
                    <>
                      <Button variant="outline" size="default" className="w-full" asChild>
                        <Link to="/user-dashboard" onClick={() => setMobileMenuOpen(false)}>
                          <User className="w-4 h-4 mr-2" />
                          Profile & Dashboard
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="default"
                        className="w-full text-destructive"
                        onClick={() => {
                          signOut();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="default" size="default" className="w-full" asChild>
                        <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                      </Button>
                      <Button variant="supplier" size="default" className="w-full" asChild>
                        <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Become a Supplier</Link>
                      </Button>
                      <Button variant="hero" size="default" className="w-full" asChild>
                        <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Become a Buyer</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo and Company Name */}
          <Link to="/" className="flex items-center space-x-2 md:space-x-3 min-w-0">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-lg flex items-center justify-center shadow-glow border-2 border-amber-300/50 sparkle-gold shrink-0">
              <span className="text-black font-bold text-base md:text-lg drop-shadow-sm">BFU</span>
            </div>
            <div className="hidden sm:block min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-foreground truncate">BUY FOR US</h1>
              <p className="text-xs text-muted-foreground truncate">Smart Sourcing Solutions</p>
            </div>
          </Link>

          {/* Search Bar - desktop only */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products, suppliers, or categories..."
                className="pl-10 bg-muted/50 border-muted focus:bg-background transition-smooth"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runSearch(searchQuery);
                }}
              />
            </div>
          </div>

          {/* Action Buttons - desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="rfq" size="default" asChild>
              <Link to="/sourcing-assistant">
                <Bell className="w-4 h-4 mr-2" />
                Sourcing Agent
              </Link>
            </Button>
            <QuoteNotification />

            {user && isCustomer() && (
              <Button variant="outline" size="icon" className="relative" asChild>
                <Link to="/rfq" aria-label="RFQ cart">
                  <ShoppingCart className="w-4 h-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </Button>
            )}

            {user ? (
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
            ) : (
              <Button variant="default" size="sm" asChild>
                <Link to="/auth">
                  Sign In
                </Link>
              </Button>
            )}
          </div>

          {/* Action buttons - mobile: single account icon only, rest live in the drawer */}
          <div className="flex md:hidden items-center shrink-0 gap-1">
            {user && isCustomer() && (
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link to="/rfq" aria-label="RFQ cart">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </Button>
            )}
            {user ? (
              <Button variant="ghost" size="icon" asChild>
                <Link to="/user-dashboard" aria-label="Account">
                  <User className="w-5 h-5" />
                </Link>
              </Button>
            ) : (
              <Button variant="default" size="sm" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search products, suppliers..."
              className="pl-10 h-11 rounded-full bg-muted/50 border-muted focus:bg-background transition-smooth"
              value={mobileSearchQuery}
              onChange={(e) => setMobileSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runSearch(mobileSearchQuery);
              }}
            />
          </div>
        </div>

        {/* Mobile category chip strip */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-hide">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-full border ${
                isActive(item.path)
                  ? "text-primary bg-primary/10 border-primary/30"
                  : "text-muted-foreground border-card-border hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Navigation - desktop only, mobile uses drawer */}
        <nav className="hidden md:block border-t border-card-border">
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
