import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_CHAT_DOTS, ICON_USER, ICON_SHIELD_CHECK, ICON_ARROW_RIGHT } from '@/constants/icons';
import styles from './styles.module.css';

interface Step {
  step: string;
  title: string;
  body: string;
  icon: string;
}

const STEPS: Step[] = [
  {
    step: 'Step 1',
    title: 'You reach out',
    body: 'Message us on WhatsApp or book a call - share as much or as little as you like.',
    icon: ICON_CHAT_DOTS,
  },
  {
    step: 'Step 2',
    title: 'A real person responds',
    body: 'A sleep wellness expert reviews your question and replies, usually within two hours.',
    icon: ICON_USER,
  },
  {
    step: 'Step 3',
    title: 'You get clear next steps',
    body: 'Personalized guidance you can act on - no scripts, no pressure, fully confidential.',
    icon: ICON_SHIELD_CHECK,
  },
];

const SupportExpectations = () => {
  return (
    <section className={styles.wrap} aria-label="What happens when you reach out">
      <div className={styles.content}>
        <span className={styles.eyebrow}>WHAT TO EXPECT</span>
        <h2 className={styles.heading}>What happens when you reach out</h2>

        <ol className={styles.timeline}>
          {STEPS.map((s, i) => (
            <li key={s.step} className={styles.step}>
              <div className={styles.stepRow}>
                <span className={styles.stepIcon}>
                  <Icon icon={s.icon} aria-hidden />
                </span>
                <div className={styles.stepText}>
                  <p className={styles.stepLabel}>{s.step}</p>
                  <p className={styles.stepTitle}>{s.title}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <span className={styles.arrow} aria-hidden>
                    <Icon icon={ICON_ARROW_RIGHT} />
                  </span>
                )}
              </div>
              <p className={styles.stepBody}>{s.body}</p>
            </li>
          ))}
        </ol>

        <p className={styles.footnote}>Every conversation is private and handled with care.</p>
      </div>

      <div className={styles.illustration} aria-hidden>
        <Image
          src="/support-help.png"
          alt=""
          fill
          sizes="(max-width: 900px) 100vw, 520px"
          className={styles.illustrationImg}
        />
      </div>
    </section>
  );
};

export default SupportExpectations;
