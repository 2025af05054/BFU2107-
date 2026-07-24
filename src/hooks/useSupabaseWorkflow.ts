import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DatabaseRFQ {
  id: string;
  rfq_number: string;
  user_id: string;
  status: 'Created' | 'Order_Placed' | 'PO_Raised' | 'Completed' | 'Cancelled';
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

export interface DatabaseProductQuote {
  id: string;
  quote_id: string;
  product_id: string;
  unit_price: number;
  lead_time: number;
  terms?: string;
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
  const [rfqs, setRFQs] = useState<DatabaseRFQ[]>([]);
  const [quotes, setQuotes] = useState<DatabaseQuote[]>([]);
  const [orders, setOrders] = useState<DatabaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch RFQs with products
  const fetchRFQs = async () => {
    if (!user) return;

    try {
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (rfqError) throw rfqError;
      setRFQs((rfqData || []) as DatabaseRFQ[]);
    } catch (error) {
      console.error('Error fetching RFQs:', error);
      toast.error('Failed to load RFQs');
    }
  };

  // Fetch quotes with product quotes
  const fetchQuotes = async () => {
    if (!user) return;

    try {
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          product_quotes (*),
          rfqs!inner (user_id)
        `)
        .eq('rfqs.user_id', user.id)
        .order('created_at', { ascending: false });

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
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          rfqs!inner (user_id)
        `)
        .eq('rfqs.user_id', user.id)
        .order('created_at', { ascending: false });

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
      
      // Simulate quote generation after 3 seconds
      setTimeout(() => {
        generateQuote(rfq.id);
      }, 3000);

      await fetchRFQs();
      return rfq.id;
    } catch (error) {
      console.error('Error submitting RFQ:', error);
      return null;
    }
  };

  // Generate quote (simulation)
  const generateQuote = async (rfqId: string) => {
    try {
      // Get RFQ with products
      const { data: rfq, error: rfqError } = await supabase
        .from('rfqs')
        .select(`
          *,
          products (*)
        `)
        .eq('id', rfqId)
        .single();

      if (rfqError) throw rfqError;

      const suppliers = [
        { name: 'TechComponents Ltd', id: '1' },
        { name: 'Industrial Parts Co', id: '2' },
        { name: 'Global Trading Corp', id: '3' },
      ];

      const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];

      // Create quote (auto-generates quote_number via trigger)
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert([{
          rfq_id: rfqId,
          supplier_id: randomSupplier.id,
          supplier_name: randomSupplier.name,
          total_amount: Math.round((rfq.products?.reduce((sum: number, p: any) => 
            sum + (p.target_price || 1000) * p.quantity, 0) || 10000) * 1.15),
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }] as any)
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create product quotes
      if (rfq.products) {
        const productQuotesToInsert = rfq.products.map((product: any) => ({
          quote_id: quote.id,
          product_id: product.id,
          unit_price: Math.round((product.target_price || 1000) * (0.8 + Math.random() * 0.4)),
          lead_time: Math.round((product.target_lead_time || 14) * (0.8 + Math.random() * 0.4)),
          terms: '30 days payment terms, FOB Origin',
        }));

        const { error: productQuotesError } = await supabase
          .from('product_quotes')
          .insert(productQuotesToInsert);

        if (productQuotesError) throw productQuotesError;
      }

      // Update RFQ status
      await supabase
        .from('rfqs')
        .update({ status: 'Quoted' })
        .eq('id', rfqId);

      toast.success('New quote received!');
      await fetchRFQs();
      await fetchQuotes();
    } catch (error) {
      console.error('Error generating quote:', error);
    }
  };

  // Accept quote
  const acceptQuote = async (quoteId: string) => {
    try {
      const quote = quotes.find(q => q.id === quoteId);
      if (!quote) return;

      // Update quote status
      await supabase
        .from('quotes')
        .update({ status: 'Accepted' })
        .eq('id', quoteId);

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
      await supabase
        .from('rfqs')
        .update({ status: 'Closed' })
        .eq('id', quote.rfq_id);

      toast.success('Quote accepted and order created!');
      await fetchRFQs();
      await fetchQuotes();
      await fetchOrders();
    } catch (error) {
      console.error('Error accepting quote:', error);
      toast.error('Failed to accept quote');
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: DatabaseOrder['status']) => {
    try {
      await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

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
      await supabase
        .from('orders')
        .update({ payment_status: paymentStatus })
        .eq('id', orderId);

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
  }, [user]);

  return {
    rfqs,
    quotes,
    orders,
    loading,
    submitRFQ,
    acceptQuote,
    updateOrderStatus,
    updatePaymentStatus,
    refresh: () => {
      fetchRFQs();
      fetchQuotes();
      fetchOrders();
    }
  };
};