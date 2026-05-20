'use client';

import { Icon } from '@iconify/react';
import { ICON_ADD, ICON_X } from '@/constants/icons';
import styles from './styles.module.css';

interface TagInputProps {
  tags: string[];
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onTagKeyDown: (e: React.KeyboardEvent) => void;
}

export function TagInput({ tags, tagInput, onTagInputChange, onAddTag, onRemoveTag, onTagKeyDown }: TagInputProps) {
  return (
    <>
      <div className={styles.tagInputWrapper}>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => onTagInputChange(e.target.value)}
          onKeyDown={onTagKeyDown}
          className={styles.input}
          placeholder="Add a tag..."
        />
        <button type="button" onClick={onAddTag} className={styles.addTagButton}>
          <Icon icon={ICON_ADD} width={20} height={20} />
        </button>
      </div>
      {tags.length > 0 && (
        <ul className={styles.tagsList}>
          {tags.map((tag) => (
            <li key={tag} className={styles.tag}>
              {tag}
              <button type="button" onClick={() => onRemoveTag(tag)} className={styles.removeTagButton}>
                <Icon icon={ICON_X} width={16} height={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
