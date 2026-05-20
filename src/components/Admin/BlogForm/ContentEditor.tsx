'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { quillModules, quillFormats } from '@/lib/constants/blogEditor.constants';
import 'react-quill-new/dist/quill.snow.css';
import styles from './styles.module.css';

interface ContentEditorProps {
  content: string;
  onChange: (value: string) => void;
}

export function ContentEditor({ content, onChange }: ContentEditorProps) {
  const ReactQuill = useMemo(
    () =>
      dynamic(() => import('react-quill-new'), {
        ssr: false,
        loading: () => <div className={styles.editorLoading}>Loading editor...</div>,
      }) as typeof import('react-quill-new').default,
    [],
  );

  return (
    <div className={styles.formGroup}>
      <label className={styles.label}>
        Content <span className={styles.required}>*</span>
      </label>
      <p className={styles.contentTip}>
        <strong>Tip:</strong> Press <kbd>Enter</kbd> for a new paragraph. Keep paragraphs short (3–5 sentences).
      </p>
      <div className={styles.editorWrapper}>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={onChange}
          modules={quillModules}
          formats={quillFormats}
          placeholder="Write your blog content..."
          className={styles.editor}
        />
      </div>
    </div>
  );
}
