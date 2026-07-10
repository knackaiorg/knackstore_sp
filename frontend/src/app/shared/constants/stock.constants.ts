export const LOW_STOCK_THRESHOLD = 10;

export function isLowStock(quantity: number, threshold: number = LOW_STOCK_THRESHOLD): boolean {
  return quantity > 0 && quantity < threshold;
}
