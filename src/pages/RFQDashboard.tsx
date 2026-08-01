import { useState } from "react";
import { Eye, MessageSquare, Plus, Filter, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseWorkflow } from "@/hooks/useSupabaseWorkflow";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ChatDialog } from "@/components/ChatDialog";
import { useRFQStatusUpdates } from "@/hooks/useRFQStatusUpdates";

const RFQDashboard = () => {
  const { rfqs, quotes, loading, refresh } = useSupabaseWorkflow();
  const { signOut } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedRFQForChat, setSelectedRFQForChat] = useState<{ id: string; rfq_number: string } | null>(null);

  // Set up real-time RFQ status updates
  useRFQStatusUpdates((updatedRFQ) => {
    // Refresh RFQs when status changes
    refresh();
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filteredRFQs = rfqs.filter(rfq => {
    const matchesStatus = statusFilter === "all" || rfq.status.toLowerCase().replace(' ', '_') === statusFilter.toLowerCase();
    const matchesSearch = rfq.rfq_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rfq.products?.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Created': return 'bg-blue-100 text-blue-800';
      case 'Order_Placed': return 'bg-orange-100 text-orange-800';
      case 'PO_Raised': return 'bg-purple-100 text-purple-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuoteForRFQ = (rfqId: string) => {
    return quotes.find(q => q.rfq_id === rfqId);
  };

  const handleChatClick = (rfq: { id: string; rfq_number: string }) => {
    setSelectedRFQForChat(rfq);
    setChatDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">RFQ Dashboard</h1>
          <p className="text-muted-foreground">Manage your requests for quotes and track their progress.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/rfq">
            <Button variant="hero" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Create New RFQ
            </Button>
          </Link>
          <Button variant="outline" size="lg" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6 shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by RFQ ID or product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="order_placed">Order Placed</SelectItem>
                  <SelectItem value="po_raised">PO Raised</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RFQ List */}
      <div className="space-y-4">
        {filteredRFQs.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No RFQs Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || statusFilter !== "all" 
                  ? "No RFQs match your current filters. Try adjusting your search criteria."
                  : "You haven't created any RFQs yet. Create your first RFQ to get started."
                }
              </p>
              <Link to="/rfq">
                <Button variant="hero">Create Your First RFQ</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          filteredRFQs.map((rfq) => {
            const quote = getQuoteForRFQ(rfq.id);
            
            return (
              <Card key={rfq.id} className="shadow-card hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Link 
                          to={`/rfq/${rfq.id}`} 
                          className="text-xl font-semibold text-primary hover:underline"
                        >
                          {rfq.rfq_number}
                        </Link>
                        <Badge className={getStatusColor(rfq.status)}>
                          {rfq.status}
                        </Badge>
                        {quote && (
                          <Badge variant="outline">
                            Quote: {quote.quote_number}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Created:</span> {new Date(rfq.created_at).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Products:</span> {rfq.products?.length || 0} item(s)
                        </div>
                        <div>
                          <span className="font-medium">RFQ ID:</span> {rfq.rfq_number}
                        </div>
                      </div>

                      {/* Product Summary */}
                      <div className="mt-3">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">Products: </span>
                          {rfq.products?.map(p => p.name).join(', ') || 'No products'}
                        </p>
                      </div>

                      {quote && quote.status === 'Pending' && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-800">
                            <span className="font-medium">New Quote Available!</span> 
                            {' '}₹{quote.total_amount.toLocaleString()} from {quote.supplier_name}
                          </p>
                          <Link to={`/quote/${quote.id}`} className="mt-2 inline-block">
                            <Button variant="premium" size="sm">
                              View Quote Details
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleChatClick(rfq)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                      <Link to={`/rfq/${rfq.id}`}>
                        <Button variant="premium" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Chat Dialog */}
      {selectedRFQForChat && (
        <ChatDialog
          open={chatDialogOpen}
          onOpenChange={setChatDialogOpen}
          rfqId={selectedRFQForChat.id}
          rfqNumber={selectedRFQForChat.rfq_number}
        />
      )}
    </div>
  );
};

export default RFQDashboard;