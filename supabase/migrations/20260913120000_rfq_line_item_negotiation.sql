-- Per-product price negotiation between customer and supplier.
--
-- Previously a quote could only be accepted/rejected as a whole, with one
-- fixed price per line. Real sourcing conversations happen product-by-product
-- (e.g. customer asks 42 instead of 45, supplier holds at 44, customer
-- accepts) so each product_quotes row now tracks its own negotiation state,
-- and every offer is logged to product_quote_offers for a visible history.
-- A quote can only be finalized into an order once every line item reaches
-- 'Accepted'.

ALTER TABLE public.product_quotes
  ADD COLUMN status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Countered', 'Accepted', 'Rejected')),
  ADD COLUMN last_offer_by TEXT NOT NULL DEFAULT 'supplier'
    CHECK (last_offer_by IN ('supplier', 'customer')),
  ADD COLUMN customer_offer_price DECIMAL(10,2);

CREATE TABLE public.product_quote_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_quote_id UUID REFERENCES public.product_quotes(id) ON DELETE CASCADE NOT NULL,
  actor TEXT NOT NULL CHECK (actor IN ('customer', 'supplier')),
  unit_price DECIMAL(10,2) NOT NULL,
  lead_time INTEGER,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.product_quote_offers ENABLE ROW LEVEL SECURITY;

-- Customers can update the status/offer price of line items on quotes for
-- their own RFQs (accept a supplier price, counter it, or reject it).
CREATE POLICY "Customers can respond to product quotes for their RFQs"
ON public.product_quotes
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'customer') AND
  EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.rfqs r ON r.id = q.rfq_id
    WHERE q.id = product_quotes.quote_id AND r.user_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'customer') AND
  EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.rfqs r ON r.id = q.rfq_id
    WHERE q.id = product_quotes.quote_id AND r.user_id = auth.uid()
  )
);

-- Suppliers can update line items on their own quotes (accept a customer's
-- counter-offer, counter back, or reject).
CREATE POLICY "Suppliers can respond to their own product quotes"
ON public.product_quotes
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'supplier') AND
  EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = product_quotes.quote_id AND q.supplier_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'supplier') AND
  EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = product_quotes.quote_id AND q.supplier_id = auth.uid()
  )
);

-- Negotiation history: each side can log their own offers, and can read the
-- full back-and-forth for line items they're party to.
CREATE POLICY "Customers can log their offers"
ON public.product_quote_offers
FOR INSERT
TO authenticated
WITH CHECK (
  actor = 'customer' AND
  public.has_role(auth.uid(), 'customer') AND
  EXISTS (
    SELECT 1 FROM public.product_quotes pq
    JOIN public.quotes q ON q.id = pq.quote_id
    JOIN public.rfqs r ON r.id = q.rfq_id
    WHERE pq.id = product_quote_offers.product_quote_id AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Suppliers can log their offers"
ON public.product_quote_offers
FOR INSERT
TO authenticated
WITH CHECK (
  actor = 'supplier' AND
  public.has_role(auth.uid(), 'supplier') AND
  EXISTS (
    SELECT 1 FROM public.product_quotes pq
    JOIN public.quotes q ON q.id = pq.quote_id
    WHERE pq.id = product_quote_offers.product_quote_id AND q.supplier_id = auth.uid()
  )
);

CREATE POLICY "Customers can view offer history for their RFQs"
ON public.product_quote_offers
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'customer') AND
  EXISTS (
    SELECT 1 FROM public.product_quotes pq
    JOIN public.quotes q ON q.id = pq.quote_id
    JOIN public.rfqs r ON r.id = q.rfq_id
    WHERE pq.id = product_quote_offers.product_quote_id AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Suppliers can view offer history for their quotes"
ON public.product_quote_offers
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'supplier') AND
  EXISTS (
    SELECT 1 FROM public.product_quotes pq
    JOIN public.quotes q ON q.id = pq.quote_id
    WHERE pq.id = product_quote_offers.product_quote_id AND q.supplier_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all offer history"
ON public.product_quote_offers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
