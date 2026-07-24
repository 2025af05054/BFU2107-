import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RoleBasedRoute } from '@/components/RoleBasedRoute';
import Layout from '@/components/Layout';
import { Package, Eye, Edit, RefreshCw, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: string;
  order_number: string;
  po_number: string;
  status: string;
  payment_status: string;
  delivery_date: string | null;
  delivery_address: string;
  created_at: string;
  updated_at: string;
  rfq_id: string;
  quote_id: string;
  customer_name?: string;
  supplier_name?: string;
  rfq_number?: string;
  quote_number?: string;
  total_amount?: number;
}

const AdminOrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'PO Accepted', label: 'PO Accepted' },
    { value: 'In Production', label: 'In Production' },
    { value: 'Ready to Ship', label: 'Ready to Ship' },
    { value: 'Shipped', label: 'Shipped' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  const paymentStatusOptions = [
    { value: 'all', label: 'All Payment Status' },
    { value: 'Not Indicated', label: 'Not Indicated' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Partial', label: 'Partial' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Overdue', label: 'Overdue' }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch orders with related data
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          po_number,
          status,
          payment_status,
          delivery_date,
          delivery_address,
          created_at,
          updated_at,
          rfq_id,
          quote_id
        `)
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;

      // Fetch related RFQ data
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select('id, rfq_number, user_id')
        .in('id', orderData?.map(order => order.rfq_id) || []);

      if (rfqError) throw rfqError;

      // Fetch related quote data
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('id, quote_number, supplier_id, total_amount')
        .in('id', orderData?.map(order => order.quote_id) || []);

      if (quoteError) throw quoteError;

      // Fetch customer profiles
      const customerIds = rfqData?.map(rfq => rfq.user_id) || [];
      const { data: customerProfiles, error: customerError } = await supabase
        .from('profiles')
        .select('id, name, company')
        .in('id', customerIds);

      if (customerError) throw customerError;

      // Fetch supplier profiles
      const supplierIds = quoteData?.map(quote => quote.supplier_id).filter(Boolean) || [];
      const { data: supplierProfiles, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, company_name')
        .in('id', supplierIds);

      if (supplierError) throw supplierError;

      // Combine all data
      const enrichedOrders: Order[] = orderData?.map(order => {
        const rfq = rfqData?.find(r => r.id === order.rfq_id);
        const quote = quoteData?.find(q => q.id === order.quote_id);
        const customer = customerProfiles?.find(c => c.id === rfq?.user_id);
        const supplier = supplierProfiles?.find(s => s.id === quote?.supplier_id);
        
        return {
          ...order,
          rfq_number: rfq?.rfq_number,
          quote_number: quote?.quote_number,
          total_amount: quote?.total_amount,
          customer_name: customer?.name || customer?.company || 'Unknown Customer',
          supplier_name: supplier?.company_name || 'Unknown Supplier'
        };
      }) || [];

      setOrders(enrichedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch order data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });

      fetchOrders(); // Refresh data
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const updatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newPaymentStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });

      fetchOrders(); // Refresh data
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.rfq_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PO Accepted':
        return 'secondary';
      case 'In Production':
        return 'default';
      case 'Ready to Ship':
        return 'outline';
      case 'Shipped':
        return 'default';
      case 'Delivered':
        return 'default';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPaymentBadgeVariant = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'Paid':
        return 'default';
      case 'Partial':
        return 'outline';
      case 'Pending':
        return 'secondary';
      case 'Overdue':
        return 'destructive';
      case 'Not Indicated':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const totalOrderValue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const deliveredOrders = orders.filter(order => order.status === 'Delivered').length;
  const activeOrders = orders.filter(order => !['Delivered', 'Cancelled'].includes(order.status)).length;

  return (
    <RoleBasedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Order Management</h1>
              <p className="text-muted-foreground">View and manage customer purchase orders</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => fetchOrders()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deliveredOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalOrderValue.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search orders, customers, suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="min-w-[150px]">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[150px]">
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{order.po_number}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>{order.supplier_name}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaymentBadgeVariant(order.payment_status)}>
                            {order.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.total_amount ? `₹${order.total_amount.toLocaleString()}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {order.delivery_date ? format(new Date(order.delivery_date), 'MMM dd, yyyy') : 'Not set'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewOrderDetails(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.slice(1).map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={order.payment_status}
                              onValueChange={(value) => updatePaymentStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-28 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {paymentStatusOptions.slice(1).map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {!loading && filteredOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
                <DialogDescription>
                  Complete information about this order
                </DialogDescription>
              </DialogHeader>
              
              {selectedOrder && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">PO Number</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.po_number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">RFQ Number</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.rfq_number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Customer</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Supplier</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.supplier_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Order Status</p>
                      <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Payment Status</p>
                      <Badge variant={getPaymentBadgeVariant(selectedOrder.payment_status)}>
                        {selectedOrder.payment_status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Amount</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.total_amount ? `₹${selectedOrder.total_amount.toLocaleString()}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Delivery Date</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.delivery_date ? format(new Date(selectedOrder.delivery_date), 'MMM dd, yyyy') : 'Not set'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Delivery Address</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedOrder.delivery_address}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Order Created</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedOrder.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedOrder.updated_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    </RoleBasedRoute>
  );
};

export default AdminOrderManagement;