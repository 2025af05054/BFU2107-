-- Per-supplier choice between two settlement modes:
--
-- 1. Negotiation ON (default, existing behavior, unchanged): RFQ -> per-line
--    negotiation -> supplier submits final quotation -> customer submits PO
--    -> supplier acknowledges.
--
-- 2. Negotiation OFF: the supplier has committed to their catalog Fixed
--    Price and doesn't want to haggle. When a customer submits an RFQ built
--    entirely from that supplier's priced catalog items, the app skips
--    straight to an auto-confirmed Purchase Order (no Pending/Finalized
--    stages) -- see submitRFQ in useSupabaseWorkflow.ts.
--
-- payment_qr_url is the supplier's own UPI/bank QR code image, shown to the
-- customer once a PO exists so they can pay externally (this platform has
-- no payment gateway -- it's a manual pay-and-confirm flow, matching how
-- the existing payment_status column already works).
ALTER TABLE public.suppliers
  ADD COLUMN negotiation_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN payment_qr_url TEXT;
