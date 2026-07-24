-- Add supplier_name column to supplier_products table to allow manual supplier names
ALTER TABLE supplier_products 
ADD COLUMN supplier_name text;

-- Update existing records to use the company name from suppliers table
UPDATE supplier_products 
SET supplier_name = suppliers.company_name
FROM suppliers 
WHERE supplier_products.supplier_id = suppliers.id;

-- Make supplier_id nullable since we now allow manual supplier names
ALTER TABLE supplier_products 
ALTER COLUMN supplier_id DROP NOT NULL;