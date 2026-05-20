import { CURRENCY } from '@/lib/constants/enums';

export { CURRENCY };

export const formatCurrency = (amount: number, showSymbol: boolean = true): string => {
  if (showSymbol) {
    return `${CURRENCY.SYMBOL}${amount.toLocaleString('en-IN')}`;
  }
  return `${amount.toLocaleString('en-IN')}`;
};
