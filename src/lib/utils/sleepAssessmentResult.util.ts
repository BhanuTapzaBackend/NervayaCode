import type {
  IQuestionAnswer,
  IQuestionOption,
  ISleepAssessmentResponse,
  SleepAssessmentRecommendation,
  SleepAssessmentResult,
  SleepAssessmentSeverityBand,
} from '@/types/sleepAssessment.types';

interface SleepAssessmentResultQuestion {
  _id: string;
  order: number;
  options: IQuestionOption[];
}

interface BuildSleepAssessmentResultInput {
  questions: SleepAssessmentResultQuestion[];
  answers: IQuestionAnswer[];
}

const DOMAIN_THRESHOLD = 2;

type SleepSegment =
  | 'ALL_THREE'
  | 'QUALITY_ONSET'
  | 'ONSET_ANXIETY'
  | 'QUALITY_ANXIETY'
  | 'QUALITY_ONLY'
  | 'ONSET_ONLY'
  | 'ANXIETY_ONLY'
  | 'NO_DOMAIN';

const SEGMENT_SEVERITY: Record<SleepSegment, SleepAssessmentSeverityBand> = {
  ONSET_ONLY: 'mild',
  QUALITY_ONLY: 'mild',
  ANXIETY_ONLY: 'mild',
  QUALITY_ONSET: 'moderate',
  ONSET_ANXIETY: 'moderate',
  QUALITY_ANXIETY: 'moderate',
  ALL_THREE: 'severe',
  NO_DOMAIN: 'none',
};

const SEGMENT_LABELS: Record<SleepSegment, string> = {
  ONSET_ONLY: 'Mild deviations from natural sleep cycle detected',
  QUALITY_ONLY: 'Mild deviations from natural sleep cycle detected',
  ANXIETY_ONLY: 'Mild deviations from natural sleep cycle detected',
  QUALITY_ONSET: 'Moderate deviations from natural sleep cycle detected',
  ONSET_ANXIETY: 'Moderate deviations from natural sleep cycle detected',
  QUALITY_ANXIETY: 'Moderate deviations from natural sleep cycle detected',
  ALL_THREE: 'Severe deviations from natural sleep cycle detected',
  NO_DOMAIN: 'No significant deviations from natural sleep cycle detected',
};

const SEGMENT_DESCRIPTIONS: Record<SleepSegment, string> = {
  ONSET_ONLY:
    'Some minor inconsistencies in your sleep patterns have been identified. While not critical, addressing these now can prevent future disruptions.',
  QUALITY_ONLY:
    'Some minor inconsistencies in your sleep patterns have been identified. While not critical, addressing these now can prevent future disruptions.',
  ANXIETY_ONLY:
    'Some minor inconsistencies in your sleep patterns have been identified. While not critical, addressing these now can prevent future disruptions.',
  QUALITY_ONSET:
    'Your sleep patterns show some inconsistencies that may be affecting recovery and energy. With the right adjustments, these are typically reversible and sustainable.',
  ONSET_ANXIETY:
    'Your sleep patterns show some inconsistencies that may be affecting recovery and energy. With the right adjustments, these are typically reversible and sustainable.',
  QUALITY_ANXIETY:
    'Your sleep patterns show some inconsistencies that may be affecting recovery and energy. With the right adjustments, these are typically reversible and sustainable.',
  ALL_THREE:
    'Significant disruptions in your sleep patterns are likely impacting your daily functioning. Focused intervention and structured habits are recommended to restore balance.',
  NO_DOMAIN:
    'Your sleep patterns appear healthy and consistent. Maintaining these habits will ensure long-term restorative rest and vitality.',
};

const SEGMENT_BANNERS: Record<SleepSegment, string> = {
  ONSET_ONLY:
    '**Consistent, restorative sleep may be closer than expected**: A few mild disruptions were detected that may occasionally affect sleep quality or consistency. Your recommendations focus on small but effective optimizations to strengthen your overall sleep routine.',
  QUALITY_ONLY:
    '**Consistent, restorative sleep may be closer than expected**: A few mild disruptions were detected that may occasionally affect sleep quality or consistency. Your recommendations focus on small but effective optimizations to strengthen your overall sleep routine.',
  ANXIETY_ONLY:
    '**Consistent, restorative sleep may be closer than expected**: A few mild disruptions were detected that may occasionally affect sleep quality or consistency. Your recommendations focus on small but effective optimizations to strengthen your overall sleep routine.',
  QUALITY_ONSET:
    '**Sleep may benefit from structured improvements**: Some recurring patterns are impacting your sleep consistency and recovery. Your personalized plan prioritizes targeted adjustments that can create noticeable improvements over time.',
  ONSET_ANXIETY:
    '**Sleep may benefit from structured improvements**: Some recurring patterns are impacting your sleep consistency and recovery. Your personalized plan prioritizes targeted adjustments that can create noticeable improvements over time.',
  QUALITY_ANXIETY:
    '**Sleep may benefit from structured improvements**: Some recurring patterns are impacting your sleep consistency and recovery. Your personalized plan prioritizes targeted adjustments that can create noticeable improvements over time.',
  ALL_THREE:
    '**Better sleep is within reach**: Your sleep patterns indicate significant disruption that may be affecting energy, mood, and recovery. Your personalized recommendations focus on high-impact changes first to help restore stability and improve sleep quality progressively.',
  NO_DOMAIN:
    '**Your sleep appears to be in a healthy range**: No major disruptions were identified in your recent assessment. Your personalized insights focus on maintaining consistency and supporting long-term sleep wellness.',
};

const RECOMMENDATION_LIBRARY: Record<string, Omit<SleepAssessmentRecommendation, 'key' | 'priority'>> = {
  supplement: {
    title: 'Sleep Essentials',
    description: 'Natural aids crafted to support faster sleep onset and deeper rest.',
    buttonText: 'Explore Range',
    href: '/supplements',
  },
  counselling: {
    title: 'Therapy Corner',
    description: 'One-on-one support to address the root of your sleep patterns.',
    buttonText: 'Schedule Appointment',
    href: '/therapy-corner',
  },
  guided_audio: {
    title: 'Deep Rest',
    description: 'Guided audio sessions tailored to help you unwind and fall asleep.',
    buttonText: 'Start Listening',
    href: '/deep-rest',
  },
};

type ServiceName = 'supplement' | 'counselling' | 'guided_audio';

function makeRec(key: ServiceName, priority: SleepAssessmentRecommendation['priority']): SleepAssessmentRecommendation {
  return { key, priority, ...RECOMMENDATION_LIBRARY[key] };
}

const SEGMENT_RECOMMENDATIONS: Record<SleepSegment, SleepAssessmentRecommendation[]> = {
  QUALITY_ONLY: [
    makeRec('supplement', 'primary'),
    makeRec('counselling', 'primary'),
    makeRec('guided_audio', 'secondary'),
  ],
  ONSET_ONLY: [
    makeRec('supplement', 'primary'),
    makeRec('guided_audio', 'primary'),
    makeRec('counselling', 'secondary'),
  ],
  ANXIETY_ONLY: [
    makeRec('counselling', 'primary'),
    makeRec('guided_audio', 'primary'),
    makeRec('supplement', 'secondary'),
  ],
  QUALITY_ONSET: [
    makeRec('supplement', 'primary'),
    makeRec('guided_audio', 'primary'),
    makeRec('counselling', 'secondary'),
  ],
  ONSET_ANXIETY: [
    makeRec('counselling', 'primary'),
    makeRec('supplement', 'primary'),
    makeRec('guided_audio', 'secondary'),
  ],
  QUALITY_ANXIETY: [
    makeRec('supplement', 'primary'),
    makeRec('counselling', 'primary'),
    makeRec('guided_audio', 'secondary'),
  ],
  ALL_THREE: [makeRec('supplement', 'primary'), makeRec('counselling', 'primary'), makeRec('guided_audio', 'primary')],
  NO_DOMAIN: [makeRec('supplement', 'none'), makeRec('counselling', 'none'), makeRec('guided_audio', 'none')],
};

function normalizeQuestionId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toString' in value) {
    return String(value);
  }
  return '';
}

function getMatchedOption(question: SleepAssessmentResultQuestion, answer: string): IQuestionOption | null {
  return question.options.find((option) => option.value === answer || option.label === answer) ?? null;
}

function getOptionIndex(question: SleepAssessmentResultQuestion, option: IQuestionOption): number {
  return question.options.findIndex((item) => item.value === option.value && item.label === option.label);
}

function parseExplicitNumericScore(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  const match = trimmed.match(/^(-?\d+)\b/);
  return match ? Number(match[1]) : null;
}

function getAnswerScore(
  question: SleepAssessmentResultQuestion | undefined,
  answer: string | string[] | undefined,
): number {
  if (question == null || answer == null || Array.isArray(answer)) return 0;

  const directScore = parseExplicitNumericScore(answer);
  if (directScore != null) return directScore;

  const matchedOption = getMatchedOption(question, answer);
  if (!matchedOption) return 0;

  const optionValueScore = parseExplicitNumericScore(matchedOption.value);
  if (optionValueScore != null) return optionValueScore;

  const optionLabelScore = parseExplicitNumericScore(matchedOption.label);
  if (optionLabelScore != null) return optionLabelScore;

  return Math.max(0, getOptionIndex(question, matchedOption));
}

function getQ11Letters(
  question: SleepAssessmentResultQuestion | undefined,
  answer: string | string[] | undefined,
): string[] {
  if (!question || !answer) return [];
  const values = Array.isArray(answer) ? answer : [answer];
  return values
    .map((val) => {
      const idx = question.options.findIndex((opt) => opt.value === val || opt.label === val);
      return idx >= 0 ? String.fromCharCode(65 + idx) : '';
    })
    .filter((letter) => ['A', 'B', 'C', 'D'].includes(letter));
}

function classifySegment(B: number, R: number, G: number): SleepSegment {
  if (R >= DOMAIN_THRESHOLD && B >= DOMAIN_THRESHOLD && G >= DOMAIN_THRESHOLD) return 'ALL_THREE';
  if (R >= DOMAIN_THRESHOLD && B >= DOMAIN_THRESHOLD) return 'QUALITY_ONSET';
  if (B >= DOMAIN_THRESHOLD && G >= DOMAIN_THRESHOLD) return 'ONSET_ANXIETY';
  if (R >= DOMAIN_THRESHOLD && G >= DOMAIN_THRESHOLD) return 'QUALITY_ANXIETY';
  if (R >= DOMAIN_THRESHOLD) return 'QUALITY_ONLY';
  if (B >= DOMAIN_THRESHOLD) return 'ONSET_ONLY';
  if (G >= DOMAIN_THRESHOLD) return 'ANXIETY_ONLY';
  return 'NO_DOMAIN';
}

export function buildSleepAssessmentResult({
  questions,
  answers,
}: BuildSleepAssessmentResultInput): SleepAssessmentResult {
  const questionById = new Map(questions.map((q) => [normalizeQuestionId(q._id), q]));
  const questionByOrder = new Map(questions.map((q) => [q.order, q]));
  const answerByOrder = new Map<number, string | string[]>();

  for (const answer of answers) {
    const question = questionById.get(normalizeQuestionId(answer.questionId));
    if (question) answerByOrder.set(question.order, answer.answer);
  }

  // Domain scores: B (Onset) = Q3+Q9+Q10, R (Quality) = Q4+Q6+Q8, G (Anxiety) = Q5+Q7
  let B =
    getAnswerScore(questionByOrder.get(3), answerByOrder.get(3)) +
    getAnswerScore(questionByOrder.get(9), answerByOrder.get(9)) +
    getAnswerScore(questionByOrder.get(10), answerByOrder.get(10));

  let R =
    getAnswerScore(questionByOrder.get(4), answerByOrder.get(4)) +
    getAnswerScore(questionByOrder.get(6), answerByOrder.get(6)) +
    getAnswerScore(questionByOrder.get(8), answerByOrder.get(8));

  let G =
    getAnswerScore(questionByOrder.get(5), answerByOrder.get(5)) +
    getAnswerScore(questionByOrder.get(7), answerByOrder.get(7));

  // Q11 adjustment (each selected option adds +1 to its domain)
  const q11Letters = getQ11Letters(questionByOrder.get(11), answerByOrder.get(11));
  if (q11Letters.includes('A')) B += 1;
  if (q11Letters.includes('B')) G += 1;
  if (q11Letters.includes('C')) R += 1;
  if (q11Letters.includes('D')) R += 1;

  const segment = classifySegment(B, R, G);
  const severityBand = SEGMENT_SEVERITY[segment];
  const severityScore = B + R + G;

  const recommendations = SEGMENT_RECOMMENDATIONS[segment];

  return {
    severityScore,
    severityBand,
    severityLabel: SEGMENT_LABELS[segment],
    description: SEGMENT_DESCRIPTIONS[segment],
    bannerText: SEGMENT_BANNERS[segment],
    explanation: `Segment: ${segment}. Sleep Onset (B): ${B}, Sleep Quality (R): ${R}, Anxiety/Stress (G): ${G}.`,
    reasoning: [`Classification: ${segment}`, `Scores — B: ${B}, R: ${R}, G: ${G}`],
    recommendations,
    intentAnswer: answerByOrder.get(11) ?? null,
    intentLabel: q11Letters.length > 0 ? q11Letters.join(',') : null,
    flags: {
      recommendsSupplement: recommendations.some((r) => r.key === 'supplement' && r.priority === 'primary'),
      recommendsCounselling: recommendations.some((r) => r.key === 'counselling' && r.priority === 'primary'),
      prioritiseGuidedMeditationAudio: false,
      hasFrequentSleepOnsetIssue: B >= DOMAIN_THRESHOLD,
      highOverthinking: G >= DOMAIN_THRESHOLD,
    },
  };
}

export function getSleepAssessmentResult(response: ISleepAssessmentResponse | null): SleepAssessmentResult | null {
  return response?.result ?? null;
}

export function getSleepScoreLabel(response: ISleepAssessmentResponse | null): string {
  return getSleepAssessmentResult(response)?.severityLabel ?? 'No Major Sleep Issues Detected';
}

export function getSleepRecommendationType(
  response: ISleepAssessmentResponse | null,
): 'content' | 'therapy' | 'product' {
  const result = getSleepAssessmentResult(response);
  if (!result) return 'content';
  if (result.flags.recommendsCounselling) return 'therapy';
  if (result.flags.recommendsSupplement) return 'product';
  return 'content';
}

export function getSleepAssessmentDescription(response: ISleepAssessmentResponse | null): string {
  return getSleepAssessmentResult(response)?.description || '';
}

export function getSleepAssessmentBanner(response: ISleepAssessmentResponse | null): string {
  return getSleepAssessmentResult(response)?.bannerText || '';
}

export const SLEEP_ASSESSMENT_QUESTION_GROUPS = {
  profile: [1, 2] as const,
  severity: [3, 4, 5, 6, 7, 8] as const,
  intent: 11,
} as const;
