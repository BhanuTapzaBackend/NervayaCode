'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ISleepAssessmentQuestion } from '@/types/sleepAssessment.types';
import { deepRestApi } from '@/lib/api/deepRest';
import type { IDriftOffAnswer } from '@/types/driftOff.types';

export interface UseDriftOffAssessmentResult {
  currentQuestion: ISleepAssessmentQuestion | undefined;
  currentQuestionIndex: number;
  totalQuestions: number;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  currentAnswer: string | string[] | null;
  canProceed: boolean;
  direction: number;
  isSubmitting: boolean;
  submitError: string | null;
  isComplete: boolean;
  isHydrated: boolean;
  handleAnswerChange: (answer: string | string[]) => void;
  handleNext: () => Promise<void>;
  handlePrevious: () => void;
}

export function useDriftOffAssessmentState(
  questions: ISleepAssessmentQuestion[],
  driftOffOrderId: string,
  initialAnswers: IDriftOffAnswer[] = [],
  isReSession = false,
  responseId: string | null = null,
): UseDriftOffAssessmentResult {
  const hydratedInitialAnswersRef = useRef(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string | string[]>>(
    () => new Map(initialAnswers.map((a) => [a.questionId, a.answer])),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const currentQuestion = useMemo(() => questions[currentQuestionIndex], [questions, currentQuestionIndex]);
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const currentAnswer = useMemo(() => {
    if (!currentQuestion) return null;
    return answers.get(currentQuestion._id) ?? answers.get(currentQuestion.questionId) ?? null;
  }, [currentQuestion, answers]);

  const canProceed = useMemo(() => {
    if (!currentQuestion) return false;
    if (!currentQuestion.isRequired) return true;

    // Explicitly use the resolved currentAnswer for consistency
    const answer = currentAnswer;
    if (answer === null || answer === undefined) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === 'string') return answer.trim().length > 0;
    return !!answer;
  }, [currentQuestion, currentAnswer]);

  useEffect(() => {
    if (questions.length === 0) return;

    const hydrated = new Map<string, string | string[]>();
    initialAnswers.forEach((a) => {
      if (a.questionId) hydrated.set(a.questionId, a.answer);

      const q = questions.find((q) => q.questionId === a.questionId || q._id === a.questionId);
      if (q) {
        hydrated.set(q._id, a.answer);
        if (q.questionId) hydrated.set(q.questionId, a.answer);
      }
    });

    if (hydrated.size > 0) {
      setAnswers((prev) => {
        const next = new Map(prev);
        hydrated.forEach((val, key) => next.set(key, val));
        return next;
      });

      if (!hydratedInitialAnswersRef.current) {
        if (isReSession) {
          setCurrentQuestionIndex(0);
        } else {
          const firstUnanswered = questions.findIndex((q) => !hydrated.has(q._id) && !hydrated.has(q.questionId));
          if (firstUnanswered >= 0) {
            setCurrentQuestionIndex(firstUnanswered);
          } else if (questions.length > 0) {
            // If all are answered but not complete, go to the last question
            setCurrentQuestionIndex(questions.length - 1);
          }
        }
        hydratedInitialAnswersRef.current = true;
      }
    }
    setIsHydrated(true);
  }, [questions, initialAnswers, isReSession]);

  const handleAnswerChange = useCallback(
    (answer: string | string[]) => {
      if (!currentQuestion) return;
      setAnswers((prev) => {
        const next = new Map(prev);
        next.set(currentQuestion._id, answer);
        if (currentQuestion.questionId) {
          next.set(currentQuestion.questionId, answer);
        }
        return next;
      });
    },
    [currentQuestion],
  );

  const handleNext = useCallback(async () => {
    if (!canProceed || !currentQuestion) return;
    const answerToSave = currentAnswer;
    if (answerToSave === null && currentQuestion.isRequired) return;

    setDirection(1);
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!isReSession && answerToSave !== null) {
        await deepRestApi.saveAnswer({
          deepRestOrderId: driftOffOrderId,
          questionId: currentQuestion._id,
          answer: answerToSave,
        });
      }
      if (isLastQuestion) {
        if (isReSession && responseId) {
          const seen = new Set<string>();
          const payload: { questionId: string; answer: string | string[] }[] = [];
          for (const q of questions) {
            const value = answers.get(q._id) ?? answers.get(q.questionId);
            if (value === undefined) continue;
            const key = q.questionId || q._id;
            if (seen.has(key)) continue;
            seen.add(key);
            payload.push({ questionId: key, answer: value });
          }
          await deepRestApi.requestReSession(responseId, payload);
        } else {
          await deepRestApi.completeAssessment(driftOffOrderId);
        }
        setIsComplete(true);
      } else {
        setCurrentQuestionIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
      }
    } catch {
      setSubmitError(
        isReSession
          ? 'Unable to submit your re-session request. Please try again.'
          : 'Failed to save your answer. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canProceed,
    currentQuestion,
    currentAnswer,
    isLastQuestion,
    totalQuestions,
    driftOffOrderId,
    isReSession,
    responseId,
    questions,
    answers,
  ]);

  const handlePrevious = useCallback(() => {
    if (isFirstQuestion) return;
    setDirection(-1);
    setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0));
  }, [isFirstQuestion]);

  return {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    isFirstQuestion,
    isLastQuestion,
    currentAnswer,
    canProceed,
    direction,
    isSubmitting,
    submitError,
    isComplete,
    isHydrated,
    handleAnswerChange,
    handleNext,
    handlePrevious,
  };
}
