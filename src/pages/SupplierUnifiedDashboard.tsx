import { useState } from "react";
import { Building2, Package, FileText, ShoppingCart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import SupplierProfile from "./SupplierProfile";
import SupplierProducts from "./SupplierProducts";
import SupplierDashboard from "./SupplierDashboard";
import SupplierOrders from "./SupplierOrders";

type SupplierSection = "profile" | "products" | "rfqs" | "orders";

const SupplierUnifiedDashboard = () => {
  const [activeSection, setActiveSection] = useState<SupplierSection>("profile");

  const sidebarItems = [
    {
      id: "profile" as SupplierSection,
      label: "Supplier Profile",
      icon: Building2,
      description: "Manage your supplier profile and information"
    },
    {
      id: "products" as SupplierSection,
      label: "Product Management",
      icon: Package,
      description: "Upload and manage your product catalog"
    },
    {
      id: "rfqs" as SupplierSection,
      label: "RFQ Responses",
      icon: FileText,
      description: "View RFQs and submit quotes"
    },
    {
      id: "orders" as SupplierSection,
      label: "Order Management",
      icon: ShoppingCart,
      description: "Track and manage your orders"
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return <SupplierProfile />;
      case "products":
        return <SupplierProducts />;
      case "rfqs":
        return <SupplierDashboard />;
      case "orders":
        return <SupplierOrders />;
      default:
        return <SupplierProfile />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Supplier Menu
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

export default SupplierUnifiedDashboard;