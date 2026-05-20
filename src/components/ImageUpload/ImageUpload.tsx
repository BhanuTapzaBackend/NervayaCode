'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_UPLOAD, ICON_X, ICON_LOADING } from '@/constants/icons';
import { uploadApi } from '@/lib/api/upload';
import styles from './styles.module.css';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  initialUrl?: string;
  label?: string;
  compact?: boolean;
  tone?: 'dark' | 'light';
  onLoadingChange?: (loading: boolean) => void;
}

const ImageUpload = ({
  onUpload,
  initialUrl = '',
  label = 'Upload Image',
  compact = false,
  tone = 'dark',
  onLoadingChange,
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string>(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialUrl) {
      setPreview(initialUrl);
    }
  }, [initialUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // Set immediate client-side preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setLoading(true);
    onLoadingChange?.(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await uploadApi.upload(formData);

      if (data.success && data.data?.url) {
        const imageUrl = data.data.url;
        setPreview(imageUrl); // Update preview with actual Cloudinary URL
        onUpload(imageUrl);
      } else {
        setError(data.message || 'Upload failed');
        // Revert to initial or empty if failed but don't clear if there was an initial URL and we just picked a wrong file
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
      // Clean up the object URL to avoid memory leaks
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview('');
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`${styles.container} ${loading ? styles.uploading : ''} ${compact ? styles.compact : ''} ${tone === 'light' ? styles.light : ''} ${preview ? styles.hasPreview : ''}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Upload image"
    >
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className={styles.input} accept="image/*" />

      {loading ? (
        <Icon icon={ICON_LOADING} width={32} height={32} className={styles.loaderIcon} />
      ) : preview ? (
        <>
          <Image
            src={preview}
            alt="Preview"
            fill
            className={compact ? styles.previewCompact : styles.preview}
            unoptimized
          />
          <button className={styles.removeBtn} onClick={handleRemove} title="Remove image">
            <Icon icon={ICON_X} width={12} height={12} />
          </button>
        </>
      ) : (
        <>
          <Icon icon={ICON_UPLOAD} width={32} height={32} color="var(--color-accent)" />
          <p className={styles.label}>{label}</p>
        </>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default ImageUpload;
