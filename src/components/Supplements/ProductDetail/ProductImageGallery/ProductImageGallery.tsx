'use client';

import React, { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT } from '@/constants/icons';
import { useSwipe } from './useSwipe';
import { trimProductImage, productImageZoomUrl } from '@/lib/utils/cloudinary.util';
import styles from './ProductImageGallery.module.css';

const FALLBACK_IMAGE = '/default-supplement.png';

interface ZoomPosition {
  x: number;
  y: number;
}

interface ProductImageGalleryProps {
  mainImage: string;
  images?: string[];
  discountPercent?: number;
  alt: string;
}

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ mainImage, images = [], discountPercent, alt }) => {
  const allImages = images.length > 0 ? images : [mainImage];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomPosition, setZoomPosition] = useState<ZoomPosition | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

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

  const handleZoomMove = (event: React.MouseEvent<HTMLDivElement>): void => {
    const frame = frameRef.current;
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    setZoomPosition({
      x: clampPercent(((event.clientX - rect.left) / rect.width) * 100),
      y: clampPercent(((event.clientY - rect.top) / rect.height) * 100),
    });
  };

  const clearZoom = (): void => setZoomPosition(null);

  /**
   * Only the cursor position and the source URL can't be known at build time.
   * They're published as custom properties on the stage so the stylesheet owns
   * every dimension, offset and scale that derives from them.
   */
  const zoomVars = zoomPosition
    ? ({
        '--zoom-x': `${zoomPosition.x}%`,
        '--zoom-y': `${zoomPosition.y}%`,
        '--zoom-image': `url("${productImageZoomUrl(currentImage || FALLBACK_IMAGE)}")`,
      } as React.CSSProperties)
    : undefined;

  return (
    <div className={styles.gallery}>
      {hasMultiple && (
        <div className={styles.rail}>
          {allImages.map((src, i) => (
            <button
              key={src ? `${src}-${i}` : `img-${i}`}
              type="button"
              className={`${styles.thumb} ${i === selectedIndex ? styles.thumbActive : ''}`}
              onClick={() => setSelectedIndex(i)}
              onMouseEnter={() => setSelectedIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === selectedIndex}
            >
              <Image
                src={trimProductImage(src || FALLBACK_IMAGE)}
                alt=""
                aria-hidden
                width={128}
                height={128}
                className={styles.thumbImage}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
              />
            </button>
          ))}
        </div>
      )}

      <div className={styles.stage} style={zoomVars}>
        <div
          ref={frameRef}
          className={styles.frame}
          role="group"
          aria-roledescription="carousel"
          aria-label={`${alt} images`}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseMove={handleZoomMove}
          onMouseLeave={clearZoom}
          {...swipeHandlers}
        >
          {discountPercent != null && discountPercent > 0 && (
            <span className={styles.badge}>{Math.round(discountPercent)}% OFF</span>
          )}
          <Image
            key={`${currentImage}-${selectedIndex}`}
            src={trimProductImage(currentImage || FALLBACK_IMAGE)}
            alt={alt}
            fill
            sizes="(max-width: 900px) 100vw, 45vw"
            priority
            className={styles.mainImage}
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />
          {zoomPosition && <span className={styles.lens} aria-hidden />}
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

        {zoomPosition && <div className={styles.zoomPanel} aria-hidden />}
      </div>
    </div>
  );
};

export default ProductImageGallery;
