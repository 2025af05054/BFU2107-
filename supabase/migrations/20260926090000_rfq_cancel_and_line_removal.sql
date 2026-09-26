-- Let either side end the deal at any point in the negotiation:
--
-- 1. Cancel the whole RFQ. Previously only the customer (its owner) could
--    update an RFQ row, so a supplier had no way to cancel one they'd
--    quoted on. Negotiations can go sideways from either direction, so both
--    the customer and any supplier who has quoted on the RFQ can cancel it.
-- 2. Remove a single product from the negotiation without waiting for your
--    turn. This reuses the existing product_quotes 'Rejected' status and the
--    existing UPDATE policies from the line-item negotiation migration -- no
--    schema change needed there, just app-level relaxation of when the
--    action is available.

CREATE POLICY "Suppliers can cancel RFQs they quoted on"
ON public.rfqs
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'supplier') AND
  EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.rfq_id = rfqs.id AND q.supplier_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'supplier') AND
  EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.rfq_id = rfqs.id AND q.supplier_id = auth.uid()
  )
);

-- Track who cancelled, for display in the UI.
ALTER TABLE public.rfqs
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT CHECK (cancelled_by IN ('customer', 'supplier'));
