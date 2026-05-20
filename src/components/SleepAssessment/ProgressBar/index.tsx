'use client';

import styles from './styles.module.css';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  showStepCounter?: boolean;
}

const ProgressBar = ({ currentStep, totalSteps, showStepCounter = true }: ProgressBarProps) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className={styles.progressContainer}>
      {showStepCounter && (
        <span className={styles.stepCounter}>
          {currentStep}/{totalSteps}
        </span>
      )}
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ ['--progress' as string]: `${progressPercentage}%` }}
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Question ${currentStep} of ${totalSteps}`}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
