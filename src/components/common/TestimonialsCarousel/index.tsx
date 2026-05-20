'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Icon } from '@iconify/react';
import { ICON_STAR } from '@/constants/icons';
import styles from './styles.module.css';

export interface TestimonialItem {
  id?: string;
  name: string;
  rating: number;
  comment: string;
  initials: string;
}

interface TestimonialsCarouselProps {
  reviews: TestimonialItem[];
  title?: string;
  /** Continuous right-to-left marquee of all reviews; pauses on hover. */
  autoScroll?: boolean;
}

export function TestimonialsCarousel({ reviews, title, autoScroll = false }: TestimonialsCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dotCount, setDotCount] = useState(reviews.length);

  // Read the actual flex `gap` from the track's computed style so the
  // scroll math stays accurate when the gap changes at breakpoints
  // (e.g. mobile uses var(--space-3) = 8px, desktop var(--space-5) = 16px).
  const getStep = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    const cardEl = track.querySelector('[data-card]') as HTMLElement | null;
    if (!cardEl) return 0;
    const cs = getComputedStyle(track);
    const gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;
    return cardEl.clientWidth + gap;
  }, []);

  const updateDotCount = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const step = getStep();
    if (!step) return;
    const visible = Math.max(1, Math.round(track.clientWidth / step));
    setDotCount(Math.max(1, reviews.length - visible + 1));
  }, [reviews.length, getStep]);

  const updateActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const step = getStep();
    if (!step) return;
    setActiveIndex(Math.round(track.scrollLeft / step));
  }, [getStep]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const step = getStep();
      if (!step) return;
      track.scrollTo({ left: index * step, behavior: 'smooth' });
    },
    [getStep],
  );

  const scrollNext = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const step = getStep();
    if (!step) return;
    const maxScroll = track.scrollWidth - track.clientWidth;

    if (track.scrollLeft >= maxScroll - 2) {
      track.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      track.scrollBy({ left: step, behavior: 'smooth' });
    }
  }, [getStep]);

  useEffect(() => {
    updateDotCount();
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(() => {
      updateDotCount();
      const step = getStep();
      if (!step) return;
      track.scrollTo({ left: activeIndex * step, behavior: 'auto' });
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, [updateDotCount, activeIndex, getStep]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener('scroll', updateActiveIndex, { passive: true });
    return () => track.removeEventListener('scroll', updateActiveIndex);
  }, [updateActiveIndex]);

  useEffect(() => {
    if (reviews.length <= 1 || isPaused || autoScroll) return;
    const interval = setInterval(scrollNext, 4000);
    return () => clearInterval(interval);
  }, [reviews.length, isPaused, autoScroll, scrollNext]);

  if (reviews.length === 0) return null;

  const cardBody = (review: TestimonialItem) => (
    <>
      <div className={styles.userRow}>
        <div className={styles.avatar}>{review.initials}</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{review.name}</span>
          <div className={styles.stars}>
            {Array.from({ length: 5 }, (_, i) => (
              <Icon
                key={i}
                icon={ICON_STAR}
                width={14}
                height={14}
                className={i < review.rating ? styles.starFilled : styles.starEmpty}
              />
            ))}
          </div>
        </div>
      </div>
      <p className={styles.comment}>&ldquo;{review.comment}&rdquo;</p>
    </>
  );

  if (autoScroll) {
    return (
      <section className={styles.section}>
        {title && <h2 className={styles.title}>{title}</h2>}
        <div className={styles.marqueeViewport} aria-label={title ?? 'Testimonials'}>
          <div className={styles.marqueeTrack}>
            {[0, 1].map((group) => (
              <div className={styles.marqueeGroup} key={group} aria-hidden={group === 1}>
                {reviews.map((review, idx) => (
                  <div key={`g${group}-${review.id ?? idx}`} className={styles.card} data-card>
                    {cardBody(review)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      {title && <h2 className={styles.title}>{title}</h2>}
      <ul
        className={styles.track}
        ref={trackRef}
        aria-label={title ?? 'Testimonials'}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {reviews.map((review, idx) => (
          <li key={review.id ?? `testimonial-${idx}`} className={styles.card} data-card>
            {cardBody(review)}
          </li>
        ))}
      </ul>

      {reviews.length > 1 && (
        <ul className={styles.dots} aria-label="Testimonial pagination">
          {Array.from({ length: dotCount }, (_, i) => (
            <li key={i}>
              <button
                className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
