export const LOW_STOCK_THRESHOLD = 10;

export function isLowStock(quantity: number): boolean {
  return quantity > 0 && quantity <= LOW_STOCK_THRESHOLD;
}
