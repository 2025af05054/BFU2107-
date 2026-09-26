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
  // Set when the RFQ was created from one specific supplier's portfolio, so
  // it's private to that supplier instead of broadcast to everyone.
  target_supplier_id?: string | null;
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
  // When set, this RFQ is private to that one supplier (e.g. the customer
  // built it from that supplier's portfolio page) instead of open to all.
  targetSupplierId?: string;
}

// Notifications are plain rows any authenticated user can insert for any
// other user (see the "System can create notifications" RLS policy) -- this
// is how the other party in a negotiation finds out something happened
// without needing a server-side job.
const notifyUser = async (userId: string, message: string, link?: string) => {
  try {
    await supabase.from('notifications').insert([{ user_id: userId, message, link: link || null }] as any);
  } catch (error) {
    // Best-effort: a failed notification shouldn't block the underlying
    // negotiation action from succeeding.
    console.error('Error creating notification:', error);
  }
};

export const useSupabaseWorkflow = () => {
  const { user } = useAuth();
  const { isSupplier } = useUserRole();
  const [rfqs, setRFQs] = useState<DatabaseRFQ[]>([]);
  const [quotes, setQuotes] = useState<DatabaseQuote[]>([]);
  const [orders, setOrders] = useState<DatabaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch RFQs with products. Customers see their own RFQs; suppliers see
  // every RFQ they can act on -- open ones, ones targeted at them, and ones
  // they've already quoted -- matching the "Suppliers can view open or
  // targeted RFQs" RLS policy. This has to mirror that policy's visibility
  // exactly: if it's narrower (e.g. "quoted on" only), a supplier clicking
  // "View Details" on a fresh RFQ they haven't quoted yet finds nothing in
  // this hook's state even though the row is right there in the database.
  const fetchRFQs = async () => {
    if (!user) return;

    try {
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select(`
          *,
          products (*)
        `)
        .order('created_at', { ascending: false });

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
          target_supplier_id: rfqData.targetSupplierId || null,
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

      // If the RFQ was targeted at one supplier (built from their portfolio
      // page), let them know immediately — this is the "new RFQ request
      // received" notification.
      if (rfqData.targetSupplierId) {
        await notifyUser(
          rfqData.targetSupplierId,
          `New RFQ ${rfq.rfq_number} received from ${user.user_metadata?.company || user.email || 'a customer'}.`,
          `/rfq/${rfq.id}`
        );
      }

      toast.success('RFQ submitted successfully!');

      await fetchRFQs();
      return rfq.id;
    } catch (error) {
      console.error('Error submitting RFQ:', error);
      return null;
    }
  };

  // A quote is ready to become a Purchase Order once every product still
  // actively in the deal has been agreed by both sides. Products either
  // side removed ('Rejected') don't block this — the rest of the RFQ can
  // still complete without them. If everything was removed, there's
  // nothing left to buy, so it's not "agreed".
  const isQuoteFullyAgreed = (quote: DatabaseQuote) => {
    const active = (quote.product_quotes || []).filter(pq => pq.status !== 'Rejected');
    return active.length > 0 && active.every(pq => pq.status === 'Accepted');
  };

  // Looks up who to notify and what to say for a single product line, so
  // both negotiation actions can tell the other party what happened.
  const getLineItemContext = async (productQuoteId: string) => {
    const { data, error } = await supabase
      .from('product_quotes')
      .select(`
        quote_id,
        product_id,
        quotes ( rfq_id, supplier_id, quote_number, rfqs ( rfq_number, user_id ) ),
        products ( name )
      `)
      .eq('id', productQuoteId)
      .single();
    if (error || !data) return null;
    const quoteRow: any = data.quotes;
    const rfqRow: any = quoteRow?.rfqs;
    const productRow: any = data.products;
    return {
      quoteId: data.quote_id as string,
      customerId: rfqRow?.user_id as string | undefined,
      supplierId: quoteRow?.supplier_id as string | undefined,
      rfqNumber: rfqRow?.rfq_number as string | undefined,
      productName: productRow?.name as string | undefined,
    };
  };

  // If every active line item on a quote is now Accepted, immediately
  // finalize it into a Purchase Order — no manual confirmation step. This
  // is the moment the PO copy becomes available to both the customer and
  // the supplier.
  const finalizeQuoteIfComplete = async (quoteId: string) => {
    try {
      const { data: quoteRow, error: quoteFetchError } = await supabase
        .from('quotes')
        .select('id, status, rfq_id, supplier_id')
        .eq('id', quoteId)
        .single();
      if (quoteFetchError || !quoteRow || quoteRow.status === 'Accepted') return;

      const { data: items, error: itemsError } = await supabase
        .from('product_quotes')
        .select('status')
        .eq('quote_id', quoteId);
      if (itemsError || !items) return;

      const active = items.filter(i => i.status !== 'Rejected');
      if (active.length === 0 || !active.every(i => i.status === 'Accepted')) return;

      const { error: quoteUpdateError } = await supabase
        .from('quotes')
        .update({ status: 'Accepted' })
        .eq('id', quoteId);
      if (quoteUpdateError) throw quoteUpdateError;

      const { error: orderError } = await supabase
        .from('orders')
        .insert([{
          rfq_id: quoteRow.rfq_id,
          quote_id: quoteId,
          po_number: `PO${Date.now().toString().slice(-6)}`,
          delivery_address: 'Default delivery address',
          delivery_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }] as any);
      if (orderError) throw orderError;

      const { error: rfqUpdateError } = await supabase
        .from('rfqs')
        .update({ status: 'Order_Placed' })
        .eq('id', quoteRow.rfq_id);
      if (rfqUpdateError) throw rfqUpdateError;

      toast.success('All items agreed — Purchase Order created for both sides!');

      // Let both sides know, since only one of them triggered this.
      const { data: rfqRow } = await supabase
        .from('rfqs')
        .select('rfq_number, user_id')
        .eq('id', quoteRow.rfq_id)
        .single();
      if (rfqRow?.user_id) await notifyUser(rfqRow.user_id, `RFQ ${rfqRow.rfq_number} is fully agreed — Purchase Order created!`, `/quote/${quoteId}`);
      if (quoteRow.supplier_id) await notifyUser(quoteRow.supplier_id, `RFQ ${rfqRow?.rfq_number || ''} is fully agreed — Purchase Order created!`, `/quote/${quoteId}`);

      await fetchRFQs();
      await fetchQuotes();
      await fetchOrders();
    } catch (error) {
      console.error('Error finalizing quote:', error);
    }
  };

  // Customer responds to the supplier's current price for one product line:
  // accept it as-is, counter with a different price, or remove it from the
  // negotiation entirely.
  const customerRespondToLineItem = async (
    productQuoteId: string,
    action: 'accept' | 'counter' | 'reject',
    payload?: { price?: number; message?: string }
  ) => {
    try {
      const ctx = await getLineItemContext(productQuoteId);

      if (action === 'accept') {
        const { error } = await supabase
          .from('product_quotes')
          .update({ status: 'Accepted', last_offer_by: 'customer' })
          .eq('id', productQuoteId);
        if (error) throw error;
        toast.success('Price accepted for this product');
        if (ctx?.supplierId) await notifyUser(ctx.supplierId, `Customer accepted your price for "${ctx.productName}" on RFQ ${ctx.rfqNumber}.`, `/quote/${ctx.quoteId}`);
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
        if (ctx?.supplierId) await notifyUser(ctx.supplierId, `Customer countered ₹${payload.price} for "${ctx.productName}" on RFQ ${ctx.rfqNumber}.`, `/quote/${ctx.quoteId}`);
      } else {
        const { error } = await supabase
          .from('product_quotes')
          .update({ status: 'Rejected', last_offer_by: 'customer' })
          .eq('id', productQuoteId);
        if (error) throw error;
        toast.success('Product removed from this RFQ');
        if (ctx?.supplierId) await notifyUser(ctx.supplierId, `Customer removed "${ctx.productName}" from RFQ ${ctx.rfqNumber}.`, `/quote/${ctx.quoteId}`);
      }

      await fetchQuotes();
      if (ctx?.quoteId) await finalizeQuoteIfComplete(ctx.quoteId);
    } catch (error) {
      console.error('Error responding to product quote:', error);
      toast.error('Failed to save your response');
    }
  };

  // Supplier responds to the customer's counter-offer (or an untouched line
  // item): accept the customer's price, counter back with a new one, or
  // remove it from the negotiation entirely.
  const supplierRespondToLineItem = async (
    productQuoteId: string,
    action: 'accept' | 'counter' | 'reject',
    payload?: { price?: number; leadTime?: number; message?: string }
  ) => {
    try {
      const ctx = await getLineItemContext(productQuoteId);
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
        if (ctx?.customerId) await notifyUser(ctx.customerId, `Supplier accepted your price for "${ctx.productName}" on RFQ ${ctx.rfqNumber}.`, `/quote/${ctx.quoteId}`);
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
        if (ctx?.customerId) await notifyUser(ctx.customerId, `Supplier countered ₹${payload.price} for "${ctx.productName}" on RFQ ${ctx.rfqNumber}.`, `/quote/${ctx.quoteId}`);
      } else {
        const { error } = await supabase
          .from('product_quotes')
          .update({ status: 'Rejected', last_offer_by: 'supplier' })
          .eq('id', productQuoteId);
        if (error) throw error;
        toast.success('Product removed from this RFQ');
        if (ctx?.customerId) await notifyUser(ctx.customerId, `Supplier removed "${ctx.productName}" from RFQ ${ctx.rfqNumber}.`, `/quote/${ctx.quoteId}`);
      }

      await fetchQuotes();
      if (ctx?.quoteId) await finalizeQuoteIfComplete(ctx.quoteId);
    } catch (error) {
      console.error('Error responding to product quote:', error);
      toast.error('Failed to save your response');
    }
  };

  // Manual fallback kept for compatibility -- the negotiation UI now calls
  // finalizeQuoteIfComplete automatically after every response instead of
  // requiring an extra confirmation click.
  const acceptQuote = async (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;
    if (!isQuoteFullyAgreed(quote)) {
      toast.error('All products must be agreed on before the PO can be generated');
      return;
    }
    await finalizeQuoteIfComplete(quoteId);
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

      const actor = isSupplier() ? 'supplier' : 'customer';
      const { error } = await supabase
        .from('rfqs')
        .update({ status: 'Cancelled', cancelled_by: actor })
        .eq('id', rfqId);

      if (error) throw error;

      toast.success('RFQ cancelled');

      // Let the other side know, whichever direction this went.
      if (actor === 'customer') {
        const supplierIds = new Set(
          quotes.filter(q => q.rfq_id === rfqId && q.supplier_id).map(q => q.supplier_id as string)
        );
        if (rfq.target_supplier_id) supplierIds.add(rfq.target_supplier_id);
        for (const supplierId of supplierIds) {
          await notifyUser(supplierId, `RFQ ${rfq.rfq_number} was cancelled by the customer.`, `/rfq/${rfqId}`);
        }
      } else {
        await notifyUser(rfq.user_id, `RFQ ${rfq.rfq_number} was cancelled by the supplier.`, `/rfq/${rfqId}`);
      }

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