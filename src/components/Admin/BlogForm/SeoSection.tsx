'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import ImageUpload from '@/components/ImageUpload/ImageUpload';
import styles from './styles.module.css';

interface SeoSectionProps {
  metaTitle: string;
  metaDescription: string;
  metaImage: string;
  blogTitle: string;
  blogDescription: string;
  coverImage: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onMetaImageUpload: (url: string) => void;
}

export function SeoSection({
  metaTitle,
  metaDescription,
  metaImage,
  blogTitle,
  blogDescription,
  coverImage,
  onInputChange,
  onMetaImageUpload,
}: SeoSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const previewTitle = metaTitle || blogTitle || 'Blog Title';
  const previewDesc = metaDescription || blogDescription || 'Blog description will appear here...';
  const previewImage = metaImage || coverImage;

  return (
    <div className={styles.seoSection}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className={styles.seoToggle}>
        <div className={styles.seoToggleLeft}>
          <Icon icon="solar:magnifer-bold" width={18} height={18} />
          <span>SEO Settings</span>
        </div>
        <Icon icon={isOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'} width={18} height={18} />
      </button>

      {isOpen && (
        <div className={styles.seoContent}>
          <div className={styles.seoPreview}>
            <p className={styles.seoPreviewLabel}>Search preview</p>
            <div className={styles.seoPreviewCard}>
              {previewImage && (
                <div className={styles.seoPreviewImage}>
                  <Image src={previewImage} alt="" fill className={styles.seoPreviewImg} />
                </div>
              )}
              <div className={styles.seoPreviewText}>
                <p className={styles.seoPreviewTitle}>{previewTitle}</p>
                <p className={styles.seoPreviewDesc}>{previewDesc}</p>
              </div>
            </div>
          </div>

          <div className={styles.seoFields}>
            <div className={styles.formGroup}>
              <label htmlFor="metaTitle" className={styles.label}>
                Meta Title
              </label>
              <input
                type="text"
                id="metaTitle"
                name="metaTitle"
                value={metaTitle}
                onChange={onInputChange}
                className={styles.input}
                placeholder={blogTitle || 'Defaults to blog title...'}
                maxLength={120}
              />
              <span className={styles.charCount}>{metaTitle.length}/120</span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="metaDescription" className={styles.label}>
                Meta Description
              </label>
              <textarea
                id="metaDescription"
                name="metaDescription"
                value={metaDescription}
                onChange={onInputChange}
                className={styles.textarea}
                placeholder={blogDescription || 'Defaults to blog description...'}
                maxLength={320}
                rows={3}
              />
              <span className={styles.charCount}>{metaDescription.length}/320</span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>OG Image</label>
              <p className={styles.seoHint}>Recommended: 1200x630px. Defaults to cover image if empty.</p>
              <ImageUpload
                onUpload={onMetaImageUpload}
                initialUrl={metaImage}
                label="Upload OG Image"
                compact
                tone="light"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
