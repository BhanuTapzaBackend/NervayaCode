'use client';

import { useMemo } from 'react';
import type { ISleepAssessmentResponse, ISleepAssessmentQuestion } from '@/types/sleepAssessment.types';
import { calculateSleepAssessment } from '@/utils/sleepAssessment';
import { RecommendationView } from '../RecommendationView';
import { GuestResultsGate } from './GuestResultsGate';
import { AnalyzingState } from './AnalyzingState';

interface CompletionViewProps {
  completedResponse?: ISleepAssessmentResponse | null;
  questions?: ISleepAssessmentQuestion[];
  isGuest?: boolean;
}

function useAssessmentResult(
  completedResponse: ISleepAssessmentResponse | null,
  questions: ISleepAssessmentQuestion[],
) {
  return useMemo(() => {
    if (!completedResponse?.answers || questions.length === 0) return null;

    const answersMap = new Map<number, string | string[]>();
    const questionsByOrder = new Map<number, ISleepAssessmentQuestion>();

    questions.forEach((q) => questionsByOrder.set(q.order, q));
    completedResponse.answers.forEach((a) => {
      const q = questions.find((quest) => quest._id === a.questionId || quest.questionId === a.questionId);
      if (q) answersMap.set(q.order, a.answer);
    });

    const getIdx = (order: number): number => {
      const q = questionsByOrder.get(order);
      const a = answersMap.get(order);
      if (!q || a === undefined || Array.isArray(a)) return 0;
      const idx = q.options.findIndex((opt) => opt.value === a || opt.label === a);
      return idx >= 0 ? idx : 0;
    };

    const getQ11 = (): string[] => {
      const q = questionsByOrder.get(11);
      const a = answersMap.get(11);
      if (!q || !a) return [];
      const values = Array.isArray(a) ? a : [a];
      return values
        .map((val) => {
          const idx = q.options.findIndex((opt) => opt.value === val || opt.label === val);
          return idx >= 0 ? String.fromCharCode(65 + idx) : '';
        })
        .filter((letter) => ['A', 'B', 'C', 'D'].includes(letter));
    };

    return calculateSleepAssessment({
      q3: getIdx(3),
      q4: getIdx(4),
      q5: getIdx(5),
      q6: getIdx(6),
      q7: getIdx(7),
      q8: getIdx(8),
      q9: getIdx(9),
      q10: getIdx(10),
      q11: getQ11(),
    });
  }, [completedResponse, questions]);
}

export function CompletionView({ completedResponse = null, questions = [], isGuest = false }: CompletionViewProps) {
  const resultData = useAssessmentResult(completedResponse, questions);

  if (isGuest) {
    return <GuestResultsGate returnUrl="/sleep-assessment" />;
  }

  if (!resultData) {
    return <AnalyzingState />;
  }

  return <RecommendationView result={resultData} />;
}
