// All prices are stored in the database as INR (suppliers price their
// catalog in rupees). This converts for display only, based on the
// viewer's locale — it never touches stored values.
//
// Rate is a fixed snapshot, not a live feed. Update USD_TO_INR_RATE
// periodically (or swap in a live FX API) to keep it current.
export const USD_TO_INR_RATE = 83.5;

export const isIndianLocale = (): boolean => {
  if (typeof window === 'undefined') return true;

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone === 'Asia/Kolkata' || timeZone === 'Asia/Calcutta') return true;
  } catch {
    // Intl not available - fall through to language check
  }

  const language = navigator.language || (navigator as any).userLanguage || '';
  return language.toLowerCase().includes('-in');
};

interface FormatCurrencyOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

// amountInInr must already be in INR (the storage currency).
export const formatCurrency = (amountInInr: number, options: FormatCurrencyOptions = {}): string => {
  if (isIndianLocale()) {
    return `₹${amountInInr.toLocaleString('en-IN', options)}`;
  }
  const usd = amountInInr / USD_TO_INR_RATE;
  return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, ...options })}`;
};

export const currencySymbol = (): string => (isIndianLocale() ? '₹' : '$');
