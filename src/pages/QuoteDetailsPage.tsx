import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, X, MessageSquare, Calendar, Loader2, Handshake, Printer, Trash2, FileCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabaseWorkflow, DatabaseProductQuote } from "@/hooks/useSupabaseWorkflow";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ChatDialog } from "@/components/ChatDialog";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/datetime";

const lineStatusColor = (status: string) => {
  switch (status) {
    case 'Accepted':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Countered':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const QuoteDetailsPage = () => {
  // This page is reached both as /quote/:id (a quote id) and as /rfq/:id
  // (an RFQ id, used by "View RFQ" links throughout the app), so resolve
  // the param against either. It's also shared by customers and suppliers,
  // each seeing the negotiation controls relevant to them.
  const { id } = useParams();
  const {
    quotes,
    rfqs,
    orders,
    cancelRFQ,
    isQuoteFullyAgreed,
    customerRespondToLineItem,
    supplierRespondToLineItem,
    submitFinalQuotation,
    rejectFinalQuotation,
    submitPurchaseOrder,
    retryOrderCreation,
    acknowledgePO,
    loading,
  } = useSupabaseWorkflow();
  const { user } = useAuth();
  const { isSupplier } = useUserRole();
  const [chatOpen, setChatOpen] = useState(false);
  const [counterDrafts, setCounterDrafts] = useState<Record<string, { price: string; message: string }>>({});
  // Which line items currently have their counter-price box open. Clicking
  // the ✕ on a product opens this instead of immediately rejecting it —
  // matches "click cross, type the new price, send it back" from the spec.
  const [counterOpenFor, setCounterOpenFor] = useState<Record<string, boolean>>({});

  let quote = quotes.find(q => q.id === id);
  const rfq = quote ? rfqs.find(r => r.id === quote.rfq_id) : rfqs.find(r => r.id === id);
  if (!quote && rfq) {
    quote = quotes.find(q => q.rfq_id === rfq!.id);
  }
  const order = quote ? orders.find(o => o.quote_id === quote!.id) : undefined;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const backToDashboardPath = isSupplier() ? '/supplier-dashboard' : '/rfq-dashboard';

  if (!rfq) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">RFQ Not Found</h1>
          <p className="text-muted-foreground mb-6">The RFQ you're looking for doesn't exist, or you don't have access to it.</p>
          <Link to={backToDashboardPath}>
            <Button variant="hero">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const rfqIsClosed = rfq.status === 'Cancelled' || rfq.status === 'Completed' || rfq.status === 'Rejected';

  const handleCancelRFQ = async () => {
    if (!window.confirm('Cancel this RFQ? This ends the negotiation for both sides and cannot be undone.')) return;
    await cancelRFQ(rfq.id);
  };

  if (!quote) {
    // A supplier landing here (e.g. from "View Details" on an RFQ they
    // haven't quoted yet) needs a way forward -- show the products and a
    // Create Quote CTA instead of the customer-facing "check back soon"
    // dead end.
    if (isSupplier() && !rfqIsClosed) {
      return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-6">
            <Link to={backToDashboardPath} className="inline-flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">RFQ {rfq.rfq_number}</h1>
          <p className="text-muted-foreground mb-6">You haven't submitted a quote for this RFQ yet.</p>
          <Card className="shadow-card mb-6">
            <CardHeader>
              <CardTitle>Requested Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(rfq.products || []).map(product => (
                <div key={product.id} className="border border-card-border rounded-lg p-3">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                  <p className="text-sm text-muted-foreground mt-1">Quantity: {product.quantity}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="flex items-center gap-3">
            <Link to={`/quote/create/${rfq.id}`}>
              <Button variant="hero">Create Quote</Button>
            </Link>
            <Button variant="outline" onClick={handleCancelRFQ}>
              <X className="w-4 h-4 mr-2" /> Cancel RFQ
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {rfq.status === 'Cancelled' ? 'RFQ Cancelled' : rfq.status === 'Rejected' ? 'RFQ Rejected' : 'No Quote Yet'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {rfq.status === 'Cancelled'
              ? `RFQ ${rfq.rfq_number} was cancelled${rfq.cancelled_by ? ` by the ${rfq.cancelled_by}` : ''}.`
              : rfq.status === 'Rejected'
                ? `RFQ ${rfq.rfq_number} was rejected by the customer and is closed.`
                : `RFQ ${rfq.rfq_number} hasn't received a supplier quote yet. Check back soon.`}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to={backToDashboardPath}>
              <Button variant="hero">Back to Dashboard</Button>
            </Link>
            {!rfqIsClosed && (
              <Button variant="outline" onClick={handleCancelRFQ}>
                <X className="w-4 h-4 mr-2" /> Cancel RFQ
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isMine = isSupplier();
  const fullyAgreed = isQuoteFullyAgreed(quote);
  const isExpired = new Date(quote.valid_until) < new Date();

  const getDraft = (id: string) => counterDrafts[id] || { price: '', message: '' };
  const setDraft = (id: string, updates: Partial<{ price: string; message: string }>) => {
    setCounterDrafts(prev => ({ ...prev, [id]: { ...getDraft(id), ...updates } }));
  };

  const handleAccept = (pq: DatabaseProductQuote) => {
    if (isMine) {
      supplierRespondToLineItem(pq.id, 'accept');
    } else {
      customerRespondToLineItem(pq.id, 'accept');
    }
  };

  const handleReject = (pq: DatabaseProductQuote) => {
    if (isMine) {
      supplierRespondToLineItem(pq.id, 'reject');
    } else {
      customerRespondToLineItem(pq.id, 'reject');
    }
  };

  const toggleCounter = (id: string) => {
    setCounterOpenFor(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCounter = (pq: DatabaseProductQuote) => {
    const draft = getDraft(pq.id);
    const price = parseFloat(draft.price);
    if (!price || price <= 0) {
      toast.error('Enter a valid counter-offer price');
      return;
    }
    if (isMine) {
      supplierRespondToLineItem(pq.id, 'counter', { price, message: draft.message });
    } else {
      customerRespondToLineItem(pq.id, 'counter', { price, message: draft.message });
    }
    setDraft(pq.id, { price: '', message: '' });
    setCounterOpenFor(prev => ({ ...prev, [pq.id]: false }));
  };

  const handleSubmitQuotation = async () => {
    await submitFinalQuotation(quote!.id);
  };

  const handleRejectQuotation = async () => {
    if (!window.confirm('Reject this quotation? This closes the RFQ permanently — it cannot be reopened or edited afterward.')) return;
    await rejectFinalQuotation(quote!.id);
  };

  const handleSubmitPO = async () => {
    if (!window.confirm('Submit this Purchase Order to the supplier?')) return;
    await submitPurchaseOrder(quote!.id);
  };

  const handleAcknowledgePO = async () => {
    if (!order) return;
    await acknowledgePO(order.id);
  };

  // Whether "it's your turn" to respond to a given line item: you can act
  // on it unless you were the one who made the most recent offer.
  const isMyTurn = (pq: DatabaseProductQuote) => {
    if (pq.status === 'Accepted' || pq.status === 'Rejected') return false;
    const waitingOn = pq.last_offer_by === 'supplier' ? 'customer' : 'supplier';
    return isMine ? waitingOn === 'supplier' : waitingOn === 'customer';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-6 print:hidden">
        <Link to={isMine ? "/rfq-responses" : "/rfq-dashboard"} className="inline-flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {isMine ? "My Quotes" : "RFQ Dashboard"}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {quote.status === 'Accepted' ? 'Purchase Order' : quote.status === 'Finalized' ? 'Final Quotation' : 'Quote'} {quote.quote_number || quote.id}
            </h1>
            <p className="text-muted-foreground">
              For RFQ {rfq.rfq_number} • Created on {formatDateTime(quote.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <Badge variant={quote.status === 'Accepted' ? 'default' : 'secondary'}>
              {quote.status}
            </Badge>
            {isExpired && quote.status === 'Pending' && (
              <Badge variant="destructive">Expired</Badge>
            )}
            {rfq.status === 'Cancelled' && (
              <Badge variant="destructive">RFQ Cancelled</Badge>
            )}
            {rfq.status === 'Rejected' && (
              <Badge variant="destructive">RFQ Rejected</Badge>
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
              <CardDescription>
                {quote.status === 'Accepted' || quote.status === 'Finalized'
                  ? 'Locked pricing for each product — negotiation is closed'
                  : 'Review and negotiate pricing per product. Each item can be accepted, countered, or removed independently.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quote.product_quotes?.map((productQuote, index) => {
                  const product = rfq.products?.find(p => p.id === productQuote.product_id);
                  if (!product) return null;
                  const myTurn = isMyTurn(productQuote);
                  const draft = getDraft(productQuote.id);

                  return (
                    <div key={productQuote.id} className="border border-card-border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{product.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Product {index + 1}</Badge>
                          <Badge className={lineStatusColor(productQuote.status)}>{productQuote.status}</Badge>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Quantity</p>
                          <p className="font-medium">{product.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {productQuote.status === 'Countered' ? 'Current Offer' : 'Unit Price'}
                          </p>
                          <p className="font-medium">
                            ₹{(productQuote.status === 'Countered' && productQuote.last_offer_by === 'customer'
                              ? productQuote.customer_offer_price
                              : productQuote.unit_price
                            )?.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Lead Time</p>
                          <p className="font-medium">{productQuote.lead_time} days</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Line Total</p>
                          <p className="font-medium">
                            ₹{((productQuote.status === 'Countered' && productQuote.last_offer_by === 'customer'
                              ? productQuote.customer_offer_price!
                              : productQuote.unit_price) * product.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-1">Terms & Conditions</p>
                        <p className="text-sm">{productQuote.terms || 'Standard terms apply'}</p>
                      </div>

                      {/* Negotiation history */}
                      {!!productQuote.offers?.length && (
                        <div className="mb-3 space-y-1 print:hidden">
                          <p className="text-sm text-muted-foreground mb-1">Negotiation History</p>
                          {[...productQuote.offers]
                            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                            .map(offer => (
                              <p key={offer.id} className="text-xs text-muted-foreground">
                                <span className="font-medium capitalize">{offer.actor}</span> offered ₹{offer.unit_price.toLocaleString()}
                                {offer.message ? ` — "${offer.message}"` : ''}
                              </p>
                            ))}
                        </div>
                      )}

                      {/* Negotiation controls -- only while the quote is still
                          Pending. Once the supplier submits the final
                          quotation, pricing is locked and these disappear. */}
                      {quote.status === 'Pending' && productQuote.status !== 'Accepted' && productQuote.status !== 'Rejected' && !rfqIsClosed && (
                        <div className="print:hidden space-y-3 pt-2">
                          {!myTurn ? (
                            <p className="text-sm text-muted-foreground italic">
                              Waiting for {isMine ? 'customer' : 'supplier'}'s response...
                            </p>
                          ) : (
                            <>
                              {/* ✓ accepts the current price as-is. ✕ opens the
                                  counter box below to type a new price and send
                                  it back — it doesn't reject the item outright. */}
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" onClick={() => handleAccept(productQuote)}>
                                  <CheckCircle className="w-4 h-4 mr-1" /> Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant={counterOpenFor[productQuote.id] ? 'secondary' : 'outline'}
                                  onClick={() => toggleCounter(productQuote.id)}
                                >
                                  <X className="w-4 h-4 mr-1" /> Counter
                                </Button>
                              </div>
                              {counterOpenFor[productQuote.id] && (
                                <div className="grid sm:grid-cols-[140px_1fr_auto] gap-2 items-end">
                                  <div>
                                    <Label htmlFor={`counter-${productQuote.id}`} className="text-xs">New Price (₹)</Label>
                                    <Input
                                      id={`counter-${productQuote.id}`}
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      autoFocus
                                      value={draft.price}
                                      onChange={(e) => setDraft(productQuote.id, { price: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`msg-${productQuote.id}`} className="text-xs">Message (optional)</Label>
                                    <Input
                                      id={`msg-${productQuote.id}`}
                                      placeholder="e.g. Can you do this for a bulk order?"
                                      value={draft.message}
                                      onChange={(e) => setDraft(productQuote.id, { message: e.target.value })}
                                    />
                                  </div>
                                  <Button size="sm" variant="secondary" onClick={() => handleCounter(productQuote)}>
                                    <Handshake className="w-4 h-4 mr-1" /> Send
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                          {/* Removing a stalled item doesn't need to wait for your turn --
                              either side can walk away from a single product at any point,
                              and the rest of the RFQ can still complete without it. */}
                          <div className="pt-1">
                            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => handleReject(productQuote)}>
                              <Trash2 className="w-4 h-4 mr-1" /> Remove This Product
                            </Button>
                          </div>
                        </div>
                      )}
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
                    <div><span className="text-muted-foreground">Created:</span> {formatDateTime(rfq.created_at)}</div>
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
              <CardTitle>{quote.status === 'Accepted' ? 'PO Summary' : 'Quote Summary'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-bold">₹{quote.total_amount.toLocaleString()}</span>
                </div>
              </div>

              {rfq.status === 'Cancelled' && (
                <div className="pt-4">
                  <div className="flex items-center justify-center p-3 bg-red-50 rounded-lg">
                    <X className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-800 font-medium">
                      RFQ Cancelled{rfq.cancelled_by ? ` by ${rfq.cancelled_by}` : ''}
                    </span>
                  </div>
                </div>
              )}

              {rfq.status === 'Rejected' && (
                <div className="pt-4">
                  <div className="flex items-center justify-center p-3 bg-red-50 rounded-lg">
                    <X className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-800 font-medium">Quotation Rejected — RFQ Closed</span>
                  </div>
                </div>
              )}

              {/* Phase 1: negotiating. Once every item is agreed, the
                  supplier (not an automatic process) submits the formal
                  quotation. */}
              {quote.status === 'Pending' && !isExpired && !rfqIsClosed && (
                <div className="space-y-3 pt-4 print:hidden">
                  {fullyAgreed ? (
                    isMine ? (
                      <>
                        <p className="text-sm text-green-700 bg-green-50 rounded-md p-2 text-center">
                          All products agreed! Submit the formal quotation to the customer.
                        </p>
                        <Button variant="hero" className="w-full" onClick={handleSubmitQuotation}>
                          <FileCheck className="w-4 h-4 mr-2" />
                          Submit Final Quotation
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">
                        All products agreed — waiting for the supplier to submit the final quotation.
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">
                      Respond to each product above. Once every item is accepted by both sides, the supplier can submit the final quotation.
                    </p>
                  )}
                </div>
              )}

              {/* Phase 2: supplier finalized the quotation. Customer decides:
                  raise the PO, or reject and reopen negotiation. */}
              {quote.status === 'Finalized' && !rfqIsClosed && (
                <div className="space-y-3 pt-4 print:hidden">
                  {isMine ? (
                    <p className="text-sm text-muted-foreground text-center">
                      Quotation sent — waiting for the customer to submit a Purchase Order or respond.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-blue-700 bg-blue-50 rounded-md p-2 text-center">
                        The supplier has submitted their final quotation. Review it above.
                      </p>
                      <Button variant="hero" className="w-full" onClick={handleSubmitPO}>
                        <FileCheck className="w-4 h-4 mr-2" />
                        Accept Quote & Create PO
                      </Button>
                      <Button variant="outline" className="w-full" onClick={handleRejectQuotation}>
                        <X className="w-4 h-4 mr-2" />
                        Reject Quote
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Recovery: a quote can end up 'Accepted' with no order behind
                  it if PO creation failed partway through. Offer a retry
                  instead of rendering nothing. */}
              {quote.status === 'Accepted' && !order && (
                <div className="pt-4 space-y-3">
                  <p className="text-sm text-red-700 bg-red-50 rounded-md p-2 text-center">
                    This Purchase Order didn't finish being created.
                  </p>
                  {!isMine && (
                    <Button variant="hero" className="w-full" onClick={() => retryOrderCreation(quote!.id)}>
                      Retry Purchase Order Creation
                    </Button>
                  )}
                </div>
              )}

              {/* Phase 3: PO submitted, awaiting supplier acknowledgement. */}
              {quote.status === 'Accepted' && order && (
                <div className="pt-4 space-y-3">
                  <div className={`flex items-center justify-center p-3 rounded-lg ${order.status === 'PO Submitted' ? 'bg-blue-50' : 'bg-green-50'}`}>
                    {order.status === 'PO Submitted' ? (
                      <>
                        <Clock className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-blue-800 font-medium">PO Submitted — Awaiting Acknowledgement</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">Purchase Order Acknowledged</span>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground text-center space-y-1">
                    <p>PO Number: <span className="font-medium text-foreground">{order.po_number}</span></p>
                    <p>PO Date: <span className="font-medium text-foreground">{formatDateTime(order.created_at)}</span></p>
                    <p>Order Number: <span className="font-medium text-foreground">{order.order_number}</span></p>
                    {order.acknowledged_at && (
                      <p>Acknowledged: <span className="font-medium text-foreground">{formatDateTime(order.acknowledged_at)}</span></p>
                    )}
                  </div>

                  {order.status === 'PO Submitted' && (
                    isMine ? (
                      <Button variant="hero" className="w-full print:hidden" onClick={handleAcknowledgePO}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Acknowledge PO
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">
                        Waiting for the supplier to acknowledge this PO.
                      </p>
                    )
                  )}

                  <p className="text-sm text-muted-foreground text-center">
                    This copy is available to both the customer and the supplier from their dashboards.
                  </p>
                  <Button variant="outline" className="w-full print:hidden" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print / Save PO Copy
                  </Button>
                </div>
              )}

              {isExpired && quote.status === 'Pending' && (
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
          <Card className="shadow-card print:hidden">
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
              {!rfqIsClosed && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:text-red-700"
                  onClick={handleCancelRFQ}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel RFQ
                </Button>
              )}
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
