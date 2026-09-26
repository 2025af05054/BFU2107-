// Shared date+time formatting for RFQ/quote/PO timestamps. These are all
// TIMESTAMPTZ columns (created_at, acknowledged_at, ...) where the time of
// day is meaningful -- unlike plain DATE columns (valid_until,
// delivery_date) which have no time component and should stay date-only.
export const formatDateTime = (value: string | Date): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};
