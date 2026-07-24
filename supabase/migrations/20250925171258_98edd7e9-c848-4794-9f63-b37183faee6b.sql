-- Add approval status to supplier_products table
ALTER TABLE public.supplier_products 
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- Add index for better performance on status queries
CREATE INDEX idx_supplier_products_status ON public.supplier_products(status);

-- Add check constraint for valid status values
ALTER TABLE public.supplier_products 
ADD CONSTRAINT check_status_valid 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing supplier products to be approved (for backwards compatibility)
UPDATE public.supplier_products SET status = 'approved' WHERE status = 'pending';