import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, DollarSign, Calendar, Package } from "lucide-react";

interface Quote {
  id: string;
  quote_number: string;
  rfq_id: string;
  status: string;
  total_amount: number;
  valid_until: string;
  created_at: string;
  rfq: {
    rfq_number: string;
    user_id: string;
  };
}

const RFQResponses = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, [user]);

  const fetchQuotes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          id,
          quote_number,
          rfq_id,
          status,
          total_amount,
          valid_until,
          created_at,
          rfqs!inner(
            rfq_number,
            user_id
          )
        `)
        .eq('supplier_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our Quote interface
      const transformedQuotes = data?.map((item: any) => ({
        ...item,
        rfq: item.rfqs
      })) || [];

      setQuotes(transformedQuotes);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading quotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Quote Responses</h1>
          <p className="text-muted-foreground">Track your submitted quotes and their status</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submitted Quotes
            </CardTitle>
            <CardDescription>
              All quotes you've submitted to customer RFQs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">No Quotes Submitted</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by responding to RFQs to build your quote history
                </p>
                <Button asChild>
                  <a href="/supplier-dashboard">Browse RFQs</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {quotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{quote.quote_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          For RFQ: {quote.rfq.rfq_number}
                        </p>
                      </div>
                      <Badge className={getStatusColor(quote.status)}>
                        {quote.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="text-muted-foreground">Amount: </span>
                          <span className="font-medium">
                            ${quote.total_amount?.toLocaleString() || 'N/A'}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="text-muted-foreground">Valid Until: </span>
                          <span className="font-medium">
                            {new Date(quote.valid_until).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="text-muted-foreground">Submitted: </span>
                          <span className="font-medium">
                            {new Date(quote.created_at).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-border">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/quote/${quote.id}`}>View Quote</a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/rfq/${quote.rfq_id}`}>View RFQ</a>
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

export default RFQResponses;