-- Targeted RFQs, per-line "remove from negotiation", and any-time RFQ
-- cancellation.
--
-- Scenario this supports: a customer opens one specific supplier's public
-- portfolio, builds an RFQ from it, and that RFQ should be private to that
-- supplier only (not broadcast to every supplier on the platform). Either
-- side can also pull a single stuck product out of the negotiation without
-- blocking the rest of the RFQ, and either side can cancel the whole RFQ at
-- any point before a PO is raised.

-- 1. Targeted RFQs -----------------------------------------------------
ALTER TABLE public.rfqs
  ADD COLUMN target_supplier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Suppliers could previously see every RFQ on the platform. Now they can
-- only see RFQs that are either untargeted (open/broadcast, for backward
-- compatibility with the general product catalog flow) or targeted at them,
-- plus any RFQ they've already quoted on.
DROP POLICY IF EXISTS "Suppliers can view all RFQs to respond" ON public.rfqs;

CREATE POLICY "Suppliers can view open or targeted RFQs"
ON public.rfqs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'supplier') AND (
    target_supplier_id IS NULL
    OR target_supplier_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.quotes WHERE quotes.rfq_id = rfqs.id AND quotes.supplier_id = auth.uid())
  )
);

-- A supplier can only submit a quote on an RFQ that's open to them.
DROP POLICY IF EXISTS "Suppliers can create quotes" ON public.quotes;

CREATE POLICY "Suppliers can create quotes on open or targeted RFQs"
ON public.quotes
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'supplier') AND
  EXISTS (
    SELECT 1 FROM public.rfqs
    WHERE rfqs.id = quotes.rfq_id
    AND (rfqs.target_supplier_id IS NULL OR rfqs.target_supplier_id = auth.uid())
  )
);

-- 2. Cancel an RFQ at any time -----------------------------------------
-- Customers can already UPDATE their own RFQs. Suppliers need the same
-- ability, scoped to RFQs they're actually party to (targeted at them or
-- already quoted), so either side can cancel.
CREATE POLICY "Suppliers can update RFQs they're party to"
ON public.rfqs
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'supplier') AND (
    target_supplier_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.quotes WHERE quotes.rfq_id = rfqs.id AND quotes.supplier_id = auth.uid())
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'supplier') AND (
    target_supplier_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.quotes WHERE quotes.rfq_id = rfqs.id AND quotes.supplier_id = auth.uid())
  )
);

-- 3. Remove a product from the negotiation ------------------------------
-- A distinct terminal state from 'Rejected' (which meant "I don't accept
-- this price"): 'Removed' means the product is pulled out of the deal
-- entirely, by either side, regardless of whose turn it is. The rest of
-- the RFQ's products can still reach 'Accepted' and finalize into a PO.
ALTER TABLE public.product_quotes DROP CONSTRAINT product_quotes_status_check;
ALTER TABLE public.product_quotes
  ADD CONSTRAINT product_quotes_status_check
  CHECK (status IN ('Pending', 'Countered', 'Accepted', 'Rejected', 'Removed'));
