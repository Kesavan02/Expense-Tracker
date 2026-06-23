const RATES: Record<string, number> = {
  'USD': 1.0,
  'EUR': 0.92,
  'GBP': 0.79,
  'INR': 83.2,
  'JPY': 150.0,
};

const SYMBOLS: Record<string, string> = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'INR': '₹',
  'JPY': '¥',
};

export const CurrencyConverter = {
  convert: (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    const amountInUSD = amount / (RATES[fromCurrency] || 1.0);
    return amountInUSD * (RATES[toCurrency] || 1.0);
  },
};

export const CurrencyFormatter = {
  format: (amount: number, currency: string = 'USD'): string => {
    const symbol = SYMBOLS[currency] || '$';
    
    // For JPY, format as integer. For others, format with 2 decimal places.
    const formattedVal = currency === 'JPY' 
      ? Math.round(amount).toLocaleString()
      : amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

    return `${symbol}${formattedVal}`;
  },

  getSymbol: (currency: string = 'USD'): string => {
    return SYMBOLS[currency] || '$';
  },
};
