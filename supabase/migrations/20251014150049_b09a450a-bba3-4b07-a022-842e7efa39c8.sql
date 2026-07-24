-- Create categories table with hierarchical structure
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  icon_url text,
  display_order integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(name, parent_id)
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view active categories"
  ON public.categories
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all categories"
  ON public.categories
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for category icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-icons', 'category-icons', true);

-- Storage policies for category icons
CREATE POLICY "Anyone can view category icons"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'category-icons');

CREATE POLICY "Admins can upload category icons"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'category-icons' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update category icons"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'category-icons' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete category icons"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'category-icons' AND has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing categories from the hardcoded list
INSERT INTO public.categories (name, level, display_order, is_active) VALUES
  ('Electronics & Electrical', 1, 1, true),
  ('Machinery & Equipment', 1, 2, true),
  ('Construction & Building Materials', 1, 3, true),
  ('Chemicals & Materials', 1, 4, true),
  ('Packaging & Printing', 1, 5, true),
  ('Textiles & Apparel', 1, 6, true),
  ('Food & Beverage', 1, 7, true),
  ('Agriculture & Farming', 1, 8, true),
  ('Automotive & Transportation', 1, 9, true),
  ('Office & School Supplies', 1, 10, true),
  ('Home & Garden', 1, 11, true),
  ('Health & Medical', 1, 12, true),
  ('Sports & Entertainment', 1, 13, true),
  ('Tools & Hardware', 1, 14, true),
  ('Toys & Hobbies', 1, 15, true);

-- Update supplier_products table to use category_id instead of text
ALTER TABLE public.supplier_products 
  ADD COLUMN category_id uuid REFERENCES public.categories(id);

-- Create index for faster lookups
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_level ON public.categories(level);
CREATE INDEX idx_supplier_products_category_id ON public.supplier_products(category_id);