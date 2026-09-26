import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

export interface DatabaseRFQ {
  id: string;
  rfq_number: string;
  user_id: string;
  status: 'Created' | 'Order_Placed' | 'PO_Raised' | 'Completed' | 'Cancelled';
  cancelled_by?: 'customer' | 'supplier' | null;
  created_at: string;
  updated_at: string;
  products?: DatabaseProduct[];
}

export interface DatabaseProduct {
  id: string;
  rfq_id: string;
  type: 'identified' | 'unidentified';
  name: string;
  description?: string;
  manufacturer?: string;
  quantity: number;
  target_price?: number;
  target_lead_time?: number;
  images?: string[];
}

export interface DatabaseQuote {
  id: string;
  rfq_id: string;
  quote_number: string;
  supplier_id?: string;
  supplier_name: string;
  total_amount: number;
  valid_until: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  created_at: string;
  product_quotes?: DatabaseProductQuote[];
}

export interface DatabaseProductQuoteOffer {
  id: string;
  product_quote_id: string;
  actor: 'customer' | 'supplier';
  unit_price: number;
  lead_time?: number | null;
  message?: string | null;
  created_at: string;
}

export interface DatabaseProductQuote {
  id: string;
  quote_id: string;
  product_id: string;
  unit_price: number;
  lead_time: number;
  terms?: string;
  // Per-line negotiation state: each product on a quote can be accepted,
  // rejected, or countered independently of the others.
  status: 'Pending' | 'Countered' | 'Accepted' | 'Rejected';
  last_offer_by: 'supplier' | 'customer';
  customer_offer_price?: number | null;
  offers?: DatabaseProductQuoteOffer[];
}

export interface DatabaseOrder {
  id: string;
  rfq_id: string;
  quote_id: string;
  order_number: string;
  po_number: string;
  status: 'PO Accepted' | 'Order in Progress' | 'Out for Delivery' | 'Delivered';
  payment_status: 'Not Indicated' | 'Partial' | 'Done';
  delivery_date?: string;
  delivery_address: string;
  created_at: string;
}

export interface CreateRFQData {
  products: Omit<DatabaseProduct, 'id' | 'rfq_id' | 'created_at'>[];
}

export const useSupabaseWorkflow = () => {
  const { user } = useAuth();
  const { isSupplier } = useUserRole();
  const [rfqs, setRFQs] = useState<DatabaseRFQ[]>([]);
  const [quotes, setQuotes] = useState<DatabaseQuote[]>([]);
  const [orders, setOrders] = useState<DatabaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch RFQs with products. Customers see their own RFQs; suppliers see
  // the RFQs they've quoted on, so they can view/negotiate on those same
  // pages (e.g. QuoteDetailsPage) as the customer.
  const fetchRFQs = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('rfqs')
        .select(`
          *,
          products (*)
        `)
        .order('created_at', { ascending: false });

      query = isSupplier()
        ? query.in('id', (await supabase.from('quotes').select('rfq_id').eq('supplier_id', user.id)).data?.map(q => q.rfq_id) || [])
        : query.eq('user_id', user.id);

      const { data: rfqData, error: rfqError } = await query;

      if (rfqError) throw rfqError;
      setRFQs((rfqData || []) as DatabaseRFQ[]);
    } catch (error) {
      console.error('Error fetching RFQs:', error);
      toast.error('Failed to load RFQs');
    }
  };

  // Fetch quotes with product quotes. Customers see quotes on their RFQs;
  // suppliers see the quotes they submitted.
  const fetchQuotes = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('quotes')
        .select(`
          *,
          product_quotes (*, offers:product_quote_offers(*)),
          rfqs!inner (user_id)
        `)
        .order('created_at', { ascending: false });

      query = isSupplier()
        ? query.eq('supplier_id', user.id)
        : query.eq('rfqs.user_id', user.id);

      const { data: quoteData, error: quoteError } = await query;

      if (quoteError) throw quoteError;
      setQuotes((quoteData || []) as DatabaseQuote[]);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast.error('Failed to load quotes');
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          rfqs!inner (user_id),
          quotes!inner (supplier_id)
        `)
        .order('created_at', { ascending: false });

      query = isSupplier()
        ? query.eq('quotes.supplier_id', user.id)
        : query.eq('rfqs.user_id', user.id);

      const { data: orderData, error: orderError } = await query;

      if (orderError) throw orderError;
      setOrders((orderData || []) as DatabaseOrder[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    }
  };

  // Create RFQ
  const submitRFQ = async (rfqData: CreateRFQData): Promise<string | null> => {
    if (!user) {
      toast.error('Please sign in to submit RFQ');
      return null;
    }

    try {
      console.log('Submitting RFQ with data:', rfqData);
      
      // Create RFQ (auto-generates rfq_number via trigger)
      const { data: rfq, error: rfqError } = await supabase
        .from('rfqs')
        .insert([{
          user_id: user.id,
        }] as any)
        .select()
        .single();

      if (rfqError) {
        console.error('RFQ creation error:', rfqError);
        
        // Check for specific RLS policy error
        if (rfqError.code === '42501' || rfqError.message.includes('policy')) {
          toast.error('Access denied. Please contact support to set up your account role.');
        } else {
          toast.error(`Failed to create RFQ: ${rfqError.message}`);
        }
        throw rfqError;
      }

      console.log('RFQ created successfully:', rfq);

      // Create products
      const productsToInsert = rfqData.products.map(product => ({
        ...product,
        rfq_id: rfq.id,
      }));

      console.log('Inserting products:', productsToInsert);

      const { error: productsError } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (productsError) {
        console.error('Products creation error:', productsError);
        toast.error(`Failed to add products: ${productsError.message}`);
        throw productsError;
      }

      console.log('Products created successfully');

      toast.success('RFQ submitted successfully!');

      await fetchRFQs();
      return rfq.id;
    } catch (error) {
      console.error('Error submitting RFQ:', error);
      return null;
    }
  };

  // A quote is ready to become a Purchase Order only once every product on
  // it has been individually agreed by both sides — no partial POs.
  const isQuoteFullyAgreed = (quote: DatabaseQuote) =>
    !!quote.product_quotes?.length &&
    quote.product_quotes.every(pq => pq.status === 'Accepted');

  // Customer responds to the supplier's current price for one product line:
  // accept it as-is, counter with a different price, or reject that item.
  const customerRespondToLineItem = async (
    productQuoteId: string,
    action: 'accept' | 'counter' | 'reject',
    payload?: { price?: number; message?: string }
  ) => {
    try {
      if (action === 'accept') {
        const { error } = await supabase
          .from('product_quotes')
          .update({ status: 'Accepted', last_offer_by: 'customer' })
          .eq('id', productQuoteId);
        if (error) throw error;
        toast.success('Price accepted for this product');
      } else if (action === 'counter') {
        if (payload?.price === undefined) return;
        const { error } = await supabase
          .from('product_quotes')
          .update({
            status: 'Countered',
            last_offer_by: 'customer',
            customer_offer_price: payload.price,
          })
          .eq('id', productQuoteId);
        if (error) throw error;

        await supabase.from('product_quote_offers').insert([{
          product_quote_id: productQuoteId,
          actor: 'customer',
          unit_price: payload.price,
          message: payload.message || null,
        }] as any);

        toast.success('Counter-offer sent to supplier');
      } else {
        const { error } = await supabase
          .from('product_quotes')
          .update({ status: 'Rejected', last_offer_by: 'customer' })
          .eq('id', productQuoteId);
        if (error) throw error;
        toast.success('Product rejected from this quote');
      }

      await fetchQuotes();
    } catch (error) {
      console.error('Error responding to product quote:', error);
      toast.error('Failed to save your response');
    }
  };

  // Supplier responds to the customer's counter-offer (or an untouched line
  // item): accept the customer's price, counter back with a new one, or
  // reject that item entirely.
  const supplierRespondToLineItem = async (
    productQuoteId: string,
    action: 'accept' | 'counter' | 'reject',
    payload?: { price?: number; leadTime?: number; message?: string }
  ) => {
    try {
      const productQuote = quotes
        .flatMap(q => q.product_quotes || [])
        .find(pq => pq.id === productQuoteId);

      if (action === 'accept') {
        const acceptedPrice = productQuote?.customer_offer_price ?? productQuote?.unit_price;
        const { error } = await supabase
          .from('product_quotes')
          .update({
            status: 'Accepted',
            last_offer_by: 'supplier',
            unit_price: acceptedPrice,
          })
          .eq('id', productQuoteId);
        if (error) throw error;
        toast.success('Customer\'s price accepted for this product');
      } else if (action === 'counter') {
        if (payload?.price === undefined) return;
        const { error } = await supabase
          .from('product_quotes')
          .update({
            status: 'Countered',
            last_offer_by: 'supplier',
            unit_price: payload.price,
            lead_time: payload.leadTime ?? productQuote?.lead_time,
            customer_offer_price: null,
          })
          .eq('id', productQuoteId);
        if (error) throw error;

        await supabase.from('product_quote_offers').insert([{
          product_quote_id: productQuoteId,
          actor: 'supplier',
          unit_price: payload.price,
          lead_time: payload.leadTime ?? null,
          message: payload.message || null,
        }] as any);

        toast.success('Counter-offer sent to customer');
      } else {
        const { error } = await supabase
          .from('product_quotes')
          .update({ status: 'Rejected', last_offer_by: 'supplier' })
          .eq('id', productQuoteId);
        if (error) throw error;
        toast.success('Product rejected from this quote');
      }

      await fetchQuotes();
    } catch (error) {
      console.error('Error responding to product quote:', error);
      toast.error('Failed to save your response');
    }
  };

  // Finalize a quote into a Purchase Order. Only allowed once every line
  // item has reached 'Accepted' — this is the moment the PO copy is created
  // for both the customer and the supplier dashboard.
  const acceptQuote = async (quoteId: string) => {
    try {
      const quote = quotes.find(q => q.id === quoteId);
      if (!quote) return;

      if (!isQuoteFullyAgreed(quote)) {
        toast.error('All products must be agreed on before the PO can be generated');
        return;
      }

      // Update quote status
      const { error: quoteUpdateError } = await supabase
        .from('quotes')
        .update({ status: 'Accepted' })
        .eq('id', quoteId);

      if (quoteUpdateError) throw quoteUpdateError;

      // Create order (auto-generates order_number via trigger)
      const { error: orderError } = await supabase
        .from('orders')
        .insert([{
          rfq_id: quote.rfq_id,
          quote_id: quoteId,
          po_number: `PO${Date.now().toString().slice(-6)}`,
          delivery_address: 'Default delivery address',
          delivery_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }] as any);

      if (orderError) throw orderError;

      // Update RFQ status
      const { error: rfqUpdateError } = await supabase
        .from('rfqs')
        .update({ status: 'Order_Placed' })
        .eq('id', quote.rfq_id);

      if (rfqUpdateError) throw rfqUpdateError;

      toast.success('All items agreed — Purchase Order created for both sides!');
      await fetchRFQs();
      await fetchQuotes();
      await fetchOrders();
    } catch (error) {
      console.error('Error accepting quote:', error);
      toast.error('Failed to accept quote');
    }
  };

  const rejectQuote = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'Rejected' })
        .eq('id', quoteId);

      if (error) throw error;

      toast.success('Quote rejected. You can request a new quote or negotiate terms.');
      await fetchQuotes();
    } catch (error) {
      console.error('Error rejecting quote:', error);
      toast.error('Failed to reject quote');
    }
  };

  // Cancel an RFQ entirely. Available to the customer who owns it, or any
  // supplier who has quoted on it, at any point in the negotiation -- a
  // deal can be called off from either side, not just by the party that
  // started it. Blocked once the RFQ is already done (Completed/Cancelled)
  // since there's nothing left to call off.
  const cancelRFQ = async (rfqId: string) => {
    try {
      const rfq = rfqs.find(r => r.id === rfqId);
      if (!rfq) return;

      if (rfq.status === 'Cancelled' || rfq.status === 'Completed') {
        toast.error('This RFQ is already closed');
        return;
      }

      const { error } = await supabase
        .from('rfqs')
        .update({ status: 'Cancelled', cancelled_by: isSupplier() ? 'supplier' : 'customer' })
        .eq('id', rfqId);

      if (error) throw error;

      toast.success('RFQ cancelled');
      await fetchRFQs();
      await fetchQuotes();
    } catch (error) {
      console.error('Error cancelling RFQ:', error);
      toast.error('Failed to cancel RFQ');
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: DatabaseOrder['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order status updated');
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  // Update payment status
  const updatePaymentStatus = async (orderId: string, paymentStatus: DatabaseOrder['payment_status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: paymentStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Payment status updated');
      await fetchOrders();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchRFQs(), fetchQuotes(), fetchOrders()]);
        setLoading(false);
      };
      loadData();
    } else {
      setRFQs([]);
      setQuotes([]);
      setOrders([]);
      setLoading(false);
    }
    // Re-fetch once the role resolves (isSupplier() flips from false to true)
    // so a supplier's view doesn't get stuck on the customer-shaped query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isSupplier()]);

  return {
    rfqs,
    quotes,
    orders,
    loading,
    submitRFQ,
    acceptQuote,
    rejectQuote,
    cancelRFQ,
    isQuoteFullyAgreed,
    customerRespondToLineItem,
    supplierRespondToLineItem,
    updateOrderStatus,
    updatePaymentStatus,
    refresh: () => {
      fetchRFQs();
      fetchQuotes();
      fetchOrders();
    }
  };
};