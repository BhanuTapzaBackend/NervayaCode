'use client';

import React, { useCallback, useState } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT } from '@/constants/icons';
import { useSwipe } from './useSwipe';
import styles from './ProductImageGallery.module.css';

const FALLBACK_IMAGE = '/default-supplement.png';

interface ProductImageGalleryProps {
  mainImage: string;
  images?: string[];
  discountPercent?: number;
  alt: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ mainImage, images = [], discountPercent, alt }) => {
  const allImages = images.length > 0 ? images : [mainImage];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentImage = allImages[selectedIndex] || mainImage;
  const hasMultiple = allImages.length > 1;

  const step = useCallback(
    (direction: number): void => {
      setSelectedIndex((prev) => (prev + direction + allImages.length) % allImages.length);
    },
    [allImages.length],
  );

  const goNext = useCallback((): void => step(1), [step]);
  const goPrev = useCallback((): void => step(-1), [step]);

  const swipeHandlers = useSwipe(goNext, goPrev);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!hasMultiple) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
    }
  };

  return (
    <div className={styles.gallery}>
      <div
        className={styles.mainWrapper}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${alt} images`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        {...swipeHandlers}
      >
        <Image src={currentImage || FALLBACK_IMAGE} alt="" aria-hidden fill sizes="64px" className={styles.backdrop} />
        {discountPercent != null && discountPercent > 0 && (
          <span className={styles.badge}>{Math.round(discountPercent)}% OFF</span>
        )}
        <Image
          key={`${currentImage}-${selectedIndex}`}
          src={currentImage || FALLBACK_IMAGE}
          alt={alt}
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          priority
          className={styles.mainImage}
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
        />
        {hasMultiple && (
          <>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowPrev}`}
              onClick={goPrev}
              aria-label="Previous image"
            >
              <Icon icon={ICON_CHEVRON_LEFT} width={22} height={22} aria-hidden />
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowNext}`}
              onClick={goNext}
              aria-label="Next image"
            >
              <Icon icon={ICON_CHEVRON_RIGHT} width={22} height={22} aria-hidden />
            </button>
            <div className={styles.dots} role="tablist" aria-label="Gallery navigation">
              {allImages.map((src, i) => (
                <button
                  key={src ? `dot-${src}-${i}` : `dot-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={i === selectedIndex}
                  aria-label={`Show image ${i + 1}`}
                  className={`${styles.dot} ${i === selectedIndex ? styles.dotActive : ''}`}
                  onClick={() => setSelectedIndex(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {hasMultiple && (
        <div className={styles.thumbnails}>
          {allImages.map((src, i) => (
            <button
              key={src ? `${src}-${i}` : `img-${i}`}
              type="button"
              className={`${styles.thumb} ${i === selectedIndex ? styles.active : ''}`}
              onClick={() => setSelectedIndex(i)}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={src || FALLBACK_IMAGE}
                alt={`${alt} ${i + 1}`}
                width={80}
                height={80}
                className={styles.thumbImage}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
