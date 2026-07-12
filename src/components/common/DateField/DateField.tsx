'use client';

import { useState, useCallback } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker } from 'react-day-picker';
import { Icon } from '@iconify/react';
import { ICON_CALENDAR } from '@/constants/icons';
import 'react-day-picker/style.css';
import styles from './DateField.module.css';

export interface DateFieldProps {
  /** ISO date, `YYYY-MM-DD`. Empty string means no date chosen. */
  value: string;
  onChange: (value: string) => void;
  /** ISO date; days before this are not selectable. */
  min?: string;
  /** ISO date; days after this are not selectable. */
  max?: string;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Date picker built on Radix Popover + react-day-picker — the same pairing
 * shadcn/ui uses, styled with CSS Modules instead of Tailwind.
 *
 * The wire format is the ISO `YYYY-MM-DD` string every consultation API speaks.
 * Parsing goes through UTC so a date never shifts a day across a timezone.
 */
function parseIso(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplay(value: string): string {
  const date = parseIso(value);
  if (!date) return '';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function DateField({
  value,
  onChange,
  min,
  max,
  placeholder = 'Pick a date',
  ariaLabel,
  id,
  disabled = false,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = parseIso(value);

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      onChange(date ? toIso(date) : '');
      setOpen(false);
    },
    [onChange],
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-label={ariaLabel}
          className={styles.trigger}
          data-empty={value ? undefined : ''}
        >
          <span className={styles.triggerLabel}>{value ? formatDisplay(value) : placeholder}</span>
          <Icon icon={ICON_CALENDAR} className={styles.triggerIcon} aria-hidden />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className={styles.content} sideOffset={6} align="start">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected}
            startMonth={parseIso(min ?? '')}
            endMonth={parseIso(max ?? '')}
            disabled={[
              ...(min ? [{ before: parseIso(min) as Date }] : []),
              ...(max ? [{ after: parseIso(max) as Date }] : []),
            ]}
            className={styles.calendar}
          />
          {value && (
            <button type="button" className={styles.clear} onClick={() => handleSelect(undefined)}>
              Clear
            </button>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default DateField;
