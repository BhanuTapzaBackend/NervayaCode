/*
 * Domain-Based Scoring System for Sleep Assessment
 *
 * 1. Calculate B (Onset), R (Night Recovery / Quality), G (Mental Hyperactivity) from Q3–Q10.
 * 2. Apply single/multi-select adjustment from Q11.
 * 3. Classify into one of 8 segments using DOMAIN_THRESHOLD (for status/content text).
 * 4. Always emit 3 named patterns (one per domain) with per-domain severity computed from the score.
 */

import { ICON_MOON_SLEEP, ICON_MOON, ICON_BRAIN } from '@/constants/icons';

// ─── Question Config (single source of truth for option counts) ───
export const QUESTION_CONFIG = {
  Q3: { options: 4 },
  Q4: { options: 4 },
  Q5: { options: 4 },
  Q6: { options: 3 },
  Q7: { options: 5 },
  Q8: { options: 3 },
  Q9: { options: 4 },
  Q10: { options: 5 },
} as const;

const DOMAIN_THRESHOLD = 2;

// ─── Types ───
export interface AssessmentAnswers {
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: number;
  q10: number;
  /**
   * Q11 options:
   * 'A' Falling asleep faster        → B +1
   * 'B' Reducing anxiety before bed  → G +1
   * 'C' Staying asleep through night → R +1
   * 'D' Waking up more refreshed     → R +1
   */
  q11: string[];
}

export type SleepSegment =
  | 'ALL_THREE'
  | 'QUALITY_ONSET'
  | 'ONSET_ANXIETY'
  | 'QUALITY_ANXIETY'
  | 'QUALITY_ONLY'
  | 'ONSET_ONLY'
  | 'ANXIETY_ONLY'
  | 'NO_DOMAIN';

export type SeverityLevel = 'mild' | 'moderate' | 'severe' | 'none';

export type SleepPatternSeverity = 'mild' | 'moderate' | 'severe';

export interface SleepPattern {
  id: 'onset' | 'recovery' | 'mental';
  name: string;
  subText: string;
  icon: string;
  severity: SleepPatternSeverity;
}

export type ServiceKey = 'SUPPLEMENT' | 'THERAPY' | 'GUIDED_AUDIO';
export type ServicePriority = 'High' | 'Low' | 'None';

export interface ServiceRecommendation {
  key: ServiceKey;
  priority: ServicePriority;
}

export interface AssessmentResult {
  scores: { B: number; R: number; G: number };
  segment: SleepSegment;
  status: string;
  severityLevel: SeverityLevel;
  headline: string;
  insight: string;
  reassurance: string;
  actionFraming: string;
  patterns: SleepPattern[];
  services: ServiceRecommendation[];
}

// ─── Status Labels ───
const STATUS_LABELS: Record<SleepSegment, string> = {
  ONSET_ONLY: 'Mild Sleep Issues Detected',
  QUALITY_ONLY: 'Mild Sleep Issues Detected',
  ANXIETY_ONLY: 'Mild Sleep Issues Detected',
  QUALITY_ONSET: 'Moderate Sleep Issues Detected',
  ONSET_ANXIETY: 'Moderate Sleep Issues Detected',
  QUALITY_ANXIETY: 'Moderate Sleep Issues Detected',
  ALL_THREE: 'Severe Sleep Issues Detected',
  NO_DOMAIN: 'No Major Sleep Issues Detected',
};

const SEVERITY_LEVELS: Record<SleepSegment, SeverityLevel> = {
  ONSET_ONLY: 'mild',
  QUALITY_ONLY: 'mild',
  ANXIETY_ONLY: 'mild',
  QUALITY_ONSET: 'moderate',
  ONSET_ANXIETY: 'moderate',
  QUALITY_ANXIETY: 'moderate',
  ALL_THREE: 'severe',
  NO_DOMAIN: 'none',
};

// ─── Dynamic Text per Segment ───
const SEGMENT_CONTENT: Record<
  SleepSegment,
  { headline: string; insight: string; reassurance: string; actionFraming: string }
> = {
  ONSET_ONLY: {
    headline: 'Falling asleep might be taking longer than it should',
    insight: 'You are probably able to sleep through the night, but getting there might take some time',
    reassurance: 'This is quite common and usually responds well to small changes',
    actionFraming: "We'll help you ease into sleep more naturally",
  },
  QUALITY_ONLY: {
    headline: 'Your sleep may not feel as restorative as it could be',
    insight: 'You are maybe falling asleep without much trouble, but the depth or continuity of sleep might be lacking',
    reassurance: "Improving sleep quality often doesn't require more time in bed, just better cycles",
    actionFraming: "We'll help you wake up feeling more refreshed and recovered",
  },
  ANXIETY_ONLY: {
    headline: 'Your mind might be staying a little active at night',
    insight: 'There could be some level of stress or overthinking that shows up around bedtime',
    reassurance: "This doesn't mean something is wrong, it just means your system hasn't fully unwound yet",
    actionFraming: "We'll help you settle your mind and ease into rest",
  },
  QUALITY_ONSET: {
    headline: 'Both falling asleep and staying in deep sleep might need support',
    insight: 'It seems like it takes time to fall asleep, and the sleep itself may not feel fully restorative',
    reassurance: 'When both are addressed together, improvements tend to compound quickly',
    actionFraming: "We'll help you transition into sleep smoothly and improve its depth",
  },
  ONSET_ANXIETY: {
    headline: 'A busy mind might be delaying your sleep',
    insight: 'You may notice thoughts or restlessness that makes it harder to drift off',
    reassurance: 'This pattern is quite responsive to calming and grounding routines',
    actionFraming: "We'll help you slow things down and fall asleep with less effort",
  },
  QUALITY_ANXIETY: {
    headline: 'Stress might be affecting how deeply you sleep',
    insight: 'Even if you fall asleep, your system may not fully switch into deeper, restorative states',
    reassurance: 'As your mind relaxes, sleep quality often improves alongside it',
    actionFraming: "We'll help you unwind more deeply and improve recovery during sleep",
  },
  ALL_THREE: {
    headline: 'Your sleep might feel a bit off across multiple areas',
    insight: 'Falling asleep, staying asleep, and mental calmness may all be interacting here',
    reassurance: "This can feel layered, but it also means there's room for meaningful improvement",
    actionFraming: "We'll guide you through a more complete reset of your sleep patterns",
  },
  NO_DOMAIN: {
    headline: 'Your sleep seems to be in a fairly good place',
    insight: 'There are no strong signs of disruption based on your responses',
    reassurance: 'Maintaining this is just as important as fixing issues',
    actionFraming: "We'll help you protect and further optimize your sleep",
  },
};

// ─── Service Recommendation Priority per Segment (verbatim from spec) ───
const SEGMENT_SERVICES: Record<SleepSegment, ServiceRecommendation[]> = {
  QUALITY_ONLY: [
    { key: 'SUPPLEMENT', priority: 'High' },
    { key: 'THERAPY', priority: 'High' },
    { key: 'GUIDED_AUDIO', priority: 'Low' },
  ],
  ONSET_ONLY: [
    { key: 'SUPPLEMENT', priority: 'High' },
    { key: 'GUIDED_AUDIO', priority: 'High' },
    { key: 'THERAPY', priority: 'Low' },
  ],
  ANXIETY_ONLY: [
    { key: 'THERAPY', priority: 'High' },
    { key: 'GUIDED_AUDIO', priority: 'High' },
    { key: 'SUPPLEMENT', priority: 'Low' },
  ],
  QUALITY_ONSET: [
    { key: 'SUPPLEMENT', priority: 'High' },
    { key: 'GUIDED_AUDIO', priority: 'High' },
    { key: 'THERAPY', priority: 'Low' },
  ],
  ONSET_ANXIETY: [
    { key: 'THERAPY', priority: 'High' },
    { key: 'SUPPLEMENT', priority: 'High' },
    { key: 'GUIDED_AUDIO', priority: 'Low' },
  ],
  QUALITY_ANXIETY: [
    { key: 'SUPPLEMENT', priority: 'High' },
    { key: 'THERAPY', priority: 'High' },
    { key: 'GUIDED_AUDIO', priority: 'Low' },
  ],
  ALL_THREE: [
    { key: 'SUPPLEMENT', priority: 'High' },
    { key: 'THERAPY', priority: 'High' },
    { key: 'GUIDED_AUDIO', priority: 'High' },
  ],
  NO_DOMAIN: [
    { key: 'SUPPLEMENT', priority: 'None' },
    { key: 'THERAPY', priority: 'None' },
    { key: 'GUIDED_AUDIO', priority: 'None' },
  ],
};

/**
 * Extract bundle composition for the Personalized Plan card.
 * Therapy is shown as a separate card, never in the bundle — so we filter it out.
 */
export function getBundleItems(services: ServiceRecommendation[]): ServiceKey[] {
  return services.filter((s) => s.key !== 'THERAPY' && s.priority === 'High').map((s) => s.key);
}

/**
 * Therapy is always rendered as a standalone card. Its priority controls
 * the eyebrow text and prominence; 'None' means hide entirely.
 */
export function getTherapyPriority(services: ServiceRecommendation[]): ServicePriority {
  return services.find((s) => s.key === 'THERAPY')?.priority ?? 'None';
}

function severityFromScore(score: number): SleepPatternSeverity {
  if (score >= 5) return 'severe';
  if (score >= 2) return 'moderate';
  return 'mild';
}

function buildPatterns(B: number, R: number, G: number): SleepPattern[] {
  return [
    {
      id: 'onset',
      name: 'Sleep Onset',
      subText: 'It takes you longer to fall asleep most nights.',
      icon: ICON_MOON_SLEEP,
      severity: severityFromScore(B),
    },
    {
      id: 'recovery',
      name: 'Night Recovery',
      subText: 'You tend to wake up during the night.',
      icon: ICON_MOON,
      severity: severityFromScore(R),
    },
    {
      id: 'mental',
      name: 'Mental Hyperactivity',
      subText: 'Racing thoughts or overthinking may be keeping your system alert.',
      icon: ICON_BRAIN,
      severity: severityFromScore(G),
    },
  ];
}

// ─── Main Calculation ───
export function calculateSleepAssessment(answers: AssessmentAnswers): AssessmentResult {
  const { q3, q4, q5, q6, q7, q8, q9, q10, q11 } = answers;

  let B = q3 + q9 + q10;
  let R = q4 + q6 + q8;
  let G = q5 + q7;

  if (q11.includes('A')) B += 1;
  if (q11.includes('B')) G += 1;
  if (q11.includes('C')) R += 1;
  if (q11.includes('D')) R += 1;

  let segment: SleepSegment;
  if (R >= DOMAIN_THRESHOLD && B >= DOMAIN_THRESHOLD && G >= DOMAIN_THRESHOLD) segment = 'ALL_THREE';
  else if (R >= DOMAIN_THRESHOLD && B >= DOMAIN_THRESHOLD) segment = 'QUALITY_ONSET';
  else if (B >= DOMAIN_THRESHOLD && G >= DOMAIN_THRESHOLD) segment = 'ONSET_ANXIETY';
  else if (R >= DOMAIN_THRESHOLD && G >= DOMAIN_THRESHOLD) segment = 'QUALITY_ANXIETY';
  else if (R >= DOMAIN_THRESHOLD) segment = 'QUALITY_ONLY';
  else if (B >= DOMAIN_THRESHOLD) segment = 'ONSET_ONLY';
  else if (G >= DOMAIN_THRESHOLD) segment = 'ANXIETY_ONLY';
  else segment = 'NO_DOMAIN';

  return {
    scores: { B, R, G },
    segment,
    status: STATUS_LABELS[segment],
    severityLevel: SEVERITY_LEVELS[segment],
    ...SEGMENT_CONTENT[segment],
    patterns: buildPatterns(B, R, G),
    services: SEGMENT_SERVICES[segment],
  };
}
