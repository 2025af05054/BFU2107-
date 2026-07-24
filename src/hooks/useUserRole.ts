import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'supplier' | 'customer';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('role', { ascending: true }) // admin first, then supplier, then customer
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user role:', error);
          setRole('customer'); // Default fallback
        } else {
          setRole(data?.role || 'customer');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('customer'); // Default fallback
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!role) return false;
    
    const roleHierarchy = { admin: 3, supplier: 2, customer: 1 };
    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  const isAdmin = () => role === 'admin';
  const isSupplier = () => role === 'supplier';
  const isCustomer = () => role === 'customer';

  return {
    role,
    loading,
    hasRole,
    isAdmin,
    isSupplier,
    isCustomer
  };
};