import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, FileText, Package, Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import ProfilePage from "./ProfilePage";
import DashboardPage from "./DashboardPage";
import OrderTrackingPage from "./OrderTrackingPage";

type DashboardSection = "profile" | "rfq" | "orders";

const UserDashboard = () => {
  const [activeSection, setActiveSection] = useState<DashboardSection>("profile");
  const [productSearch, setProductSearch] = useState("");
  const navigate = useNavigate();

  const handleProductSearch = () => {
    const query = productSearch.trim();
    if (!query) return;
    navigate(`/products?search=${encodeURIComponent(query)}`);
  };

  const sidebarItems = [
    {
      id: "profile" as DashboardSection,
      label: "Profile",
      icon: User,
      description: "Manage your profile information"
    },
    {
      id: "rfq" as DashboardSection,
      label: "RFQ Dashboard",
      icon: FileText,
      description: "View and manage your RFQs"
    },
    {
      id: "orders" as DashboardSection,
      label: "Order Tracking",
      icon: Package,
      description: "Track your orders and deliveries"
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return <ProfilePage />;
      case "rfq":
        return <DashboardPage />;
      case "orders":
        return <OrderTrackingPage />;
      default:
        return <ProfilePage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-card mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search products, e.g. belt, sunglasses, watch..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleProductSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleProductSearch} disabled={!productSearch.trim()}>
                Search Products
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Dashboard Menu
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {sidebarItems.map((item, index) => (
                  <div key={item.id}>
                    <Button
                      variant={activeSection === item.id ? "default" : "ghost"}
                      className={`w-full justify-start px-6 py-4 h-auto ${
                        activeSection === item.id 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setActiveSection(item.id)}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs opacity-80 mt-1">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                    {index < sidebarItems.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {sidebarItems.find(item => item.id === activeSection)?.label}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {sidebarItems.find(item => item.id === activeSection)?.description}
                </p>
              </div>
              <Separator />
              <div className="min-h-[600px]">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;