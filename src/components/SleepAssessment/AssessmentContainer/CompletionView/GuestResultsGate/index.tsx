'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/common/Button';
import styles from './styles.module.css';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface GuestResultsGateProps {
  returnUrl?: string;
}

export function GuestResultsGate({ returnUrl = '/sleep-assessment' }: GuestResultsGateProps) {
  const encoded = encodeURIComponent(returnUrl);
  const signupHref = `/signup?returnUrl=${encoded}`;
  const loginHref = `/login?returnUrl=${encoded}`;

  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/MarkingExamQuestions.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setAnimationData(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={styles.wrapper} aria-labelledby="guest-results-gate-title">
      <article className={styles.card}>
        <div className={styles.lottieFrame} aria-hidden>
          {animationData && (
            <Lottie
              animationData={animationData}
              loop
              autoplay
              rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
            />
          )}
        </div>

        <header className={styles.copy}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden />
            Assessment complete
          </p>
          <h2 id="guest-results-gate-title" className={styles.title}>
            Your sleep results are ready
          </h2>
          <p className={styles.subhead}>
            Create a free account to view your personalised plan, save your results, and unlock your recommended
            programs.
          </p>
        </header>

        <div className={styles.actions}>
          <Button variant="primary" size="lg" href={signupHref} fullWidth className={styles.cta}>
            <span className={styles.ctaLabel}>
              Register to view results
              <span className={styles.ctaArrow} aria-hidden>
                →
              </span>
            </span>
          </Button>

          <p className={styles.loginRow}>
            Already have an account?{' '}
            <Link href={loginHref} className={styles.loginLink}>
              Log in<span aria-hidden> →</span>
            </Link>
          </p>
        </div>

        <p className={styles.reassurance}>
          <span className={styles.reassuranceIcon} aria-hidden>
            ✓
          </span>
          Your answers are saved - registering just unlocks your plan.
        </p>
      </article>
    </section>
  );
}

export default GuestResultsGate;
