import { useState, useEffect } from 'react';
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

export const useRFQCart = () => {
  const [products, setProducts] = useState<RFQProduct[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('rfq-cart');
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading RFQ cart:', error);
      }
    }
  }, []);

  // Save to localStorage whenever products change
  useEffect(() => {
    localStorage.setItem('rfq-cart', JSON.stringify(products));
  }, [products]);

  const addIdentifiedProduct = (product: {
    id: string;
    name: string;
    description: string;
    supplier_name?: string;
    category?: string;
  }) => {
    const existingProduct = products.find(p => p.sourceProductId === product.id);
    
    if (existingProduct) {
      setProducts(products.map(p => 
        p.sourceProductId === product.id 
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ));
      toast.success('Product quantity updated in RFQ');
    } else {
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
      setProducts([...products, newProduct]);
      toast.success('Product added to RFQ');
    }
  };

  const addUnidentifiedProduct = (initialData?: Partial<RFQProduct>) => {
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
    setProducts([...products, newProduct]);
    return newProduct.id;
  };

  const addMultipleUnidentifiedProducts = (productsData: Partial<RFQProduct>[]) => {
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
    setProducts([...products, ...newProducts]);
  };

  const updateProduct = (id: string, updates: Partial<RFQProduct>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast.success('Product removed from RFQ');
  };

  const clearCart = () => {
    setProducts([]);
    localStorage.removeItem('rfq-cart');
  };

  const getCartCount = () => {
    return products.reduce((sum, product) => sum + product.quantity, 0);
  };

  return {
    products,
    addIdentifiedProduct,
    addUnidentifiedProduct,
    addMultipleUnidentifiedProducts,
    updateProduct,
    removeProduct,
    clearCart,
    getCartCount,
  };
};