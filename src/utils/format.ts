export function formatCurrency(n: number): string {
  return '$' + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatHours(n: number): string {
  return n.toFixed(2);
}

export function formatCurrencySigned(n: number): string {
  return (n >= 0 ? '+' : '-') + '$' + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
