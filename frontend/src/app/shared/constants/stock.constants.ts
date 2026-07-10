export const LOW_STOCK_THRESHOLD = 10;
export const CRITICAL_STOCK_THRESHOLD = 4;

export type StockLevel = 'none' | 'warning' | 'critical' | 'out';

// Fixed absolute bands, independent of any per-product lowStockThreshold:
// 0 -> out, 1-3 -> critical (red), 4-9 -> warning (orange), 10+ -> none.
export function getStockLevel(quantity: number): StockLevel {
  if (quantity <= 0) return 'out';
  if (quantity < CRITICAL_STOCK_THRESHOLD) return 'critical';
  if (quantity < LOW_STOCK_THRESHOLD) return 'warning';
  return 'none';
}

export function isLowStock(quantity: number): boolean {
  const level = getStockLevel(quantity);
  return level === 'warning' || level === 'critical';
}
