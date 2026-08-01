import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface RFQProduct {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  target_price: number | null;
  target_lead_time: number | null;
}

interface RFQ {
  id: string;
  rfq_number: string;
  products: RFQProduct[];
}

interface LineItem {
  unit_price: string;
  lead_time: string;
  terms: string;
}

const CreateQuotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [lineItems, setLineItems] = useState<Record<string, LineItem>>({});

  useEffect(() => {
    fetchRFQ();
  }, [id]);

  const fetchRFQ = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("rfqs")
        .select("id, rfq_number, products(id, name, description, quantity, target_price, target_lead_time)")
        .eq("id", id)
        .single();

      if (error) throw error;

      setRfq(data as unknown as RFQ);

      const initialItems: Record<string, LineItem> = {};
      (data.products || []).forEach((p: RFQProduct) => {
        initialItems[p.id] = {
          unit_price: p.target_price ? String(p.target_price) : "",
          lead_time: p.target_lead_time ? String(p.target_lead_time) : "",
          terms: "",
        };
      });
      setLineItems(initialItems);
    } catch (error) {
      console.error("Error fetching RFQ:", error);
      toast.error("Failed to load RFQ");
    } finally {
      setLoading(false);
    }
  };

  const updateLineItem = (productId: string, field: keyof LineItem, value: string) => {
    setLineItems((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  };

  const totalAmount = rfq
    ? rfq.products.reduce((sum, p) => {
        const price = parseFloat(lineItems[p.id]?.unit_price || "0") || 0;
        return sum + price * p.quantity;
      }, 0)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfq || !user) return;

    const missingPrice = rfq.products.some((p) => !lineItems[p.id]?.unit_price);
    if (missingPrice) {
      toast.error("Please enter a unit price for every product");
      return;
    }

    setSubmitting(true);
    try {
      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .insert([
          {
            rfq_id: rfq.id,
            supplier_id: user.id,
            supplier_name: user.email || "Supplier",
            total_amount: totalAmount,
            valid_until: validUntil,
          },
        ] as any)
        .select()
        .single();

      if (quoteError) throw quoteError;

      const productQuotesToInsert = rfq.products.map((p) => ({
        quote_id: quote.id,
        product_id: p.id,
        unit_price: parseFloat(lineItems[p.id].unit_price),
        lead_time: parseInt(lineItems[p.id].lead_time || "0", 10),
        terms: lineItems[p.id].terms || "Standard terms apply",
      }));

      const { error: productQuotesError } = await supabase
        .from("product_quotes")
        .insert(productQuotesToInsert);

      if (productQuotesError) throw productQuotesError;

      await supabase.from("rfqs").update({ status: "Quoted" }).eq("id", rfq.id);

      toast.success("Quote submitted successfully!");
      navigate("/rfq-responses");
    } catch (error) {
      console.error("Error submitting quote:", error);
      toast.error("Failed to submit quote");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">RFQ Not Found</h1>
        <Link to="/supplier-dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        to={`/rfq/${rfq.id}`}
        className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to RFQ {rfq.rfq_number}
      </Link>

      <h1 className="text-3xl font-bold mb-2">Create Quote</h1>
      <p className="text-muted-foreground mb-8">For RFQ {rfq.rfq_number}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {rfq.products.map((product, index) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                {index + 1}. {product.name}
              </CardTitle>
              <CardDescription>
                {product.description} • Quantity: {product.quantity}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`price-${product.id}`}>Unit Price (₹) *</Label>
                <Input
                  id={`price-${product.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={lineItems[product.id]?.unit_price || ""}
                  onChange={(e) => updateLineItem(product.id, "unit_price", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`lead-${product.id}`}>Lead Time (days)</Label>
                <Input
                  id={`lead-${product.id}`}
                  type="number"
                  min="0"
                  value={lineItems[product.id]?.lead_time || ""}
                  onChange={(e) => updateLineItem(product.id, "lead_time", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`terms-${product.id}`}>Terms</Label>
                <Input
                  id={`terms-${product.id}`}
                  placeholder="e.g. 30 days payment terms"
                  value={lineItems[product.id]?.terms || ""}
                  onChange={(e) => updateLineItem(product.id, "terms", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Quote Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="valid-until">Quote Valid Until</Label>
              <Input
                id="valid-until"
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span className="font-medium">Total Amount:</span>
              <span className="font-bold">₹{totalAmount.toLocaleString()}</span>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Submit Quote
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default CreateQuotePage;
