import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, X, MessageSquare, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSupabaseWorkflow } from "@/hooks/useSupabaseWorkflow";
import { useAuth } from "@/contexts/AuthContext";
import { ChatDialog } from "@/components/ChatDialog";
import { toast } from "sonner";

const QuoteDetailsPage = () => {
  // This page is reached both as /quote/:id (a quote id) and as /rfq/:id
  // (an RFQ id, used by "View RFQ" links throughout the app), so resolve
  // the param against either.
  const { id } = useParams();
  const { quotes, rfqs, acceptQuote, rejectQuote, loading } = useSupabaseWorkflow();
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);

  let quote = quotes.find(q => q.id === id);
  const rfq = quote ? rfqs.find(r => r.id === quote.rfq_id) : rfqs.find(r => r.id === id);
  if (!quote && rfq) {
    quote = quotes.find(q => q.rfq_id === rfq!.id);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Quote Not Found</h1>
          <p className="text-muted-foreground mb-6">The quote you're looking for doesn't exist or has been removed.</p>
          <Link to="/rfq-dashboard">
            <Button variant="hero">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">No Quote Yet</h1>
          <p className="text-muted-foreground mb-6">
            RFQ {rfq.rfq_number} hasn't received a supplier quote yet. Check back soon.
          </p>
          <Link to="/rfq-dashboard">
            <Button variant="hero">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAcceptQuote = async () => {
    try {
      await acceptQuote(quote.id);
      toast.success("Quote accepted! Your purchase order has been created and sent to the supplier.");
    } catch (error) {
      toast.error("Failed to accept quote. Please try again.");
    }
  };

  const handleRejectQuote = async () => {
    try {
      await rejectQuote(quote.id);
    } catch (error) {
      toast.error("Failed to reject quote. Please try again.");
    }
  };

  const isExpired = new Date(quote.valid_until) < new Date();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link to="/rfq-dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to RFQ Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Quote {quote.id}</h1>
            <p className="text-muted-foreground">
              For RFQ {quote.rfq_id} • Created on {new Date(quote.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={quote.status === 'Accepted' ? 'default' : 'secondary'}>
              {quote.status}
            </Badge>
            {isExpired && (
              <Badge variant="destructive">
                Expired
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Quote Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Supplier Information */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">{quote.supplier_name}</h4>
                <p className="text-sm text-muted-foreground">Supplier ID: {quote.supplier_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Quote Valid Until</p>
                <p className="font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(quote.valid_until).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Product Quotation</CardTitle>
              <CardDescription>Detailed pricing and terms for each product in your RFQ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quote.product_quotes?.map((productQuote, index) => {
                  const product = rfq.products?.find(p => p.id === productQuote.product_id);
                  if (!product) return null;

                  return (
                    <div key={productQuote.product_id} className="border border-card-border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{product.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                        </div>
                        <Badge variant="outline">
                          Product {index + 1}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Quantity</p>
                          <p className="font-medium">{product.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Unit Price</p>
                          <p className="font-medium">₹{productQuote.unit_price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Lead Time</p>
                          <p className="font-medium">{productQuote.lead_time} days</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="font-medium">₹{(productQuote.unit_price * product.quantity).toLocaleString()}</p>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Terms & Conditions</p>
                        <p className="text-sm">{productQuote.terms || 'Standard terms apply'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* RFQ Reference */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Original RFQ Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-3">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {user?.user_metadata?.name || 'N/A'}</div>
                    <div><span className="text-muted-foreground">Company:</span> {user?.user_metadata?.company || 'N/A'}</div>
                    <div><span className="text-muted-foreground">Email:</span> {user?.email || 'N/A'}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-3">RFQ Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">RFQ ID:</span> {rfq.rfq_number}</div>
                    <div><span className="text-muted-foreground">Created:</span> {new Date(rfq.created_at).toLocaleDateString()}</div>
                    <div><span className="text-muted-foreground">Products:</span> {rfq.products?.length || 0} items</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Quote Summary */}
          <Card className="shadow-card sticky top-24">
            <CardHeader>
              <CardTitle>Quote Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">₹{Math.round(quote.total_amount / 1.15).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee (15%):</span>
                  <span className="font-medium">₹{Math.round(quote.total_amount - (quote.total_amount / 1.15)).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-bold">₹{quote.total_amount.toLocaleString()}</span>
                </div>
              </div>

              {quote.status === 'Pending' && !isExpired && (
                <div className="space-y-3 pt-4">
                  <Button 
                    variant="hero" 
                    className="w-full" 
                    onClick={handleAcceptQuote}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Quote
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleRejectQuote}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject Quote
                  </Button>
                </div>
              )}

              {quote.status === 'Accepted' && (
                <div className="pt-4">
                  <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">Quote Accepted</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Your purchase order has been created.
                  </p>
                </div>
              )}

              {isExpired && (
                <div className="pt-4">
                  <div className="flex items-center justify-center p-3 bg-red-50 rounded-lg">
                    <X className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-800 font-medium">Quote Expired</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setChatOpen(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat about this RFQ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        rfqId={rfq.id}
        rfqNumber={rfq.rfq_number}
      />
    </div>
  );
};

export default QuoteDetailsPage;