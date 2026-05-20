'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { Icon } from '@iconify/react';
import { ICON_CHECK, ICON_CHEVRON_DOWN } from '@/constants/icons';
import styles from './MultiSelect.module.css';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  align?: 'left' | 'right';
}

export function MultiSelect({
  options,
  values,
  onChange,
  placeholder = 'Select items...',
  ariaLabel,
  id,
  disabled = false,
  className = '',
  align = 'right',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const triggerId = id ?? `multiselect-${generatedId.replace(/:/g, '')}`;

  const selectedLabels = options.filter((o) => values.includes(o.value)).map((o) => o.label);

  const displayLabel = selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        open &&
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        !contentRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleToggleOption = (optionValue: string) => {
    if (values.includes(optionValue)) {
      onChange(values.filter((v) => v !== optionValue));
    } else {
      onChange([...values, optionValue]);
    }
  };

  return (
    <div className={`${styles.root} ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        disabled={disabled}
      >
        <span className={styles.triggerValue}>{displayLabel}</span>
        <Icon
          icon={ICON_CHEVRON_DOWN}
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          aria-hidden
          width={20}
          height={20}
        />
      </button>
      {open && (
        <div
          ref={contentRef}
          role="listbox"
          aria-labelledby={triggerId}
          className={`${styles.content} ${align === 'left' ? styles.contentAlignLeft : ''}`.trim()}
        >
          {options.map((opt) => {
            const isSelected = values.includes(opt.value);
            const optionId = `multiselect-option-${triggerId}-${opt.value}`;
            return (
              <div
                key={`${opt.value}-${opt.label}`}
                id={optionId}
                role="option"
                aria-selected={isSelected}
                className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleOption(opt.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleOption(opt.value);
                  }
                }}
                tabIndex={0}
              >
                <div className={styles.checkbox}>{isSelected && <Icon icon={ICON_CHECK} width={14} height={14} />}</div>
                <span className={styles.optionLabel}>{opt.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MultiSelect;
