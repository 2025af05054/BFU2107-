-- HOTFIX: the two new supplier policies on rfqs (added in
-- rfq_targeting_removal_and_cancel) check `EXISTS (SELECT 1 FROM quotes
-- WHERE quotes.rfq_id = rfqs.id ...)`. But quotes' own RLS policies check
-- `EXISTS (SELECT 1 FROM rfqs WHERE rfqs.id = quotes.rfq_id ...)`. Evaluating
-- either table's policies now requires evaluating the other's, forever --
-- Postgres correctly detects this as infinite recursion and rejects EVERY
-- query against rfqs, including plain customer inserts, which is a total
-- outage for RFQ submission in production.
--
-- Fix: check quotes through a SECURITY DEFINER function instead of an
-- inline EXISTS. SECURITY DEFINER functions run as their owner and bypass
-- RLS on the tables they touch (same trick already used by has_role()), so
-- this lookup never re-triggers quotes' policies and the cycle is broken.
CREATE OR REPLACE FUNCTION public.supplier_has_quote_on_rfq(_rfq_id uuid, _supplier_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.rfq_id = _rfq_id AND quotes.supplier_id = _supplier_id
  )
$$;

DROP POLICY IF EXISTS "Suppliers can view open or targeted RFQs" ON public.rfqs;
CREATE POLICY "Suppliers can view open or targeted RFQs"
ON public.rfqs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'supplier') AND (
    target_supplier_id IS NULL
    OR target_supplier_id = auth.uid()
    OR public.supplier_has_quote_on_rfq(rfqs.id, auth.uid())
  )
);

DROP POLICY IF EXISTS "Suppliers can update RFQs they're party to" ON public.rfqs;
CREATE POLICY "Suppliers can update RFQs they're party to"
ON public.rfqs
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'supplier') AND (
    target_supplier_id = auth.uid()
    OR public.supplier_has_quote_on_rfq(rfqs.id, auth.uid())
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'supplier') AND (
    target_supplier_id = auth.uid()
    OR public.supplier_has_quote_on_rfq(rfqs.id, auth.uid())
  )
);

-- Same fix for the older cancel policy from rfq_cancel_and_line_removal,
-- which has the identical inline EXISTS(...quotes...) shape.
DROP POLICY IF EXISTS "Suppliers can cancel RFQs they quoted on" ON public.rfqs;
CREATE POLICY "Suppliers can cancel RFQs they quoted on"
ON public.rfqs
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'supplier') AND
  public.supplier_has_quote_on_rfq(rfqs.id, auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'supplier') AND
  public.supplier_has_quote_on_rfq(rfqs.id, auth.uid())
);
