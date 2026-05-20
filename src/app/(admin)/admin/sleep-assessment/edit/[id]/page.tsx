'use client';

import { useState, useEffect, useMemo, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ICON_ARROW_LEFT, ICON_ADD, ICON_X, ICON_LOADING } from '@/constants/icons';
import { sleepAssessmentApi } from '@/lib/api/sleepAssessment';
import { Dropdown } from '@/components/common';
import { GlobalLoader } from '@/components/common/GlobalLoader';
import styles from './styles.module.css';
import type { IQuestionOption, QuestionType, ISleepAssessmentQuestion } from '@/types/sleepAssessment.types';

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'single_choice', label: 'Single Choice — user picks one option' },
  { value: 'multiple_choice', label: 'Multiple Choice — user picks one or more' },
  { value: 'scale', label: 'Scale — numeric rating (1–5 / 1–10)' },
];

const QUESTION_TYPE_HINTS: Record<QuestionType, string> = {
  single_choice: 'Renders as radio buttons. User can choose exactly one option.',
  multiple_choice: 'Renders as checkboxes. User can select any number of options.',
  scale: 'Renders as a row of numeric pills for quick rating.',
  text: '',
};

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    questionText: '',
    questionType: 'single_choice' as QuestionType,
    order: 1,
  });

  const nextOptionId = useRef(0);
  const [options, setOptions] = useState<IQuestionOption[]>([
    { id: '1', label: '', value: '' },
    { id: '2', label: '', value: '' },
  ]);

  const [usedOrders, setUsedOrders] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await sleepAssessmentApi.getQuestions(true);
        if (result.success && result.data) {
          const orders = result.data.filter((q) => q._id !== id).map((q) => q.order);
          setUsedOrders(new Set(orders));
        }
      } catch {}
    };
    fetchOrders();
  }, [id]);

  const isOrderDuplicate = useMemo(() => {
    return usedOrders.has(Number(formData.order));
  }, [formData.order, usedOrders]);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const result = await sleepAssessmentApi.getQuestionById(id);
        if (result.success && result.data) {
          const question = result.data as ISleepAssessmentQuestion;
          setFormData({
            questionText: question.questionText,
            questionType: question.questionType,
            order: question.order,
          });
          if (question.options && question.options.length > 0) {
            setOptions(question.options);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load question');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestion();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => {
      const newOptions = [...prev];
      const slug =
        value
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '') || `opt_${index + 1}`;
      newOptions[index] = { ...newOptions[index], label: value, value: slug };
      return newOptions;
    });
  };

  const addOption = () => {
    setOptions((prev) => [...prev, { id: String(++nextOptionId.current), label: '', value: '' }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      return;
    }
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (isOrderDuplicate) {
      setError(`Display Order ${formData.order} is already in use. Please choose a different number.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const validOptions = options.filter((opt) => opt.label.trim());
      const questionType = formData.questionType === 'text' ? 'single_choice' : formData.questionType;
      if (validOptions.length < 2) {
        throw new Error('Please add at least 2 options');
      }

      const optionsWithValue = validOptions.map((opt, i) => ({
        id: String(i + 1),
        label: opt.label.trim(),
        value:
          opt.value ||
          opt.label
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '') ||
          `opt_${i + 1}`,
      }));

      const result = await sleepAssessmentApi.updateQuestion(id, {
        questionText: formData.questionText,
        questionType,
        order: formData.order,
        isRequired: true,
        isActive: true,
        options: optionsWithValue.map((o) => ({ id: o.id, value: o.value || o.label, label: o.label })),
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to update question');
      }

      router.push('/admin/sleep-assessment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.topActions}>
          <Link href="/admin/sleep-assessment" className={styles.backLink}>
            <Icon icon={ICON_ARROW_LEFT} aria-hidden />
            Back to Questions
          </Link>
        </div>
        <GlobalLoader label="Loading question details..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.topActions}>
        <Link href="/admin/sleep-assessment" className={styles.backLink}>
          <Icon icon={ICON_ARROW_LEFT} aria-hidden />
          Back to Questions
        </Link>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.errorMessage} role="alert">
            {error}
          </div>
        )}

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="order" className={styles.label}>
              Display Order
              <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              id="order"
              name="order"
              value={formData.order}
              onChange={handleInputChange}
              className={styles.input}
              min="1"
              required
            />
            {isOrderDuplicate && <span className={styles.orderWarning}>This order is already taken</span>}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="questionText" className={styles.label}>
            Question Text
            <span className={styles.required}>*</span>
          </label>
          <textarea
            id="questionText"
            name="questionText"
            value={formData.questionText}
            onChange={handleInputChange}
            className={styles.textarea}
            placeholder="Enter the question text..."
            rows={3}
            required
          />
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="questionType" className={styles.label}>
              Question Type
              <span className={styles.required}>*</span>
            </label>
            <Dropdown
              id="questionType"
              options={QUESTION_TYPE_OPTIONS}
              value={formData.questionType}
              onChange={(value) => setFormData((prev) => ({ ...prev, questionType: value as QuestionType }))}
              ariaLabel="Question type"
              className={styles.select}
            />
            {QUESTION_TYPE_HINTS[formData.questionType] && (
              <span className={styles.fieldHint}>{QUESTION_TYPE_HINTS[formData.questionType]}</span>
            )}
          </div>
        </div>

        <div className={styles.optionsSection}>
          <div className={styles.optionsHeader}>
            <h3 className={styles.optionsTitle}>Options</h3>
            <button type="button" onClick={addOption} className={styles.addOptionButton}>
              <Icon icon={ICON_ADD} aria-hidden />
              Add Option
            </button>
          </div>

          <ul className={styles.optionsList}>
            {options.map((option, index) => (
              <li key={option.id || `option-${index}`} className={styles.optionItem}>
                <span className={styles.optionNumber}>{index + 1}</span>
                <div className={styles.optionInputs}>
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className={styles.input}
                    placeholder="Option"
                    required
                  />
                </div>
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className={styles.removeOptionButton}
                    aria-label="Remove option"
                  >
                    <Icon icon={ICON_X} aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.formActions}>
          <Link href="/admin/sleep-assessment" className={styles.cancelButton}>
            Cancel
          </Link>
          <button type="submit" className={styles.submitButton} disabled={isSubmitting || isOrderDuplicate}>
            {isSubmitting ? (
              <>
                <Icon icon={ICON_LOADING} className={styles.loaderIcon} />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
