import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  icon_url: string | null;
  display_order: number;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export const useCategories = () => {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useAllCategories = () => {
  return useQuery<Category[]>({
    queryKey: ['all-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('level', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCategoryTree = () => {
  const { data: categories, ...rest } = useAllCategories();
  
  const buildTree = (cats: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // First pass: create map of all categories
    cats.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Second pass: build tree structure
    cats.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  };

  return {
    ...rest,
    data: categories ? buildTree(categories) : [],
  };
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Partial<Category> & { name: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-categories'] });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });
};

export const useUploadCategoryIcon = () => {
  return useMutation({
    mutationFn: async ({ categoryId, file }: { categoryId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${categoryId}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('category-icons')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('category-icons')
        .getPublicUrl(filePath);

      return publicUrl;
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload icon: ${error.message}`);
    },
  });
};
