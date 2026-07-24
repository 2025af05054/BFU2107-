-- Add SKU (product code) field to supplier_products table
ALTER TABLE public.supplier_products 
ADD COLUMN sku TEXT UNIQUE;

-- Add index for faster SKU lookups
CREATE INDEX idx_supplier_products_sku ON public.supplier_products(sku);

-- Add comment to document the field
COMMENT ON COLUMN public.supplier_products.sku IS 'Unique product code/SKU for identification';