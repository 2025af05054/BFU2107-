import { useState } from "react";
import { Package, Truck, CheckCircle, MessageSquare, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSupabaseWorkflow } from "@/hooks/useSupabaseWorkflow";
import { ChatDialog } from "@/components/ChatDialog";

const OrderTracking = () => {
  const { orders, rfqs, quotes, updateOrderStatus, updatePaymentStatus, loading } = useSupabaseWorkflow();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRfq, setChatRfq] = useState<{ id: string; rfq_number: string } | null>(null);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'PO Accepted': return 25;
      case 'Order in Progress': return 50;
      case 'Out for Delivery': return 75;
      case 'Delivered': return 100;
      default: return 0;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-green-100 text-green-800';
      case 'Partial': return 'bg-yellow-100 text-yellow-800';
      case 'Not Indicated': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderDetails = (order: any) => {
    const rfq = rfqs.find(r => r.id === order.rfq_id);
    const quote = quotes.find(q => q.id === order.quote_id);
    return { rfq, quote };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PO Accepted': return <Package className="w-5 h-5" />;
      case 'Order in Progress': return <Package className="w-5 h-5" />;
      case 'Out for Delivery': return <Truck className="w-5 h-5" />;
      case 'Delivered': return <CheckCircle className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Order Tracking</h1>
        <p className="text-muted-foreground">Track your purchase orders and delivery status in real-time.</p>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {orders.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground mb-6">
                You don't have any orders to track yet. Once you accept a quote, your order will appear here.
              </p>
              <Button variant="hero">Browse RFQs</Button>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => {
            const { rfq, quote } = getOrderDetails(order);
            const progress = getStatusProgress(order.status);

            return (
              <Card key={order.id} className="shadow-card">
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        {order.po_number}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Order created on {new Date(order.created_at).toLocaleDateString()}
                        {' • '} Expected delivery: {new Date(order.delivery_date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getPaymentStatusColor(order.payment_status)}>
                        Payment: {order.payment_status}
                      </Badge>
                      <Badge variant="outline">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Order Progress */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Order Progress</span>
                      <span className="text-muted-foreground">{progress}% Complete</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>PO Accepted</span>
                      <span>In Progress</span>
                      <span>Out for Delivery</span>
                      <span>Delivered</span>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground">Order Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">RFQ ID:</span>
                          <span className="font-medium">{rfq?.rfq_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quote ID:</span>
                          <span className="font-medium">{quote?.quote_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Amount:</span>
                          <span className="font-medium">₹{quote?.total_amount?.toLocaleString() || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground">Supplier</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">{quote?.supplier_name || 'N/A'}</span>
                        </div>
                        <div className="text-muted-foreground">
                          Supplier ID: {quote?.supplier_id || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground">Delivery</h4>
                      <div className="space-y-2 text-sm">
                        <div className="text-muted-foreground">
                          {order.delivery_address}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expected: </span>
                          <span className="font-medium">{new Date(order.delivery_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                    {rfq && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Products ({rfq.products?.length || 0} items)</h4>
                        <div className="space-y-2">
                          {rfq.products?.map((product) => (
                          <div key={product.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                            <div>
                              <span className="font-medium">{product.name}</span>
                              <div className="text-sm text-muted-foreground">
                                Quantity: {product.quantity}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                ₹{((quote?.total_amount || 0) / (rfq.products?.length || 1) / product.quantity).toLocaleString()} / unit
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Total: ₹{((quote?.total_amount || 0) / (rfq.products?.length || 1)).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <div className="flex gap-2 flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!rfq}
                        onClick={() => {
                          if (!rfq) return;
                          setChatRfq({ id: rfq.id, rfq_number: rfq.rfq_number });
                          setChatOpen(true);
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat with Supplier
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      {order.payment_status !== 'Done' && (
                        <Button 
                          variant="premium" 
                          size="sm"
                          onClick={() => updatePaymentStatus(order.id, 'Done')}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Mark Paid
                        </Button>
                      )}
                      
                      {order.status !== 'Delivered' && (
                        <div className="flex gap-1">
                          {order.status === 'PO Accepted' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'Order in Progress')}
                            >
                              Start Progress
                            </Button>
                          )}
                          {order.status === 'Order in Progress' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'Out for Delivery')}
                            >
                              Mark Shipped
                            </Button>
                          )}
                          {order.status === 'Out for Delivery' && (
                            <Button 
                              variant="hero" 
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'Delivered')}
                            >
                              Mark Delivered
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {chatRfq && (
        <ChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          rfqId={chatRfq.id}
          rfqNumber={chatRfq.rfq_number}
        />
      )}
    </div>
  );
};

export default OrderTracking;