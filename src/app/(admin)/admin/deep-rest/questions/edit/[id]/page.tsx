'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ICON_ARROW_LEFT, ICON_ADD, ICON_X, ICON_LOADING } from '@/constants/icons';
import { deepRestQuestionsApi, type DeepRestQuestion } from '@/lib/api/deepRestQuestions';
import { Dropdown } from '@/components/common';
import { GlobalLoader } from '@/components/common/GlobalLoader';
import styles from './styles.module.css';

type QuestionType = 'single_choice' | 'multiple_choice' | 'scale';

interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'scale', label: 'Scale' },
];

export default function EditDeepRestQuestionPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [options, setOptions] = useState<QuestionOption[]>([
    { id: '1', label: '', value: '' },
    { id: '2', label: '', value: '' },
  ]);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const result = await deepRestQuestionsApi.getQuestionById(id);
        if (result.success && result.data) {
          const question = result.data as DeepRestQuestion;
          setFormData({
            questionText: question.questionText,
            questionType: (question.questionType as QuestionType) || 'single_choice',
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
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const validOptions = options.filter((opt) => opt.label.trim());
      const questionType = formData.questionType;
      if (questionType !== 'scale' && validOptions.length < 2) {
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

      const result = await deepRestQuestionsApi.updateQuestion(id, {
        questionText: formData.questionText,
        questionType,
        order: formData.order,
        isRequired: true,
        isActive: true,
        options: optionsWithValue,
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to update question');
      }

      router.push('/admin/deep-rest?tab=questions');
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
          <Link href="/admin/deep-rest?tab=questions" className={styles.backLink}>
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
        <Link href="/admin/deep-rest?tab=questions" className={styles.backLink}>
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
          </div>
        </div>

        {(formData.questionType === 'single_choice' || formData.questionType === 'multiple_choice') && (
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
        )}

        <div className={styles.formActions}>
          <Link href="/admin/deep-rest?tab=questions" className={styles.cancelButton}>
            Cancel
          </Link>
          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
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
