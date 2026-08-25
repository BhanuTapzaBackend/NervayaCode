'use client';

import React, { useEffect, useState } from 'react';
import { MAX_PRIORITY, normalizePriority, priorityInputValue } from '@/lib/constants/priority.constants';
import styles from './styles.module.css';

export interface PriorityInputProps {
  /** Current stored priority; undefined / sentinel renders as an empty box. */
  value?: number;
  /** Called on blur (or Enter) with the normalized value, only when it changed. */
  onSave: (priority: number) => Promise<void> | void;
  /** Accessible label — include the item name, e.g. "Priority for Dr. Smith". */
  label: string;
  disabled?: boolean;
}

/**
 * Small numeric box for the admin display order. Lower number shows first;
 * leaving it empty means "not prioritized" and sorts the item after every
 * numbered one. Saves on blur so admins can tab through a list quickly.
 */
export default function PriorityInput({ value, onSave, label, disabled = false }: PriorityInputProps) {
  const [draft, setDraft] = useState(() => priorityInputValue(value));
  const [saving, setSaving] = useState(false);

  // Re-sync when the row's stored value changes (refetch, or another edit).
  useEffect(() => {
    setDraft(priorityInputValue(value));
  }, [value]);

  const commit = async (): Promise<void> => {
    const normalized = normalizePriority(draft);
    // Show what will actually be stored, so junk input snaps back visibly.
    setDraft(priorityInputValue(normalized));

    if (normalized === normalizePriority(value)) return;

    setSaving(true);
    try {
      await onSave(normalized);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === 'Escape') {
      setDraft(priorityInputValue(value));
      event.currentTarget.blur();
    }
    // Don't let arrow keys or typing bubble to a clickable row wrapper.
    event.stopPropagation();
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      min={1}
      max={MAX_PRIORITY}
      step={1}
      className={styles.input}
      value={draft}
      placeholder="—"
      aria-label={label}
      title="Display order — 1 shows first. Leave empty for no set position."
      disabled={disabled || saving}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      onClick={(event) => event.stopPropagation()}
    />
  );
}
