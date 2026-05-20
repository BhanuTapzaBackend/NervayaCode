'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ICON_LOADING } from '@/constants/icons';
import ImageUpload from '@/components/ImageUpload/ImageUpload';
import { BasicInfoSection } from './BasicInfoSection';
import { CtaSection } from './CtaSection';
import { BlogRecommendationPicker } from '@/components/Admin/BlogRecommendationPicker';
import { ContentEditor } from './ContentEditor';
import { SeoSection } from './SeoSection';
import { TagInput } from './TagInput';
import styles from './styles.module.css';

export interface BlogFormState {
  title: string;
  description: string;
  author: string;
  coverImage: string;
  metaTitle: string;
  metaDescription: string;
  metaImage: string;
  ctaText: string;
  ctaLink: string;
  isPublished: boolean;
}

interface BlogFormProps {
  formData: BlogFormState;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  content: string;
  onContentChange: (value: string) => void;
  tags: string[];
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onTagKeyDown: (e: React.KeyboardEvent) => void;
  onImageUpload: (url: string) => void;
  onImageLoadingChange?: (loading: boolean) => void;
  onMetaImageUpload: (url: string) => void;
  recommendedBlogs: string[];
  onRecommendedChange: (ids: string[]) => void;
  currentBlogId?: string;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  submitLabel: string;
  error: string | null;
  showPublished?: boolean;
}

export default function BlogForm({
  formData,
  onInputChange,
  content,
  onContentChange,
  tags,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onTagKeyDown,
  onImageUpload,
  onImageLoadingChange,
  onMetaImageUpload,
  recommendedBlogs,
  onRecommendedChange,
  currentBlogId,
  onSubmit,
  isSubmitting,
  submitLabel,
  error,
  showPublished = false,
}: BlogFormProps) {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      {error && (
        <div className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}

      <BasicInfoSection
        title={formData.title}
        author={formData.author}
        description={formData.description}
        onInputChange={onInputChange}
      />

      {/* Row 3: Cover Image + Tags + Published */}
      <div className={styles.metaRow}>
        <div className={styles.metaBlock}>
          <label className={styles.label}>Cover Image</label>
          <ImageUpload
            onUpload={onImageUpload}
            onLoadingChange={onImageLoadingChange}
            initialUrl={formData.coverImage}
            label="Upload Cover"
            compact
            tone="light"
          />
        </div>
        <div className={styles.metaBlock}>
          <label className={styles.label}>Tags</label>
          <TagInput
            tags={tags}
            tagInput={tagInput}
            onTagInputChange={onTagInputChange}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
            onTagKeyDown={onTagKeyDown}
          />
          {showPublished && (
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={onInputChange}
                className={styles.checkbox}
              />
              <span>Published</span>
            </label>
          )}
        </div>
      </div>

      {/* Row 4: Recommended Blogs */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Recommended Blogs</label>
        <BlogRecommendationPicker
          selectedIds={recommendedBlogs}
          onChange={onRecommendedChange}
          currentBlogId={currentBlogId}
        />
      </div>

      {/* Row 5: Content Editor (full width) */}
      <ContentEditor content={content} onChange={onContentChange} />

      {/* Row 6: CTA Settings */}
      <CtaSection ctaText={formData.ctaText} ctaLink={formData.ctaLink} onInputChange={onInputChange} />

      {/* Row 7: SEO Settings (collapsible) */}
      <SeoSection
        metaTitle={formData.metaTitle}
        metaDescription={formData.metaDescription}
        metaImage={formData.metaImage}
        blogTitle={formData.title}
        blogDescription={formData.description}
        coverImage={formData.coverImage}
        onInputChange={onInputChange}
        onMetaImageUpload={onMetaImageUpload}
      />

      <div className={styles.formActions}>
        <Link href="/admin/blogs" className={styles.cancelButton}>
          Cancel
        </Link>
        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Icon icon={ICON_LOADING} className={styles.loaderIcon} />
              {submitLabel.replace(' Blog', 'ing...')}
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
