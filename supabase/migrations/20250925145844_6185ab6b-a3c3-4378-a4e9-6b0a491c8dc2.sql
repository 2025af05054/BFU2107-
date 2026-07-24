-- Remove the old check constraint and add a new one with updated status values
ALTER TABLE public.rfqs DROP CONSTRAINT IF EXISTS rfqs_status_check;

-- Add new check constraint with the updated status values
ALTER TABLE public.rfqs ADD CONSTRAINT rfqs_status_check 
CHECK (status IN ('Created', 'Order_Placed', 'PO_Raised', 'Completed', 'Cancelled'));