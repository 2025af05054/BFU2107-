import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Filter, 
  MessageCircle, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Package, 
  Truck, 
  CheckCircle,
  Clock,
  Loader2,
  ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSupabaseWorkflow } from "@/hooks/useSupabaseWorkflow";
import { format } from "date-fns";

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  const { orders, loading } = useSupabaseWorkflow();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PO Accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Order in Progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Out for Delivery':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'Not Indicated':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Done':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'PO Accepted':
        return 25;
      case 'Order in Progress':
        return 50;
      case 'Out for Delivery':
        return 75;
      case 'Delivered':
        return 100;
      default:
        return 0;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PO Accepted':
        return <Clock className="w-4 h-4" />;
      case 'Order in Progress':
        return <Package className="w-4 h-4" />;
      case 'Out for Delivery':
        return <Truck className="w-4 h-4" />;
      case 'Delivered':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = searchQuery === '' || 
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.po_number.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">📦 Order Tracking</h1>
        <p className="text-muted-foreground">Track your purchase orders and delivery status</p>
      </div>

      {/* Filters */}
      <Card className="shadow-card mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by Order/PO number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PO Accepted">PO Accepted</SelectItem>
                <SelectItem value="Order in Progress">In Progress</SelectItem>
                <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <CreditCard className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="Not Indicated">Not Indicated</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {orders.filter(o => o.status === 'PO Accepted').length}
            </div>
            <p className="text-sm text-muted-foreground">PO Accepted</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'Order in Progress').length}
            </div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {orders.filter(o => o.status === 'Out for Delivery').length}
            </div>
            <p className="text-sm text-muted-foreground">Out for Delivery</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'Delivered').length}
            </div>
            <p className="text-sm text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Orders will appear here once quotes are accepted.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="shadow-card">
              <CardContent className="pt-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Order Info */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">{order.order_number}</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/rfq/${order.rfq_id}`)}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View RFQ
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">PO Number</p>
                        <p className="font-medium">{order.po_number}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Order Status</p>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status}</span>
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Payment</p>
                          <Badge className={getPaymentColor(order.payment_status)}>
                            <CreditCard className="w-3 h-3 mr-1" />
                            {order.payment_status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress & Delivery */}
                  <div>
                    <h4 className="font-medium mb-3">Delivery Progress</h4>
                    <Progress value={getStatusProgress(order.status)} className="mb-3" />
                    
                    <div className="space-y-3">
                      {order.delivery_date && (
                        <div className="flex items-center text-sm">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">Expected:</span>
                          <span className="ml-1 font-medium">
                            {format(new Date(order.delivery_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-start text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-muted-foreground">Delivery Address:</span>
                          <p className="font-medium">{order.delivery_address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/order/${order.id}/communication`)}
                      className="w-full"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Open Q&A
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/order/${order.id}/details`)}
                      className="w-full"
                    >
                      View Details
                    </Button>
                    
                    {order.status === 'Delivered' && (
                      <Button className="w-full">
                        Rate & Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderTrackingPage;