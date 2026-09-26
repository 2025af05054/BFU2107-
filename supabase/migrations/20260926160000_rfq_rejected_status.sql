-- A rejected final quotation previously closed the RFQ as 'Cancelled',
-- lumping it in with plain manual cancellations. The customer wants a
-- distinct "Rejected" bucket they can see and filter separately from
-- RFQs that were simply called off.
ALTER TABLE public.rfqs DROP CONSTRAINT rfqs_status_check;
ALTER TABLE public.rfqs
  ADD CONSTRAINT rfqs_status_check
  CHECK (status IN ('Created', 'Order_Placed', 'PO_Raised', 'Completed', 'Cancelled', 'Rejected'));
