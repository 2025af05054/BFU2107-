// All prices are stored in the database as INR (suppliers price their
// catalog in rupees), and always displayed as INR regardless of the
// viewer's locale -- this is an India-focused marketplace, so every price
// shown anywhere in the app uses the rupee sign, not a locale-converted
// currency.

interface FormatCurrencyOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export const formatCurrency = (amountInInr: number, options: FormatCurrencyOptions = {}): string => {
  return `₹${amountInInr.toLocaleString('en-IN', options)}`;
};

export const currencySymbol = (): string => '₹';
