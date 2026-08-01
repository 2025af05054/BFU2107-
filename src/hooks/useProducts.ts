import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SupplierProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  price_min: number;
  price_max: number;
  category: string;
  images: string[];
  supplier_name?: string;
  supplier_id: string;
  created_at: string;
  supplier: {
    company_name: string;
    contact_info: any;
  };
}

interface ProductsResponse {
  products: SupplierProduct[];
  total: number;
}

// Use the Supabase URL from environment
const SUPABASE_URL = "https://fbgioxhbuullokzmqwqn.supabase.co";

export const useProducts = () => {
  return useQuery<ProductsResponse>({
    queryKey: ['products'],
    queryFn: async () => {
      // Use the public products API endpoint
      const response = await fetch(`${SUPABASE_URL}/functions/v1/products`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (updated from cacheTime)
  });
};

// Alternative hook using direct Supabase client (for authenticated requests)
export const useProductsDirect = () => {
  return useQuery<SupplierProduct[]>({
    queryKey: ['products-direct'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_products')
        .select(`
          id,
          name,
          description,
          price,
          price_min,
          price_max,
          category,
          images,
          supplier_name,
          supplier_id,
          created_at,
          suppliers(
            company_name,
            contact_info
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.price || 0,
        price_min: product.price_min || 0,
        price_max: product.price_max || 0,
        category: product.category || 'Uncategorized',
        images: product.images || [],
        supplier_id: product.supplier_id,
        created_at: product.created_at,
        supplier: {
          company_name: product.suppliers?.company_name || product.supplier_name || 'Unknown Supplier',
          contact_info: product.suppliers?.contact_info || {}
        }
      })) || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};