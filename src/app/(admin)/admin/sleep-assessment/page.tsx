'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ICON_ADD, ICON_DOCUMENT, ICON_ARROW_LEFT, ICON_ARROW_RIGHT } from '@/constants/icons';
import { sleepAssessmentApi } from '@/lib/api/sleepAssessment';
import { GlobalLoader } from '@/components/common';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import styles from './styles.module.css';
import type { ISleepAssessmentQuestion } from '@/types/sleepAssessment.types';

export default function AdminSleepAssessmentPage() {
  const [questions, setQuestions] = useState<ISleepAssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; text: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const fetchQuestions = useCallback(async () => {
    try {
      const result = await sleepAssessmentApi.getQuestions(true);
      if (result.success && result.data) {
        setQuestions(result.data as ISleepAssessmentQuestion[]);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (questions.length > 0 && currentIndex >= questions.length) {
      setCurrentIndex(questions.length - 1);
    }
  }, [questions.length, currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1 && !isAnimating) {
      setDirection('next');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsAnimating(false);
      }, 300);
    }
  }, [currentIndex, questions.length, isAnimating]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0 && !isAnimating) {
      setDirection('prev');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => prev - 1);
        setIsAnimating(false);
      }, 300);
    }
  }, [currentIndex, isAnimating]);

  const goToIndex = useCallback(
    (index: number) => {
      if (index !== currentIndex && !isAnimating) {
        setDirection(index > currentIndex ? 'next' : 'prev');
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentIndex(index);
          setIsAnimating(false);
        }, 300);
      }
    },
    [currentIndex, isAnimating],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating || questions.length === 0) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnimating, questions.length, goToNext, goToPrev]);

  const handleDeleteClick = (id: string, questionText: string) => {
    setDeleteConfirmation({ id, text: questionText });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    setDeleting(true);
    try {
      const result = await sleepAssessmentApi.deleteQuestion(deleteConfirmation.id);
      if (result.success) {
        fetchQuestions();
        setDeleteConfirmation(null);
      }
    } catch {
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    if (!deleting) {
      setDeleteConfirmation(null);
    }
  };

  useModalDismiss(!!deleteConfirmation, deleteModalRef, cancelDelete);

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      single_choice: 'Single Choice',
      multiple_choice: 'Multiple Choice',
      text: 'Text Input',
      scale: 'Scale',
    };
    return labels[type] || type;
  };

  const currentQuestion = questions[currentIndex];

  if (loading) {
    return (
      <div className={styles.container}>
        <GlobalLoader label="Loading questions..." />
      </div>
    );
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.topActions}>
        <Link href="/admin/sleep-assessment/add" className={styles.addButton}>
          <Icon icon={ICON_ADD} aria-hidden />
          Add Question
        </Link>
      </div>{' '}
      {questions.length === 0 ? (
        <div className={styles.emptyState}>
          <Icon icon={ICON_DOCUMENT} aria-hidden />
          <h3>No Questions Yet</h3>
          <p>Create your first assessment question to get started.</p>
          <Link href="/admin/sleep-assessment/add" className={styles.addButton}>
            Add Question
          </Link>
        </div>
      ) : (
        <div className={styles.carouselContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                ['--progress' as string]: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>

          <div className={styles.questionCounter}>
            <span className={styles.currentNum}>{currentIndex + 1}</span>
            <span className={styles.separator}>/</span>
            <span className={styles.totalNum}>{questions.length}</span>
          </div>

          <div className={styles.carouselRow}>
            <button
              type="button"
              className={`${styles.navButton} ${styles.navPrev}`}
              onClick={goToPrev}
              disabled={currentIndex === 0 || isAnimating}
              aria-label="Previous question"
            >
              <Icon icon={ICON_ARROW_LEFT} aria-hidden />
            </button>

            <div className={styles.cardViewport}>
              <div
                className={`${styles.questionCard} ${styles.cardAnimated} ${
                  isAnimating ? (direction === 'next' ? styles.slideOutLeft : styles.slideOutRight) : styles.slideIn
                }`}
                key={currentQuestion._id}
              >
                <div className={styles.questionHeader}>
                  <span className={styles.orderBadge}>{currentQuestion.order}</span>
                  <div className={styles.questionMeta}>
                    <span className={`${styles.typeBadge} ${styles[currentQuestion.questionType]}`}>
                      {getQuestionTypeLabel(currentQuestion.questionType)}
                    </span>
                  </div>
                </div>

                <div className={styles.questionContent}>
                  <h3 className={styles.questionText}>{currentQuestion.questionText}</h3>

                  {currentQuestion.options && currentQuestion.options.length > 0 && (
                    <div className={styles.optionsPreview}>
                      <span className={styles.optionsLabel}>Options:</span>
                      <ul className={styles.optionsList}>
                        {currentQuestion.options.map((opt) => (
                          <li key={opt.id} className={styles.optionItem}>
                            {opt.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className={styles.questionActions}>
                  <Link
                    href={`/admin/sleep-assessment/edit/${currentQuestion.questionId}`}
                    className={styles.editButton}
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => handleDeleteClick(currentQuestion.questionId, currentQuestion.questionText)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              className={`${styles.navButton} ${styles.navNext}`}
              onClick={goToNext}
              disabled={currentIndex === questions.length - 1 || isAnimating}
              aria-label="Next question"
            >
              <Icon icon={ICON_ARROW_RIGHT} aria-hidden />
            </button>
          </div>

          <div className={styles.dotIndicators}>
            {questions.map((q, index) => (
              <button
                key={q._id}
                type="button"
                className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ''}`}
                onClick={() => goToIndex(index)}
                aria-label={`Go to question ${index + 1}`}
              />
            ))}
          </div>

          <p className={styles.keyboardHint}>
            Use <kbd>←</kbd> <kbd>→</kbd> arrow keys to navigate
          </p>
        </div>
      )}
      {deleteConfirmation && (
        <div className={styles.modalOverlay}>
          <div ref={deleteModalRef} className={styles.modal} role="dialog" aria-modal="true">
            <h3 className={styles.modalTitle}>Delete Question</h3>
            <p className={styles.modalMessage}>
              Are you sure you want to delete this question?
              <br />
              <br />
              &quot;{deleteConfirmation.text.substring(0, 50)}
              {deleteConfirmation.text.length > 50 ? '...' : ''}&quot;
              <br />
              <br />
              This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button type="button" className={`${styles.modalButton} ${styles.cancelButton}`} onClick={cancelDelete}>
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.modalButton} ${styles.confirmButton}`}
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
