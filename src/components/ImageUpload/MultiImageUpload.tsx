'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_UPLOAD, ICON_X, ICON_LOADING } from '@/constants/icons';
import { uploadApi } from '@/lib/api/upload';
import styles from './multiImageUpload.module.css';

interface MultiImageUploadProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  tone?: 'dark' | 'light';
  onLoadingChange?: (loading: boolean) => void;
  maxImages?: number;
}

const MultiImageUpload = ({
  urls,
  onChange,
  label = 'Upload Images',
  tone = 'dark',
  onLoadingChange,
  maxImages = 5,
}: MultiImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxImages - urls.length;
    if (remaining <= 0) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    setUploadCount(filesToUpload.length);
    onLoadingChange?.(true);
    setError(null);

    const newUrls: string[] = [];

    for (const file of filesToUpload) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const data = await uploadApi.upload(formData);
        if (data.success && data.data?.url) {
          newUrls.push(data.data.url);
        }
      } catch {
        // Skip failed uploads silently; partial success is fine
      }
    }

    if (newUrls.length > 0) {
      onChange([...urls, ...newUrls]);
    } else {
      setError('Upload failed. Please try again.');
    }

    setUploading(false);
    setUploadCount(0);
    onLoadingChange?.(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    onChange(urls.filter((_, i) => i !== index));
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`${styles.wrapper} ${tone === 'light' ? styles.light : ''}`}>
      {/* Thumbnail grid */}
      {urls.length > 0 && (
        <div className={styles.grid}>
          {urls.map((url, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={`${url}-${idx}`} className={styles.thumb}>
              <Image src={url} alt={`Image ${idx + 1}`} fill className={styles.thumbImage} unoptimized />
              <button type="button" className={styles.removeBtn} onClick={() => handleRemove(idx)} title="Remove image">
                <Icon icon={ICON_X} width={10} height={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload trigger */}
      {urls.length < maxImages && (
        <div
          className={`${styles.dropzone} ${uploading ? styles.uploading : ''}`}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFilesChange}
            className={styles.input}
            accept="image/*"
            multiple
          />
          {uploading ? (
            <>
              <Icon icon={ICON_LOADING} width={24} height={24} className={styles.loaderIcon} />
              <p className={styles.label}>
                Uploading {uploadCount} image{uploadCount > 1 ? 's' : ''}...
              </p>
            </>
          ) : (
            <>
              <Icon icon={ICON_UPLOAD} width={24} height={24} color="var(--color-accent)" />
              <p className={styles.label}>{label}</p>
              <p className={styles.hint}>
                {urls.length}/{maxImages} images
              </p>
            </>
          )}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default MultiImageUpload;
