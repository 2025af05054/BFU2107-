import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Package, Clock, CheckCircle } from "lucide-react";

interface RFQSummary {
  id: string;
  rfq_number: string;
  created_at: string;
  status: string;
  product_count: number;
}

const SupplierDashboard = () => {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState<RFQSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRFQs: 0,
    pendingQuotes: 0,
    submittedQuotes: 0
  });

  useEffect(() => {
    fetchRFQs();
  }, [user]);

  const fetchRFQs = async () => {
    if (!user) return;

    try {
      // Fetch RFQs with product counts
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select(`
          id,
          rfq_number,
          created_at,
          status,
          products(id)
        `)
        .order('created_at', { ascending: false });

      if (rfqError) throw rfqError;

      // Process RFQ data
      const processedRFQs = rfqData?.map(rfq => ({
        id: rfq.id,
        rfq_number: rfq.rfq_number,
        created_at: rfq.created_at,
        status: rfq.status,
        product_count: rfq.products?.length || 0
      })) || [];

      setRfqs(processedRFQs);

      // Calculate stats
      const { data: quotesData } = await supabase
        .from('quotes')
        .select('id, status')
        .eq('supplier_id', user.id);

      const submittedQuotes = quotesData?.length || 0;
      const pendingQuotes = processedRFQs.length - submittedQuotes;

      setStats({
        totalRFQs: processedRFQs.length,
        pendingQuotes: Math.max(0, pendingQuotes),
        submittedQuotes
      });
    } catch (error) {
      console.error('Error fetching RFQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'created':
        return <Badge variant="secondary">New</Badge>;
      case 'quoted':
        return <Badge variant="outline">Quoted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Supplier Dashboard</h1>
          <p className="text-muted-foreground">Manage your RFQ responses and quotes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total RFQs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRFQs}</div>
              <p className="text-xs text-muted-foreground">Available to quote</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingQuotes}</div>
              <p className="text-xs text-muted-foreground">Need response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted Quotes</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.submittedQuotes}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* RFQs List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Available RFQs
            </CardTitle>
            <CardDescription>
              View and respond to customer RFQs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rfqs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">No RFQs Available</p>
                <p className="text-sm text-muted-foreground">
                  New RFQs will appear here when customers create them
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rfqs.map((rfq) => (
                  <div
                    key={rfq.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{rfq.rfq_number}</h3>
                        {getStatusBadge(rfq.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          <Package className="h-4 w-4 inline mr-1" />
                          {rfq.product_count} products
                        </span>
                        <span>
                          Created {new Date(rfq.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/rfq/${rfq.id}`}>View Details</a>
                      </Button>
                      <Button size="sm" asChild>
                        <a href={`/quote/create/${rfq.id}`}>Create Quote</a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupplierDashboard;