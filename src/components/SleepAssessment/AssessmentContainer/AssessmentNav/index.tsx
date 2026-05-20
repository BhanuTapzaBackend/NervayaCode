'use client';

import Button from '@/components/common/Button';
import styles from './styles.module.css';

interface AssessmentNavProps {
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function AssessmentNav({
  isFirstQuestion,
  isLastQuestion,
  canProceed,
  isSubmitting,
  onPrevious,
  onNext,
}: AssessmentNavProps) {
  return (
    <footer className={styles.footer}>
      {!isFirstQuestion && (
        <Button
          type="button"
          variant="secondary"
          size="md"
          fullWidth={false}
          onClick={onPrevious}
          disabled={isSubmitting}
          aria-label="Previous question"
        >
          Previous
        </Button>
      )}
      <div className={styles.nextWrapper}>
        <Button
          type="button"
          variant="primary"
          size="md"
          fullWidth={false}
          className={styles.nextButton}
          onClick={onNext}
          disabled={!canProceed}
          loading={isSubmitting}
          aria-label={isLastQuestion ? 'Submit assessment' : 'Next Question'}
        >
          {isLastQuestion ? 'Submit assessment' : 'Next Question'}
        </Button>
      </div>
    </footer>
  );
}
