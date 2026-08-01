-- Allow suppliers to update the status/payment_status of orders tied to their own quotes.
-- Previously suppliers could only SELECT orders, so the "Update Status" action in the
-- supplier dashboard had no working policy to perform the write against.
CREATE POLICY "Suppliers can update orders for their quotes"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'supplier') AND
  EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = orders.quote_id AND q.supplier_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'supplier') AND
  EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = orders.quote_id AND q.supplier_id = auth.uid()
  )
);
