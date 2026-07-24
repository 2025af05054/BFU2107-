import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface Supplier {
  id: string;
  company_name: string;
  contact_info: any;
  created_at: string;
  contact_person: string;
}

interface SuppliersResponse {
  suppliers: Supplier[];
  total: number;
}

// Use the Supabase URL from environment
const SUPABASE_URL = "https://fbgioxhbuullokzmqwqn.supabase.co";

export const useSuppliers = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  return useQuery<SuppliersResponse>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      if (!user || !isAdmin()) {
        throw new Error('Admin access required');
      }

      // Get auth token for API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/suppliers`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch suppliers');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!user && isAdmin(), // Only run if user is authenticated and admin
  });
};

// Direct Supabase client hook (public access for basic supplier info)
export const useSuppliersDirect = () => {
  return useQuery<Supplier[]>({
    queryKey: ['suppliers-direct'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select(`
          id,
          company_name,
          contact_info,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(supplier => ({
        id: supplier.id,
        company_name: supplier.company_name,
        contact_info: supplier.contact_info,
        created_at: supplier.created_at,
        contact_person: 'N/A' // Will be enhanced with mock data in component
      })) || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};