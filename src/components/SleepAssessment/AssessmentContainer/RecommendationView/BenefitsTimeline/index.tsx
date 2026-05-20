import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_MOON_SLEEP, ICON_HEADPHONES, ICON_SUN, ICON_ARROW_RIGHT } from '@/constants/icons';
import styles from './styles.module.css';

interface Milestone {
  week: string;
  title: string;
  body: string;
  icon: string;
}

const MILESTONES: Milestone[] = [
  {
    week: 'Week 1',
    title: 'Easier to fall asleep and calmer nights',
    body: 'You may start noticing your mind slowing down at bedtime.',
    icon: ICON_MOON_SLEEP,
  },
  {
    week: 'Week 3',
    title: 'Fewer wake-ups and deeper sleep cycles',
    body: 'You may wake up less often and sleep feels more restorative.',
    icon: ICON_HEADPHONES,
  },
  {
    week: 'Week 6+',
    title: 'More energy, focus and daytime balance',
    body: 'You may feel more refreshed, resilient and mentally clear.',
    icon: ICON_SUN,
  },
];

export function BenefitsTimeline() {
  return (
    <section className={styles.wrap} aria-label="What you may notice over time">
      <div className={styles.content}>
        <h2 className={styles.heading}>Within the first few weeks, users commonly notice:</h2>

        <ol className={styles.timeline}>
          {MILESTONES.map((m, i) => (
            <li key={m.week} className={styles.step}>
              <div className={styles.stepRow}>
                <span className={styles.stepIcon}>
                  <Icon icon={m.icon} aria-hidden />
                </span>
                <div className={styles.stepText}>
                  <p className={styles.stepWeek}>{m.week}</p>
                  <p className={styles.stepTitle}>{m.title}</p>
                </div>
                {i < MILESTONES.length - 1 && (
                  <span className={styles.arrow} aria-hidden>
                    <Icon icon={ICON_ARROW_RIGHT} />
                  </span>
                )}
              </div>
              <p className={styles.stepBody}>{m.body}</p>
            </li>
          ))}
        </ol>

        <p className={styles.footnote}>
          Recovery is unique to everyone. We&apos;ll guide and support you as you progress.
        </p>
      </div>

      <div className={styles.illustration} aria-hidden>
        <Image
          src="/recommendation-page-img.jpg"
          alt=""
          fill
          sizes="(max-width: 900px) 100vw, 280px"
          className={styles.landscapeImg}
        />
      </div>
    </section>
  );
}
