export const STANDARD_SHIPPING_FREE_THRESHOLD = 500;
export const STANDARD_SHIPPING_COST = 50;

export function getShippingCost(subtotal: number): number {
  return subtotal >= STANDARD_SHIPPING_FREE_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
}
