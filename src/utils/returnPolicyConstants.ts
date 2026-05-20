export const RETURN_POLICY_SECTIONS = [
  'general-principles',
  'supplements',
  'therapy',
  'deep-reset',
  'bundled-services',
  'refund-timeline',
  'abuse-prevention',
  'contact-info',
] as const;

export type ReturnPolicySection = (typeof RETURN_POLICY_SECTIONS)[number];

export const DEFAULT_RETURN_POLICY_SECTION: ReturnPolicySection = 'general-principles';
