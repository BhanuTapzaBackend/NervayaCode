'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './ProductImageGallery.module.css';

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

  return (
    <div className={styles.gallery}>
      <div className={styles.mainWrapper}>
        {discountPercent != null && discountPercent > 0 && (
          <span className={styles.badge}>{Math.round(discountPercent)}% OFF</span>
        )}
        <Image
          src={currentImage || '/default-supplement.png'}
          alt={alt}
          width={500}
          height={500}
          priority
          className={styles.mainImage}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/default-supplement.png';
          }}
        />
      </div>
      {allImages.length > 1 && (
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
                src={src || '/default-supplement.png'}
                alt={`${alt} ${i + 1}`}
                width={80}
                height={80}
                className={styles.thumbImage}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-supplement.png';
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
