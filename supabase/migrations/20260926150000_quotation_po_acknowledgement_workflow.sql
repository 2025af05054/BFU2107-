-- Proper procurement handoff, matching how real B2B platforms (Alibaba,
-- IndiaMART, TradeIndia) separate these steps instead of collapsing them
-- into one auto-generated PO:
--
--   RFQ -> per-product negotiation -> supplier finalizes a formal
--   Quotation -> customer submits a Purchase Order against it -> supplier
--   acknowledges the PO -> normal order fulfillment tracking.
--
-- 'Finalized' is a new quotes.status: once every product line is Accepted,
-- the supplier explicitly submits the quotation (no more auto-PO). The
-- customer can then submit the PO (quotes.status -> 'Accepted', creates the
-- order) or reject the quotation, which reopens negotiation.
ALTER TABLE public.quotes DROP CONSTRAINT quotes_status_check;
ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('Pending', 'Finalized', 'Accepted', 'Rejected'));

-- Orders now start life as 'PO Submitted' (the customer has raised the PO
-- but the supplier hasn't confirmed it yet) rather than defaulting straight
-- to 'PO Accepted'. The supplier's explicit "Acknowledge PO" action is what
-- moves it to 'PO Accepted', recorded with a timestamp.
ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('PO Submitted', 'PO Accepted', 'Order in Progress', 'Out for Delivery', 'Delivered'));
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'PO Submitted';
ALTER TABLE public.orders ADD COLUMN acknowledged_at TIMESTAMP WITH TIME ZONE;
