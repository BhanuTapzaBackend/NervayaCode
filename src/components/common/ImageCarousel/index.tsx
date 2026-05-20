'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './styles.module.css';

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  /** Continuous right-to-left marquee of all images; pauses on hover. */
  autoScroll?: boolean;
}

export function ImageCarousel({ images, alt = 'Gallery image', autoScroll = false }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);

  if (!images || images.length === 0) return null;

  if (autoScroll) {
    return (
      <div className={styles.marqueeViewport} aria-label={alt}>
        <div className={styles.marqueeTrack}>
          {[0, 1].map((group) => (
            <div className={styles.marqueeGroup} key={group} aria-hidden={group === 1}>
              {images.map((src, i) => (
                <div className={styles.slide} key={`${group}-${src}`}>
                  <Image src={src} alt={`${alt} ${i + 1}`} fill sizes="320px" className={styles.slideImg} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(index, images.length - 1);
  const current = images[safeIndex];

  return (
    <div className={styles.carousel}>
      <div className={styles.viewport}>
        <div className={styles.backdrop} style={{ backgroundImage: `url(${current})` }} aria-hidden />
        <Image
          src={current}
          alt={`${alt} ${safeIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={styles.image}
        />
      </div>
      {images.length > 1 && (
        <div className={styles.dots} role="tablist" aria-label="Gallery navigation">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              aria-label={`Show image ${i + 1}`}
              className={`${styles.dot} ${i === safeIndex ? styles.dotActive : ''}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageCarousel;
