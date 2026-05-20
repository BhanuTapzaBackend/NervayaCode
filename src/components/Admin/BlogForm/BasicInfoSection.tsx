'use client';

import styles from './styles.module.css';

interface BasicInfoSectionProps {
  title: string;
  author: string;
  description: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function BasicInfoSection({ title, author, description, onInputChange }: BasicInfoSectionProps) {
  return (
    <>
      {/* Row 1: Title + Author */}
      <div className={styles.fieldRow}>
        <div className={styles.fieldRowMain}>
          <label htmlFor="title" className={styles.label}>
            Title <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={onInputChange}
            className={styles.input}
            placeholder="Enter blog title..."
            required
          />
        </div>
        <div className={styles.fieldRowSide}>
          <label htmlFor="author" className={styles.label}>
            Author <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="author"
            name="author"
            value={author}
            onChange={onInputChange}
            className={styles.input}
            placeholder="Author name..."
            required
          />
        </div>
      </div>

      {/* Row 2: Description */}
      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={onInputChange}
          className={styles.textarea}
          placeholder="A short summary of the blog post (max 500 characters)..."
          maxLength={500}
          rows={3}
        />
        <span className={styles.charCount}>{description.length}/500</span>
      </div>
    </>
  );
}
