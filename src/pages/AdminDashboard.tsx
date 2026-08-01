import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { RoleBasedRoute } from '@/components/RoleBasedRoute';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  FileText,
  Package,
  ShoppingCart,
  Shield,
  UserCheck,
  ClipboardList,
  Truck,
  FolderTree
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_users: 0,
    total_suppliers: 0,
    total_customers: 0,
    total_rfqs: 0,
    pending_rfqs: 0,
    total_products: 0,
    total_orders: 0,
    pending_orders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
      if (error) {
        console.error('Error fetching admin dashboard stats:', error);
      } else if (data && data.length > 0) {
        setStats(data[0]);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  const adminSections = [
    {
      title: 'User Management',
      description: 'Manage user accounts and roles',
      icon: Users,
      path: '/admin/users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'RFQ Management',
      description: 'View and manage customer RFQs',
      icon: FileText,
      path: '/admin/rfqs',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Product Management',
      description: 'Manage supplier products and approvals',
      icon: Package,
      path: '/admin/products',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Category Management',
      description: 'Manage product categories hierarchy',
      icon: FolderTree,
      path: '/admin/categories',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    },
    {
      title: 'Order Management',
      description: 'Track and update customer orders',
      icon: ShoppingCart,
      path: '/admin/orders',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const quickStats = [
    { label: 'Total Users', value: stats.total_users, icon: UserCheck },
    { label: 'Pending RFQs', value: stats.pending_rfqs, icon: ClipboardList },
    { label: 'Products Listed', value: stats.total_products, icon: Package },
    { label: 'Pending Orders', value: stats.pending_orders, icon: Truck }
  ];

  return (
    <RoleBasedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Complete system management and oversight</p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Admin Access</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {quickStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '—' : stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Admin Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminSections.map((section, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${section.bgColor}`}>
                      <section.icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{section.description}</p>
                  <Button
                    onClick={() => navigate(section.path)}
                    className="w-full"
                  >
                    Open {section.title}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    </RoleBasedRoute>
  );
};

export default AdminDashboard;
