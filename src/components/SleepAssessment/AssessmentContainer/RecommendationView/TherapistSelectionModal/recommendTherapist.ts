import type { Therapist } from '@/types/therapist.types';
import type { AssessmentResult } from '@/utils/sleepAssessment';

/**
 * Picks a single therapist to surface as the assessment-matched recommendation.
 *
 * The assessment produces three domain scores — B (sleep onset), R (night
 * recovery / quality) and G (mental hyperactivity / anxiety). We match the
 * dominant domain to a therapist's specialization keywords, falling back to the
 * first available therapist when there is no clear match.
 */

type DomainKey = 'onset' | 'recovery' | 'mental';

const DOMAIN_KEYWORDS: Record<DomainKey, string[]> = {
  mental: ['anxiety', 'stress', 'mental', 'cbt', 'depression', 'mindfulness'],
  onset: ['sleep', 'insomnia', 'onset'],
  recovery: ['sleep', 'recovery', 'insomnia', 'restorative'],
};

function dominantDomain(result: AssessmentResult): DomainKey | null {
  const { B, R, G } = result.scores;
  if (B <= 0 && R <= 0 && G <= 0) return null;
  // Tie-break order favours the domain therapy helps most: anxiety → onset → quality.
  const ranked: Array<[DomainKey, number]> = [
    ['mental', G],
    ['onset', B],
    ['recovery', R],
  ];
  ranked.sort((a, b) => b[1] - a[1]);
  return ranked[0][1] > 0 ? ranked[0][0] : null;
}

function matchesKeywords(therapist: Therapist, keywords: string[]): boolean {
  const specs = (therapist.specializations ?? []).map((s) => s.toLowerCase());
  return specs.some((spec) => keywords.some((kw) => spec.includes(kw)));
}

/**
 * Returns the recommended therapist, or `null` when none are available.
 * Only therapists that are available are considered.
 */
export function pickRecommendedTherapist(
  therapists: Therapist[] | undefined,
  result: AssessmentResult,
): Therapist | null {
  const available = (therapists ?? []).filter((t) => t.isAvailable !== false);
  if (available.length === 0) return null;

  const domain = dominantDomain(result);
  if (domain) {
    const matched = available.find((t) => matchesKeywords(t, DOMAIN_KEYWORDS[domain]));
    if (matched) return matched;
  }

  return available[0];
}
