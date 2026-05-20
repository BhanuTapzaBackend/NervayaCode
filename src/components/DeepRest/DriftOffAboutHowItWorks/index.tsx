import styles from './styles.module.css';

interface DriftOffAboutHowItWorksProps {
  sectionTitle?: string;
  sectionTitleId?: string;
}

const STEPS = [
  {
    id: 1,
    title: 'Calming Your Mind',
    description:
      'Our session uses gentle guidance and soothing sounds to help racing thoughts slow down, creating a peaceful mental state.',
  },
  {
    id: 2,
    title: 'Relaxing Your Body',
    description:
      'Through progressive techniques and calming frequencies, your body naturally begins to release tension and prepare for deep rest.',
  },
  {
    id: 3,
    title: 'Achieving Deep Rest',
    description:
      'As your mind becomes calmer and body more relaxed, you naturally drift into restorative sleep that leaves you feeling refreshed.',
  },
] as const;

const SESSION_CONTENTS = [
  'Gentle Relaxation — Soft guidance helps your body loosen up and feel at ease',
  'Slow Breathing — Controlled breathing helps your thoughts slow down',
  'Gentle Hypnotic Guidance — Helps your mind into deep relaxation',
  'Simple Imagery — Light imagery helps move attention away from stress',
  'Familiar Phrases — Words are repeated as affirmations built over time',
] as const;

const DriftOffAboutHowItWorks = ({
  sectionTitle = 'How Deep Rest Sessions Work',
  sectionTitleId,
}: DriftOffAboutHowItWorksProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.stepsCol}>
        {sectionTitle && (
          <h2 id={sectionTitleId} className={styles.sectionTitle}>
            {sectionTitle}
          </h2>
        )}
        <ol className={styles.stepsList} aria-label="How Deep Rest Sessions work">
          {STEPS.map((step) => (
            <li key={step.id} className={styles.stepItem}>
              <div className={styles.stepNumber} aria-hidden>
                {step.id}
              </div>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className={styles.sessionCard}>
        <p className={styles.sessionCardLabel}>What goes into a</p>
        <h3 className={styles.sessionCardTitle}>Deep Rest Session</h3>
        <ul className={styles.sessionContentList} aria-label="Session contents">
          {SESSION_CONTENTS.map((item) => (
            <li key={item} className={styles.sessionContentItem}>
              <span className={styles.bullet} aria-hidden>
                ●
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DriftOffAboutHowItWorks;
