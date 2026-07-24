import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, MessageCircle, Calendar, ExternalLink, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSupabaseWorkflow } from "@/hooks/useSupabaseWorkflow";
import { format } from "date-fns";
import { ChatDialog } from "@/components/ChatDialog";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { rfqs, loading } = useSupabaseWorkflow();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedRFQForChat, setSelectedRFQForChat] = useState<{ id: string; rfq_number: string } | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Created':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Order_Placed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'PO_Raised':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredRFQs = useMemo(() => {
    return rfqs.filter(rfq => {
      const matchesSearch = searchQuery === '' || 
        rfq.rfq_number.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rfqs, searchQuery, statusFilter]);

  const getQuoteNumber = (rfq: any) => {
    // This would need to be connected to quotes data
    return rfq.status === 'Completed' || rfq.status === 'Cancelled' ? 'QUO001' : '-';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">📑 RFQ Dashboard</h1>
          <p className="text-muted-foreground">Manage your Request for Quotations and track their progress</p>
        </div>
        <Button onClick={() => navigate('/rfq')} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Create RFQ
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-card mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by RFQ number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Created">Created</SelectItem>
                <SelectItem value="Order_Placed">Order Placed</SelectItem>
                <SelectItem value="PO_Raised">PO Raised</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* RFQ Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {rfqs.filter(r => r.status === 'Created').length}
            </div>
            <p className="text-sm text-muted-foreground">Created</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {rfqs.filter(r => r.status === 'Order_Placed').length}
            </div>
            <p className="text-sm text-muted-foreground">Order Placed</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {rfqs.filter(r => r.status === 'PO_Raised').length}
            </div>
            <p className="text-sm text-muted-foreground">PO Raised</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {rfqs.filter(r => r.status === 'Completed').length}
            </div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {rfqs.filter(r => r.status === 'Cancelled').length}
            </div>
            <p className="text-sm text-muted-foreground">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* RFQ List */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Your RFQs</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRFQs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No RFQs Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start by creating your first Request for Quote.'
                }
              </p>
              {(!searchQuery && statusFilter === 'all') && (
                <Button onClick={() => navigate('/rfq')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First RFQ
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">RFQ No.</th>
                    <th className="text-left py-3 px-4 font-medium">Created Date</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Quote No.</th>
                    <th className="text-left py-3 px-4 font-medium">Products</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRFQs.map((rfq) => (
                    <tr key={rfq.id} className="border-b hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <Button
                          variant="link"
                          onClick={() => navigate(`/rfq/${rfq.id}`)}
                          className="p-0 h-auto font-semibold text-primary"
                        >
                          {rfq.rfq_number}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          {format(new Date(rfq.created_at), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusColor(rfq.status)}>
                          {rfq.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm">
                          {getQuoteNumber(rfq)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-muted-foreground">
                          {rfq.products?.length || 0} items
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Open chat dialog instead of navigating
                              setSelectedRFQForChat({ id: rfq.id, rfq_number: rfq.rfq_number });
                              setChatDialogOpen(true);
                            }}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/rfq/${rfq.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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

export default DashboardPage;