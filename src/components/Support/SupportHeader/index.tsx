import Image from 'next/image';
import styles from './styles.module.css';

const QUICK_FACTS = [
  'We usually reply within a couple of hours',
  'Whatever you share stays between us',
  "You'll always be talking to a real person",
];

const SupportHeader = () => {
  return (
    <header className={styles.hero} aria-label="Support center">
      <div className={styles.backdrop} aria-hidden>
        <Image src="/support-hero.png" alt="" fill priority sizes="100vw" className={styles.backdropImg} />
        <span className={styles.scrim} />
      </div>

      <div className={styles.inner}>
        <div className={styles.kicker}>
          <span className={styles.kickerDot} aria-hidden />
          <span>HELP &amp; SUPPORT</span>
        </div>

        <h1 className={styles.heading}>
          Stuck on something? A real person is <span className={styles.accent}>only a message away.</span>
        </h1>

        <p className={styles.lede}>
          Whether it&apos;s your sleep plan, an order, or simply where to begin - tell us what&apos;s on your mind and
          we&apos;ll help you sort it out, gently and without the runaround.
        </p>

        <ul className={styles.trustbar}>
          {QUICK_FACTS.map((fact) => (
            <li key={fact} className={styles.trustItem}>
              <span className={styles.trustDot} aria-hidden />
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
};

export default SupportHeader;
