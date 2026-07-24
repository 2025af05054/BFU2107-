import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ProductRequirement {
  id: string;
  type: 'identified' | 'unidentified';
  name: string;
  description: string;
  manufacturer?: string;
  quantity: number;
  targetPrice: number;
  targetLeadTime: number;
  images?: string[];
}

export interface RFQ {
  id: string;
  userId: string;
  products: ProductRequirement[];
  status: 'Created' | 'Order_Placed' | 'PO_Raised' | 'Completed' | 'Cancelled';
  createdDate: string;
  userInfo: {
    name: string;
    company: string;
    mobile: string;
    address: string;
    gst: string;
  };
}

export interface Quote {
  id: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  productQuotes: Array<{
    productId: string;
    unitPrice: number;
    leadTime: number;
    terms: string;
  }>;
  totalAmount: number;
  validUntil: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdDate: string;
}

export interface Order {
  id: string;
  rfqId: string;
  quoteId: string;
  poNumber: string;
  status: 'PO Accepted' | 'Order in Progress' | 'Out for Delivery' | 'Delivered';
  paymentStatus: 'Not Indicated' | 'Partial' | 'Done';
  deliveryDate: string;
  deliveryAddress: string;
  createdDate: string;
}

interface WorkflowContextType {
  rfqs: RFQ[];
  quotes: Quote[];
  orders: Order[];
  submitRFQ: (rfq: Omit<RFQ, 'id' | 'createdDate' | 'status'>) => string;
  generateQuote: (rfqId: string) => void;
  acceptQuote: (quoteId: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updatePaymentStatus: (orderId: string, paymentStatus: Order['paymentStatus']) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

// Dummy suppliers data
const DUMMY_SUPPLIERS = [
  { id: 'SUP001', name: 'TechComponents Ltd', category: 'Electronics' },
  { id: 'SUP002', name: 'Industrial Parts Co', category: 'Industrial' },
  { id: 'SUP003', name: 'Global Trading Corp', category: 'General' },
];

export const WorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rfqs, setRFQs] = useState<RFQ[]>([
    // Dummy RFQ data
    {
      id: 'RFQ001',
      userId: 'USER001',
      status: 'Completed',
      createdDate: '2024-01-15',
      userInfo: {
        name: 'John Doe',
        company: 'Tech Solutions Pvt Ltd',
        mobile: '+91 98765 43210',
        address: '123 Business District, Mumbai 400001',
        gst: '27ABCDE1234F1Z5'
      },
      products: [
        {
          id: 'PRD001',
          type: 'identified',
          name: 'Industrial Sensor',
          description: 'High precision temperature sensor for industrial applications',
          quantity: 50,
          targetPrice: 1500,
          targetLeadTime: 15
        }
      ]
    }
  ]);

  const [quotes, setQuotes] = useState<Quote[]>([
    // Dummy quote data
    {
      id: 'QUO001',
      rfqId: 'RFQ001',
      supplierId: 'SUP001',
      supplierName: 'TechComponents Ltd',
      productQuotes: [
        {
          productId: 'PRD001',
          unitPrice: 1350,
          leadTime: 12,
          terms: '30 days payment terms, FOB Mumbai'
        }
      ],
      totalAmount: 67500,
      validUntil: '2024-02-15',
      status: 'Pending',
      createdDate: '2024-01-18'
    }
  ]);

  const [orders, setOrders] = useState<Order[]>([]);

  const submitRFQ = (rfqData: Omit<RFQ, 'id' | 'createdDate' | 'status'>) => {
    const newRFQ: RFQ = {
      ...rfqData,
      id: `RFQ${String(rfqs.length + 1).padStart(3, '0')}`,
      status: 'Created',
      createdDate: new Date().toISOString().split('T')[0]
    };

    setRFQs(prev => [...prev, newRFQ]);
    
    // Simulate auto-quote generation after 2 seconds
    setTimeout(() => {
      generateQuote(newRFQ.id);
    }, 2000);

    return newRFQ.id;
  };

  const generateQuote = (rfqId: string) => {
    const rfq = rfqs.find(r => r.id === rfqId);
    if (!rfq) return;

    const supplier = DUMMY_SUPPLIERS[Math.floor(Math.random() * DUMMY_SUPPLIERS.length)];
    
    const productQuotes = rfq.products.map(product => ({
      productId: product.id,
      unitPrice: Math.round(product.targetPrice * (0.8 + Math.random() * 0.4)), // ±20% variance
      leadTime: Math.round(product.targetLeadTime * (0.8 + Math.random() * 0.4)),
      terms: '30 days payment terms, FOB Origin'
    }));

    const totalAmount = productQuotes.reduce((sum, pq) => {
      const product = rfq.products.find(p => p.id === pq.productId);
      return sum + (pq.unitPrice * (product?.quantity || 1));
    }, 0);

    const newQuote: Quote = {
      id: `QUO${String(quotes.length + 1).padStart(3, '0')}`,
      rfqId,
      supplierId: supplier.id,
      supplierName: supplier.name,
      productQuotes,
      totalAmount: Math.round(totalAmount * 1.15), // Add 15% margin
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      createdDate: new Date().toISOString().split('T')[0]
    };

    setQuotes(prev => [...prev, newQuote]);
    setRFQs(prev => prev.map(rfq => 
      rfq.id === rfqId ? { ...rfq, status: 'Order_Placed' as const } : rfq
    ));
  };

  const acceptQuote = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;

    setQuotes(prev => prev.map(q => 
      q.id === quoteId ? { ...q, status: 'Accepted' as const } : q
    ));

    // Create order
    const newOrder: Order = {
      id: `ORD${String(orders.length + 1).padStart(3, '0')}`,
      rfqId: quote.rfqId,
      quoteId,
      poNumber: `PO${String(orders.length + 1).padStart(4, '0')}`,
      status: 'PO Accepted',
      paymentStatus: 'Not Indicated',
      deliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryAddress: '123 Business District, Mumbai 400001',
      createdDate: new Date().toISOString().split('T')[0]
    };

    setOrders(prev => [...prev, newOrder]);
    setRFQs(prev => prev.map(rfq => 
      rfq.id === quote.rfqId ? { ...rfq, status: 'Completed' as const } : rfq
    ));
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
  };

  const updatePaymentStatus = (orderId: string, paymentStatus: Order['paymentStatus']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, paymentStatus } : order
    ));
  };

  return (
    <WorkflowContext.Provider value={{
      rfqs,
      quotes,
      orders,
      submitRFQ,
      generateQuote,
      acceptQuote,
      updateOrderStatus,
      updatePaymentStatus
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};