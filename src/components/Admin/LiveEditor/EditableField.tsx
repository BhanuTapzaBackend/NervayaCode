'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ICON_INFO_FANCY, ICON_EDIT_FANCY } from '@/constants/icons';
import styles from './styles.module.css';

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  label: string;
  tooltip: string;
  type?: 'text' | 'number' | 'textarea';
  className?: string;
  multiline?: boolean;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onSave,
  label,
  tooltip,
  type = 'text',
  className = '',
  multiline = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (currentValue !== value) {
      onSave(currentValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  return (
    <div className={`${styles.editableWrapper} ${className} ${isEditing ? styles.editing : ''}`}>
      <div className={styles.labelRow}>
        <div className={styles.tooltipRoot}>
          <Icon icon={ICON_INFO_FANCY} className={styles.infoIcon} />
          <span className={styles.tooltipText}>{tooltip}</span>
        </div>
        {!isEditing && (
          <button className={styles.editButton} onClick={() => setIsEditing(true)} title={`Edit ${label}`}>
            <Icon icon={ICON_EDIT_FANCY} />
          </button>
        )}
      </div>

      {isEditing ? (
        multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={styles.textarea}
            rows={4}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={styles.input}
          />
        )
      ) : (
        <button type="button" className={styles.displayValue} onClick={() => setIsEditing(true)}>
          {value || <span className={styles.placeholder}>Click to enter {label.toLowerCase()}...</span>}
        </button>
      )}
    </div>
  );
};
