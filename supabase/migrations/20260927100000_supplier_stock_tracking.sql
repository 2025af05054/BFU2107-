-- Supplier-side inventory awareness while quoting, matching standard
-- Available-to-Promise (ATP) logic: on-hand stock minus what's already
-- committed to other customers' purchase orders minus a safety buffer.
--
-- stock_available: total on-hand quantity the supplier declares for this
-- catalog item. NULL means "not tracked" (existing products default to
-- this so nothing breaks retroactively).
-- safety_stock: a reserve the supplier never wants promised away, even if
-- physically on hand (buffer against demand variability / damage / etc).
ALTER TABLE public.supplier_products
  ADD COLUMN stock_available INTEGER,
  ADD COLUMN safety_stock INTEGER NOT NULL DEFAULT 0;

-- RFQ line items need to remember which catalog item they came from so the
-- supplier's committed-quantity math can actually find them. Only set for
-- "identified" products added from a supplier's catalog/portfolio --
-- freeform "unidentified" RFQ items have nothing to link to and stay NULL.
ALTER TABLE public.products
  ADD COLUMN source_product_id UUID REFERENCES public.supplier_products(id) ON DELETE SET NULL;
