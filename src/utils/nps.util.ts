/** NPS bands, per the standard 0–10 split. Shared by GA4 tracking and the CRM push. */
export type NpsCategory = 'detractor' | 'passive' | 'promoter';

export function npsCategoryFor(score: number): NpsCategory {
  if (score <= 6) return 'detractor';
  if (score <= 8) return 'passive';
  return 'promoter';
}
