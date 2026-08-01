-- Customers previously had no way to update quote status (accept/reject) or
-- create the resulting order — both silently failed under RLS with no error
-- surfaced to the UI, since the client never checked query.error to abort.
CREATE POLICY "Customers can update status of quotes for their RFQs"
ON public.quotes
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'customer'::app_role) AND
  EXISTS (SELECT 1 FROM public.rfqs WHERE rfqs.id = quotes.rfq_id AND rfqs.user_id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'customer'::app_role) AND
  EXISTS (SELECT 1 FROM public.rfqs WHERE rfqs.id = quotes.rfq_id AND rfqs.user_id = auth.uid())
);

CREATE POLICY "Customers can create orders for their accepted quotes"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'customer'::app_role) AND
  EXISTS (SELECT 1 FROM public.rfqs WHERE rfqs.id = orders.rfq_id AND rfqs.user_id = auth.uid())
);
