'use client';

import Link from 'next/link';
import type { ISleepAssessmentResponse } from '@/types/sleepAssessment.types';
import { getSleepAssessmentResult, getSleepScoreLabel } from '@/lib/utils/sleepScore.util';
import styles from './SleepScoreSection.module.css';

interface SleepScoreSectionProps {
  latestAssessment: ISleepAssessmentResponse | null;
  loading?: boolean;
}

export function SleepScoreSection({ latestAssessment, loading = false }: SleepScoreSectionProps) {
  const hasCompletedAssessment = Boolean(latestAssessment?.completedAt);
  if (!hasCompletedAssessment && !loading) return null;

  const result = loading ? null : getSleepAssessmentResult(latestAssessment);
  const scoreLabel = loading ? '—' : getSleepScoreLabel(latestAssessment);

  return (
    <section className={styles.section} aria-labelledby="sleep-score-heading">
      <div className={styles.scoreRow}>
        <span className={styles.scoreLabel} id="sleep-score-heading">
          Your Sleep Quality Score:
        </span>
        <span className={styles.scoreBadge}>{scoreLabel}</span>
      </div>

      {result?.explanation && <p className={styles.explanation}>{result.explanation}</p>}

      {result?.recommendations?.length ? (
        <div className={styles.sectionBlock}>
          <h2 className={styles.sectionHeading}>Recommended next steps</h2>
          <ul className={styles.cardGrid} aria-label="Recommended next steps">
            {result.recommendations.slice(0, 3).map((card) => (
              <li key={`${card.key}-${card.priority}`} className={styles.card}>
                <span className={styles.priorityBadge}>{card.priority === 'primary' ? 'Priority' : 'Support'}</span>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardDescription}>{card.description}</p>
                <Link href={card.href} className={styles.cardButton}>
                  {card.buttonText}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.actions}>
        <Link href="/sleep-assessment" className={styles.primaryLink}>
          View full results
        </Link>
      </div>
    </section>
  );
}
