import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { RoleBasedRoute } from '@/components/RoleBasedRoute';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Package, 
  ShoppingCart, 
  Settings, 
  BarChart3,
  Shield,
  Database,
  UserCheck,
  ClipboardList,
  Truck,
  FolderTree
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();

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
    {
      title: 'System Overview',
      items: [
        { label: 'Active Users', value: '1,234', icon: UserCheck },
        { label: 'Total RFQs', value: '567', icon: ClipboardList },
        { label: 'Products Listed', value: '2,891', icon: Package },
        { label: 'Orders Processed', value: '834', icon: Truck }
      ]
    }
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
            {quickStats[0].items.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
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

          {/* System Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => navigate('/admin/analytics')}
                >
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Analytics & Reports
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => navigate('/admin/database')}
                >
                  <Database className="h-6 w-6 mb-2" />
                  Database Management
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => navigate('/admin/settings')}
                >
                  <Settings className="h-6 w-6 mb-2" />
                  System Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">New user registered</p>
                    <p className="text-sm text-muted-foreground">John Doe joined as a customer - 2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">New RFQ submitted</p>
                    <p className="text-sm text-muted-foreground">RFQ001 for Industrial Equipment - 4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Package className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Product approved</p>
                    <p className="text-sm text-muted-foreground">Steel Pipes by ABC Suppliers - 6 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Truck className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Order delivered</p>
                    <p className="text-sm text-muted-foreground">Order ORD123 successfully delivered - 1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </RoleBasedRoute>
  );
};

export default AdminDashboard;