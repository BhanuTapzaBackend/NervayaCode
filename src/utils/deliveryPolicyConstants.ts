export const DELIVERY_POLICY_SECTIONS = [
  'shipping-partners',
  'serviceable-locations',
  'processing-time',
  'delivery-timeline',
  'shipping-charges',
  'order-tracking',
  'delivery-attempts',
  'damaged-packages',
  'address-accuracy',
  'non-delivery-services',
  'modify-policy',
  'contact',
] as const;

export const DEFAULT_DELIVERY_POLICY_SECTION = 'shipping-partners' as const;
