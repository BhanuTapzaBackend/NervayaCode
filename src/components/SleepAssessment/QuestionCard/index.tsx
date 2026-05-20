'use client';

import { useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ICON_CHECK_SIMPLE } from '@/constants/icons';
import styles from './styles.module.css';
import type { IQuestionOption, QuestionType } from '@/types/sleepAssessment.types';

interface QuestionCardProps {
  questionText: string;
  questionType: QuestionType;
  options: IQuestionOption[];
  selectedAnswer: string | string[] | null;
  onAnswerChange: (answer: string | string[]) => void;
  isRequired?: boolean;
}

const QuestionCard = ({
  questionText,
  questionType,
  options,
  selectedAnswer,
  onAnswerChange,
  isRequired = true,
}: QuestionCardProps) => {
  const handleSingleChoice = useCallback(
    (value: string) => {
      onAnswerChange(value);
    },
    [onAnswerChange],
  );

  const handleMultipleChoice = useCallback(
    (value: string) => {
      const currentAnswers = Array.isArray(selectedAnswer) ? selectedAnswer : [];
      const isSelected = currentAnswers.includes(value);

      if (isSelected) {
        onAnswerChange(currentAnswers.filter((v) => v !== value));
      } else {
        onAnswerChange([...currentAnswers, value]);
      }
    },
    [selectedAnswer, onAnswerChange],
  );

  const handleTextInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onAnswerChange(e.target.value);
    },
    [onAnswerChange],
  );

  const isOptionSelected = useCallback(
    (optionValue: string): boolean => {
      if (Array.isArray(selectedAnswer)) {
        return selectedAnswer.includes(optionValue);
      }
      return selectedAnswer === optionValue;
    },
    [selectedAnswer],
  );

  const renderOptions = () => {
    if (questionType === 'text') {
      return (
        <div className={styles.inputField}>
          <textarea
            className={styles.textInput}
            value={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
            onChange={handleTextInput}
            placeholder="Type your answer here..."
            rows={4}
            aria-required={isRequired}
          />
        </div>
      );
    }

    if (questionType === 'scale') {
      return (
        <div className={`${styles.inputField} ${styles.scaleContainer}`}>
          <ul className={styles.scaleList}>
            {options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className={styles.scaleOption}
                  onClick={() => handleSingleChoice(option.value)}
                  aria-pressed={isOptionSelected(option.value)}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    const isMulti = questionType === 'multiple_choice';

    return (
      <div className={styles.inputField}>
        <ul
          className={`${styles.optionsList} ${isMulti ? styles.optionsListMulti : styles.optionsListSingle}`}
          role={isMulti ? 'group' : 'radiogroup'}
        >
          {options.map((option) => {
            const selected = isOptionSelected(option.value);
            return (
              <li key={option.id}>
                <button
                  type="button"
                  className={styles.optionCard}
                  onClick={() => (isMulti ? handleMultipleChoice(option.value) : handleSingleChoice(option.value))}
                  role={isMulti ? 'checkbox' : 'radio'}
                  aria-checked={selected}
                >
                  <span
                    className={`${styles.optionIndicator} ${isMulti ? styles.indicatorCheckbox : styles.indicatorRadio}`}
                    aria-hidden
                  >
                    {isMulti && selected && <Icon icon={ICON_CHECK_SIMPLE} className={styles.checkmark} />}
                  </span>
                  <span className={styles.optionLabel}>{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <article className={styles.questionCard}>
      <header className={styles.questionHeader}>
        <h2 className={styles.questionText}>{questionText}</h2>
      </header>
      <div className={styles.optionsContainer}>{renderOptions()}</div>
    </article>
  );
};

export default QuestionCard;
