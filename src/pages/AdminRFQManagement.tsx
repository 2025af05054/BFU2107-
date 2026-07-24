import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RoleBasedRoute } from '@/components/RoleBasedRoute';
import Layout from '@/components/Layout';
import { FileText, Eye, Edit, MessageSquare, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ChatDialog } from '@/components/ChatDialog';

interface RFQ {
  id: string;
  rfq_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  customer_id?: string;
  customer_name?: string;
  rfq_type?: 'customer' | 'admin'; // New field to distinguish RFQ source
  products?: {
    id: string;
    name: string;
    description: string;
    quantity: number;
    type: string;
  }[];
  quote_count?: number;
}

const AdminRFQManagement = () => {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rfqTypeFilter, setRfqTypeFilter] = useState<string>('all'); // New filter
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedRFQForChat, setSelectedRFQForChat] = useState<{ id: string; rfq_number: string } | null>(null);
  const { toast } = useToast();

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'Created', label: 'Created' },
    { value: 'Order_Placed', label: 'Order Placed' },
    { value: 'PO_Raised', label: 'PO Raised' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  const rfqTypeOptions = [
    { value: 'all', label: 'All RFQ Types' },
    { value: 'customer', label: 'Customer Raised' },
    { value: 'admin', label: 'Admin Raised' }
  ];

  useEffect(() => {
    fetchRFQs();
  }, []);

  const fetchRFQs = async () => {
    try {
      setLoading(true);
      
      // Fetch RFQs with related data
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select(`
          id,
          rfq_number,
          status,
          created_at,
          updated_at,
          user_id,
          customer_id,
          products (
            id,
            name,
            description,
            quantity,
            type
          )
        `)
        .order('created_at', { ascending: false });

      if (rfqError) throw rfqError;

      // Fetch customer profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, company');

      if (profileError) throw profileError;

      // Fetch quote counts for each RFQ
      const { data: quoteCounts, error: quoteError } = await supabase
        .from('quotes')
        .select('rfq_id')
        .in('rfq_id', rfqData?.map(rfq => rfq.id) || []);

      if (quoteError) throw quoteError;

      // Combine data
      const enrichedRFQs: RFQ[] = rfqData?.map(rfq => {
        // Determine RFQ type: if customer_id is present and different from user_id, it's admin-raised
        const rfqType: 'customer' | 'admin' = rfq.customer_id && rfq.customer_id !== rfq.user_id 
          ? 'admin' 
          : 'customer';
        
        // For customer-raised RFQs, show the user who created it
        // For admin-raised RFQs, show the customer it's for
        const relevantCustomerId = rfqType === 'admin' ? rfq.customer_id : rfq.user_id;
        const customer = profiles?.find(p => p.id === relevantCustomerId);
        const quoteCount = quoteCounts?.filter(q => q.rfq_id === rfq.id).length || 0;
        
        return {
          ...rfq,
          rfq_type: rfqType,
          customer_name: customer?.name || customer?.company || 'Unknown Customer',
          quote_count: quoteCount
        };
      }) || [];

      setRfqs(enrichedRFQs);
    } catch (error) {
      console.error('Error fetching RFQs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch RFQ data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRFQStatus = async (rfqId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ status: newStatus })
        .eq('id', rfqId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "RFQ status updated successfully",
      });

      fetchRFQs(); // Refresh data
    } catch (error) {
      console.error('Error updating RFQ status:', error);
      toast({
        title: "Error",
        description: "Failed to update RFQ status",
        variant: "destructive",
      });
    }
  };

  const submitRFQToSuppliers = async (rfqId: string) => {
    try {
      // In a real implementation, this would send notifications to suppliers
      await updateRFQStatus(rfqId, 'Published');
      
      toast({
        title: "Success",
        description: "RFQ has been submitted to suppliers",
      });
    } catch (error) {
      console.error('Error submitting RFQ:', error);
      toast({
        title: "Error",
        description: "Failed to submit RFQ to suppliers",
        variant: "destructive",
      });
    }
  };

  const handleRFQUpdate = async (rfqId: string, currentStatus: string) => {
    try {
      let newStatus = currentStatus;
      let successMessage = "RFQ updated successfully";

      // Determine next status based on current status
      switch (currentStatus) {
        case 'Created':
          newStatus = 'Order_Placed';
          successMessage = "RFQ status updated to Order Placed";
          break;
        case 'Order_Placed':
          newStatus = 'PO_Raised';
          successMessage = "RFQ status updated to PO Raised";
          break;
        case 'PO_Raised':
          newStatus = 'Completed';
          successMessage = "RFQ has been marked as completed";
          break;
        default:
          // If already completed or cancelled, do nothing
          toast({
            title: "Info",
            description: "RFQ is already in final status",
          });
          return;
      }

      await updateRFQStatus(rfqId, newStatus);
      
      toast({
        title: "Success",
        description: successMessage,
      });
    } catch (error) {
      console.error('Error updating RFQ:', error);
      toast({
        title: "Error",
        description: "Failed to update RFQ status",
        variant: "destructive",
      });
    }
  };

  const filteredRFQs = rfqs.filter(rfq => {
    const matchesSearch = rfq.rfq_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfq.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfq.products?.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    const matchesType = rfqTypeFilter === 'all' || rfq.rfq_type === rfqTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Created':
        return 'secondary';
      case 'Order_Placed':
        return 'default';
      case 'PO_Raised':
        return 'outline';
      case 'Completed':
        return 'default';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const viewRFQDetails = (rfq: RFQ) => {
    setSelectedRFQ(rfq);
    setDialogOpen(true);
  };

  const handleChatClick = (rfq: RFQ) => {
    setSelectedRFQForChat({ id: rfq.id, rfq_number: rfq.rfq_number });
    setChatDialogOpen(true);
  };

  return (
    <RoleBasedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">RFQ Management</h1>
              <p className="text-muted-foreground">View and manage all customer RFQs</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => fetchRFQs()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total RFQs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rfqs.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active RFQs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rfqs.filter(rfq => ['Created', 'Order_Placed', 'PO_Raised'].includes(rfq.status)).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rfqs.filter(rfq => rfq.status === 'Completed').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rfqs.filter(rfq => {
                    const rfqDate = new Date(rfq.created_at);
                    const currentDate = new Date();
                    return rfqDate.getMonth() === currentDate.getMonth() && 
                           rfqDate.getFullYear() === currentDate.getFullYear();
                  }).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search RFQs, customers, or products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="min-w-[150px]">
                  <Select value={rfqTypeFilter} onValueChange={setRfqTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {rfqTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[150px]">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {statusOptions.map((option) => (
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

          {/* RFQ Table */}
          <Card>
            <CardHeader>
              <CardTitle>All RFQs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading RFQs...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RFQ Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quotes</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRFQs.map((rfq) => (
                      <TableRow key={rfq.id}>
                        <TableCell className="font-medium">{rfq.rfq_number}</TableCell>
                        <TableCell>
                          <Badge variant={rfq.rfq_type === 'customer' ? 'secondary' : 'default'}>
                            {rfq.rfq_type === 'customer' ? 'Customer' : 'Admin'}
                          </Badge>
                        </TableCell>
                        <TableCell>{rfq.customer_name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {rfq.products?.length || 0} items
                            {rfq.products?.[0] && (
                              <div className="text-xs text-muted-foreground">
                                {rfq.products[0].name}
                                {rfq.products.length > 1 && ` +${rfq.products.length - 1} more`}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(rfq.status)}>
                            {rfq.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{rfq.quote_count}</TableCell>
                        <TableCell>{format(new Date(rfq.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewRFQDetails(rfq)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleChatClick(rfq)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Select
                              value={rfq.status}
                              onValueChange={(value) => updateRFQStatus(rfq.id, value)}
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
                            {(rfq.status === 'Created' || rfq.status === 'Order_Placed' || rfq.status === 'PO_Raised') && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleRFQUpdate(rfq.id, rfq.status)}
                              >
                                RFQ Update
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {!loading && filteredRFQs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No RFQs found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>

          {/* RFQ Details Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>RFQ Details - {selectedRFQ?.rfq_number}</DialogTitle>
                <DialogDescription>
                  Detailed information about this RFQ
                </DialogDescription>
              </DialogHeader>
              
              {selectedRFQ && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Customer</p>
                      <p className="text-sm text-muted-foreground">{selectedRFQ.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <Badge variant={getStatusBadgeVariant(selectedRFQ.status)}>
                        {selectedRFQ.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedRFQ.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedRFQ.updated_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Products</p>
                    <div className="space-y-2">
                      {selectedRFQ.products?.map((product) => (
                        <div key={product.id} className="border rounded p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.description}</p>
                              <p className="text-sm">Type: {product.type}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">Qty: {product.quantity}</p>
                            </div>
                          </div>
                        </div>
                      ))}
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
      </Layout>
    </RoleBasedRoute>
  );
};

export default AdminRFQManagement;