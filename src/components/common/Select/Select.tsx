'use client';

import * as RadixSelect from '@radix-ui/react-select';
import { Icon } from '@iconify/react';
import { ICON_CHEVRON_DOWN, ICON_CHECK } from '@/constants/icons';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Accessible select built on Radix primitives — keyboard navigation, typeahead,
 * and focus management come from the primitive; the look is ours (CSS Modules).
 *
 * Radix models "no selection" as undefined, but an empty string is a legitimate
 * value here (the "All statuses" option in filter bars). Radix rejects `value=""`
 * on an Item, so empty is mapped to a sentinel on the way in and back out.
 */
const EMPTY_VALUE = '__all__';

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  ariaLabel,
  id,
  disabled = false,
  className,
}: SelectProps) {
  const toRadix = (v: string): string => (v === '' ? EMPTY_VALUE : v);
  const fromRadix = (v: string): string => (v === EMPTY_VALUE ? '' : v);

  return (
    <RadixSelect.Root
      value={value !== undefined ? toRadix(value) : undefined}
      onValueChange={(v) => onChange?.(fromRadix(v))}
      disabled={disabled}
    >
      <RadixSelect.Trigger id={id} aria-label={ariaLabel} className={`${styles.trigger} ${className ?? ''}`.trim()}>
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className={styles.triggerIcon}>
          <Icon icon={ICON_CHEVRON_DOWN} aria-hidden />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content className={styles.content} position="popper" sideOffset={4}>
          <RadixSelect.Viewport className={styles.viewport}>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={toRadix(option.value)}
                disabled={option.disabled}
                className={styles.item}
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className={styles.itemIndicator}>
                  <Icon icon={ICON_CHECK} aria-hidden />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

export default Select;
