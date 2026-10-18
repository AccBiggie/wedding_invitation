export function formatMoneyInput(value: string): string {
  const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  const padded = digits.padStart(3, '0');
  return `${padded.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${padded.slice(-2)}`;
}

export const formatMoneyValue = (value: number): string => formatMoneyInput(String(Math.round(value * 100)));
export const parseMoneyInput = (value: string): number => Number(value.replace(/\D/g, '')) / 100;
