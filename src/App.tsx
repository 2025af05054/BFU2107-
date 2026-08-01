import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import HomePage from "./pages/HomePage";
import RFQPage from "./pages/RFQPage";
import ProductsPage from "./pages/ProductsPage";
import SuppliersPage from "./pages/SuppliersPage";
import AboutPage from "./pages/AboutPage";
import SupportPage from "./pages/SupportPage";
import NotFound from "./pages/NotFound";
import RFQDashboard from "./pages/RFQDashboard";
import OrderTracking from "./pages/OrderTracking";
import QuoteDetailsPage from "./pages/QuoteDetailsPage";
import AuthPage from "./pages/AuthPage";
import AdminPanel from "./pages/AdminPanel";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminBulkProductImport from "./pages/AdminBulkProductImport";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRFQManagement from "./pages/AdminRFQManagement";
import AdminOrderManagement from "./pages/AdminOrderManagement";
import SupplierDashboard from "./pages/SupplierDashboard";
import RFQResponses from "./pages/RFQResponses";
import UserDashboard from "./pages/UserDashboard";
import SupplierUnifiedDashboard from "./pages/SupplierUnifiedDashboard";
import SourcingAssistantPage from "./pages/SourcingAssistantPage";
import SupplierProducts from "./pages/SupplierProducts";
import CreateQuotePage from "./pages/CreateQuotePage";
import { RoleBasedRoute } from "./components/RoleBasedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ShadcnToaster />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<Layout><Index /></Layout>} />
              <Route path="/home" element={<Layout><HomePage /></Layout>} />
              <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
              <Route path="/suppliers" element={<Layout><SuppliersPage /></Layout>} />
              <Route path="/about" element={<Layout><AboutPage /></Layout>} />
              <Route path="/support" element={<Layout><SupportPage /></Layout>} />
              <Route path="/sourcing-assistant" element={<Layout><SourcingAssistantPage /></Layout>} />
              
              {/* Protected Routes */}
              <Route path="/user-dashboard" element={<RoleBasedRoute allowedRoles={['customer', 'supplier', 'admin']}><Layout><UserDashboard /></Layout></RoleBasedRoute>} />
              <Route path="/rfq" element={<RoleBasedRoute allowedRoles={['customer']}><Layout><RFQPage /></Layout></RoleBasedRoute>} />
              {/* Admin Routes */}
              <Route path="/admin" element={<RoleBasedRoute allowedRoles={['admin']}><AdminDashboard /></RoleBasedRoute>} />
              <Route path="/admin/dashboard" element={<RoleBasedRoute allowedRoles={['admin']}><AdminDashboard /></RoleBasedRoute>} />
              <Route path="/admin/users" element={<RoleBasedRoute allowedRoles={['admin']}><AdminPanel /></RoleBasedRoute>} />
              <Route path="/admin/rfqs" element={<RoleBasedRoute allowedRoles={['admin']}><AdminRFQManagement /></RoleBasedRoute>} />
              <Route path="/admin/products" element={<RoleBasedRoute allowedRoles={['admin']}><Layout><AdminProductsPage /></Layout></RoleBasedRoute>} />
              <Route path="/admin/products/import" element={<RoleBasedRoute allowedRoles={['admin']}><Layout><AdminBulkProductImport /></Layout></RoleBasedRoute>} />
              <Route path="/admin/categories" element={<RoleBasedRoute allowedRoles={['admin']}><AdminCategoriesPage /></RoleBasedRoute>} />
              <Route path="/admin/orders" element={<RoleBasedRoute allowedRoles={['admin']}><AdminOrderManagement /></RoleBasedRoute>} />
              
              {/* Legacy admin routes for backwards compatibility */}
              <Route path="/admin-panel" element={<RoleBasedRoute allowedRoles={['admin']}><AdminPanel /></RoleBasedRoute>} />
              <Route path="/admin-products" element={<RoleBasedRoute allowedRoles={['admin']}><Layout><AdminProductsPage /></Layout></RoleBasedRoute>} />
              <Route path="/supplier-dashboard" element={<RoleBasedRoute allowedRoles={['supplier']}><Layout><SupplierUnifiedDashboard /></Layout></RoleBasedRoute>} />
              <Route path="/supplier-products" element={<RoleBasedRoute allowedRoles={['supplier']}><Layout><SupplierProducts /></Layout></RoleBasedRoute>} />
              <Route path="/rfq-responses" element={<RoleBasedRoute allowedRoles={['supplier']}><Layout><RFQResponses /></Layout></RoleBasedRoute>} />
              <Route path="/quote/create/:id" element={<RoleBasedRoute allowedRoles={['supplier']}><Layout><CreateQuotePage /></Layout></RoleBasedRoute>} />
              <Route path="/rfq/:id" element={<ProtectedRoute><Layout><QuoteDetailsPage /></Layout></ProtectedRoute>} />
              <Route path="/rfq-dashboard" element={<ProtectedRoute><Layout><RFQDashboard /></Layout></ProtectedRoute>} />
              <Route path="/quote/:id" element={<ProtectedRoute><Layout><QuoteDetailsPage /></Layout></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
