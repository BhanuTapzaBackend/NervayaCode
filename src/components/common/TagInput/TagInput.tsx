'use client';

import { useState, KeyboardEvent } from 'react';
import { Icon } from '@iconify/react';
import { ICON_X } from '@/constants/icons';
import styles from './TagInput.module.css';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  id?: string;
}

export default function TagInput({ tags, onChange, placeholder = 'Press enter to add tags', id }: TagInputProps) {
  const [input, setInput] = useState('');

  const addTag = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      return true;
    }
    return false;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (addTag(input)) {
      setInput('');
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    const newTags = paste
      .split(/[,|\n]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag && !tags.includes(tag));

    if (newTags.length > 0) {
      onChange([...tags, ...newTags]);
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.container}>
      <div className={styles.tagList}>
        {tags.map((tag) => (
          <span key={tag} className={styles.tag}>
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tags.indexOf(tag))}
              className={styles.removeBtn}
              aria-label={`Remove ${tag}`}
            >
              <Icon icon={ICON_X} width={14} height={14} />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={tags.length === 0 ? placeholder : ''}
          className={styles.input}
        />
      </div>
    </div>
  );
}
