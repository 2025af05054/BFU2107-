import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface RFQProduct {
  id: string;
  type: 'identified' | 'unidentified';
  name: string;
  description: string;
  manufacturer?: string;
  quantity: number;
  targetPrice?: number;
  targetLeadTime?: number;
  images?: string[];
  // For identified products from supplier_products
  sourceProductId?: string;
  supplierName?: string;
  category?: string;
}

interface RFQCartContextValue {
  products: RFQProduct[];
  addIdentifiedProduct: (product: {
    id: string;
    name: string;
    description: string;
    supplier_name?: string;
    category?: string;
  }) => void;
  addUnidentifiedProduct: (initialData?: Partial<RFQProduct>) => string;
  addMultipleUnidentifiedProducts: (productsData: Partial<RFQProduct>[]) => void;
  updateProduct: (id: string, updates: Partial<RFQProduct>) => void;
  removeProduct: (id: string) => void;
  clearCart: () => void;
  getCartCount: () => number;
}

const RFQCartContext = createContext<RFQCartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = 'rfq-cart';

const readCartFromStorage = (): RFQProduct[] => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading RFQ cart:', error);
    return [];
  }
};

export const RFQCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lazy initializer reads localStorage synchronously during the first render,
  // so there's no separate mount effect that can race with the save effect
  // below and clobber a value another tab/page just wrote.
  const [products, setProducts] = useState<RFQProduct[]>(readCartFromStorage);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  const addIdentifiedProduct: RFQCartContextValue['addIdentifiedProduct'] = (product) => {
    setProducts((prev) => {
      const existingProduct = prev.find((p) => p.sourceProductId === product.id);
      if (existingProduct) {
        toast.success('Product quantity updated in RFQ');
        return prev.map((p) =>
          p.sourceProductId === product.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      const newProduct: RFQProduct = {
        id: `rfq-${Date.now()}`,
        type: 'identified',
        name: product.name,
        description: product.description || '',
        quantity: 1,
        sourceProductId: product.id,
        supplierName: product.supplier_name,
        category: product.category,
      };
      toast.success('Product added to RFQ');
      return [...prev, newProduct];
    });
  };

  const addUnidentifiedProduct: RFQCartContextValue['addUnidentifiedProduct'] = (initialData) => {
    const newProduct: RFQProduct = {
      id: `rfq-unidentified-${Date.now()}-${Math.random()}`,
      type: 'unidentified',
      name: '',
      description: '',
      manufacturer: '',
      quantity: 1,
      targetPrice: 0,
      targetLeadTime: 14,
      images: [],
      ...initialData,
    };
    setProducts((prev) => [...prev, newProduct]);
    return newProduct.id;
  };

  const addMultipleUnidentifiedProducts: RFQCartContextValue['addMultipleUnidentifiedProducts'] = (
    productsData
  ) => {
    const newProducts: RFQProduct[] = productsData.map((data, index) => ({
      id: `rfq-unidentified-${Date.now()}-${index}`,
      type: 'unidentified' as const,
      name: '',
      description: '',
      manufacturer: '',
      quantity: 1,
      targetPrice: 0,
      targetLeadTime: 14,
      images: [],
      ...data,
    }));
    setProducts((prev) => [...prev, ...newProducts]);
  };

  const updateProduct: RFQCartContextValue['updateProduct'] = (id, updates) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const removeProduct: RFQCartContextValue['removeProduct'] = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success('Product removed from RFQ');
  };

  const clearCart = () => {
    setProducts([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const getCartCount = () => products.reduce((sum, product) => sum + product.quantity, 0);

  return (
    <RFQCartContext.Provider
      value={{
        products,
        addIdentifiedProduct,
        addUnidentifiedProduct,
        addMultipleUnidentifiedProducts,
        updateProduct,
        removeProduct,
        clearCart,
        getCartCount,
      }}
    >
      {children}
    </RFQCartContext.Provider>
  );
};

export const useRFQCart = () => {
  const context = useContext(RFQCartContext);
  if (!context) {
    throw new Error('useRFQCart must be used within an RFQCartProvider');
  }
  return context;
};
