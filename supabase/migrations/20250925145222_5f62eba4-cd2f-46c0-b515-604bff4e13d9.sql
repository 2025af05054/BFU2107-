-- Update RFQ status enum to match new workflow requirements
-- Remove Published and Quote_Received, add PO_Raised

-- First, check if we need to update any existing RFQs with old statuses
UPDATE public.rfqs 
SET status = 'Created' 
WHERE status IN ('Published', 'Quote_Received');

-- We don't need to alter the column since it's using text type, not enum
-- The new valid statuses will be: Created, Completed, Cancelled, Order_Placed, PO_Raised