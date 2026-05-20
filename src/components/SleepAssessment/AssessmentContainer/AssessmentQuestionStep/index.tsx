'use client';

import { useState, useEffect } from 'react';
import { LazyMotion, m, AnimatePresence } from 'framer-motion';
import QuestionCard from '../../QuestionCard';
import styles from './styles.module.css';
import type { ISleepAssessmentQuestion } from '@/types/sleepAssessment.types';

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

const reducedMotionVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

interface AssessmentQuestionStepProps {
  question: ISleepAssessmentQuestion;
  direction: number;
  currentAnswer: string | string[] | null;
  onAnswerChange: (answer: string | string[]) => void;
}

export function AssessmentQuestionStep({
  question,
  direction,
  currentAnswer,
  onAnswerChange,
}: AssessmentQuestionStepProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const listener = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const variants = prefersReducedMotion ? reducedMotionVariants : slideVariants;
  const transition = prefersReducedMotion
    ? { opacity: { duration: 0.15 } }
    : { x: { type: 'spring' as const, stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } };

  return (
    <LazyMotion features={() => import('framer-motion').then((mod) => mod.domAnimation)}>
      <div className={styles.questionWrapper}>
        <AnimatePresence mode="wait" custom={direction}>
          <m.div
            key={question._id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            <QuestionCard
              questionText={question.questionText}
              questionType={question.questionType}
              options={question.options}
              selectedAnswer={currentAnswer}
              onAnswerChange={onAnswerChange}
              isRequired={question.isRequired}
            />
          </m.div>
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
