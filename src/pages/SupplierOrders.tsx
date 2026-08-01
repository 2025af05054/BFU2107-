import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Truck, Package, Calendar, IndianRupee, MessageCircle, Search, Filter, FileDown } from "lucide-react";
import { ChatDialog } from "@/components/ChatDialog";
import { toast } from "sonner";

const ORDER_STATUSES = ["PO Accepted", "Order in Progress", "Out for Delivery", "Delivered"] as const;

interface Order {
  id: string;
  order_number: string;
  po_number: string;
  status: string;
  payment_status: string;
  delivery_date: string | null;
  delivery_address: string;
  created_at: string;
  rfq_id: string;
  rfq: {
    rfq_number: string;
    user_id: string;
  };
  quote: {
    quote_number: string;
    total_amount: number;
  };
}

const SupplierOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
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
          rfq_id,
          rfqs!inner(
            rfq_number,
            user_id
          ),
          quotes!inner(
            quote_number,
            total_amount,
            supplier_id
          )
        `)
        .eq('quotes.supplier_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our Order interface
      const transformedOrders = data?.map((item: any) => ({
        ...item,
        rfq: item.rfqs,
        quote: item.quotes
      })) || [];

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setUpdatingOrderId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      toast.success("Order status updated");
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error("Failed to update order status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleGenerateInvoice = (order: Order) => {
    const lines = [
      `INVOICE`,
      `Order Number: ${order.order_number}`,
      `PO Number: ${order.po_number}`,
      `RFQ Number: ${order.rfq.rfq_number}`,
      `Quote Number: ${order.quote.quote_number}`,
      `Order Date: ${new Date(order.created_at).toLocaleDateString()}`,
      `Delivery Address: ${order.delivery_address}`,
      `Delivery Date: ${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Not set'}`,
      ``,
      `Total Amount: ₹${order.quote.total_amount?.toLocaleString() || 'N/A'}`,
      `Payment Status: ${order.payment_status}`,
      `Order Status: ${order.status}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${order.order_number}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'po accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'order in progress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'out for delivery':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'not indicated':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status.toLowerCase()) {
      case 'po accepted': return 25;
      case 'order in progress': return 50;
      case 'out for delivery': return 75;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.rfq.rfq_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPayment = paymentFilter === "all" || order.payment_status.toLowerCase() === paymentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPayment;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Order Management</h1>
            <p className="text-muted-foreground mt-2">Track and manage your orders</p>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-fireground w-4 h-4" />
                    <Input
                      placeholder="Search by Order No., PO No., or RFQ No..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Order Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="po accepted">PO Accepted</SelectItem>
                      <SelectItem value="order in progress">In Progress</SelectItem>
                      <SelectItem value="out for delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payments</SelectItem>
                      <SelectItem value="not indicated">Not Indicated</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No Orders Found</h3>
                <p className="text-sm text-muted-foreground">
                  {orders.length === 0 
                    ? "You haven't received any orders yet"
                    : "No orders match your current filters"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="shadow-card">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          {order.order_number}
                        </CardTitle>
                        <CardDescription>
                          PO: {order.po_number} | RFQ: {order.rfq.rfq_number}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <Badge className={getPaymentColor(order.payment_status)}>
                          Payment: {order.payment_status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Order Progress</span>
                        <span>{getStatusProgress(order.status)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getStatusProgress(order.status)}%` }}
                        />
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Order Value</p>
                          <p className="font-medium">₹{order.quote.total_amount?.toLocaleString() || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Delivery Date</p>
                          <p className="font-medium">
                            {order.delivery_date 
                              ? new Date(order.delivery_date).toLocaleDateString()
                              : 'Not set'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Delivery Address</p>
                          <p className="font-medium text-sm line-clamp-2">{order.delivery_address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Order Date</p>
                          <p className="font-medium">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={() => setChatOrder(order)}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Open Chat
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/rfq/${order.rfq_id}`)}>
                        View RFQ Details
                      </Button>
                      <Select
                        value={order.status}
                        onValueChange={(status) => handleUpdateStatus(order.id, status)}
                        disabled={updatingOrderId === order.id}
                      >
                        <SelectTrigger className="w-[180px] h-9">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={() => handleGenerateInvoice(order)}>
                        <FileDown className="w-4 h-4 mr-2" />
                        Generate Invoice
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {chatOrder && (
        <ChatDialog
          open={!!chatOrder}
          onOpenChange={(open) => !open && setChatOrder(null)}
          rfqId={chatOrder.rfq_id}
          rfqNumber={chatOrder.rfq.rfq_number}
        />
      )}
    </div>
  );
};

export default SupplierOrders;