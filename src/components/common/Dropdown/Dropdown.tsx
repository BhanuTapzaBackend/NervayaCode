'use client';

import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Icon } from '@iconify/react';
import { ICON_CHEVRON_DOWN, ICON_CHECK } from '@/constants/icons';
import styles from './Dropdown.module.css';

export interface DropdownOption {
  value: string;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'navbar';
  trigger?: React.ReactNode;
  modal?: boolean;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  ariaLabel,
  disabled = false,
  className = '',
  variant = 'default',
  trigger,
  modal = true,
}: DropdownProps) {
  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={`${styles.root} ${variant === 'navbar' ? styles.navbarVariant : ''} ${className}`.trim()}>
      <DropdownMenu.Root modal={modal}>
        <DropdownMenu.Trigger asChild>
          {trigger || (
            <button type="button" className={styles.trigger} aria-label={ariaLabel} disabled={disabled}>
              <span className={styles.triggerValue}>{displayLabel}</span>
              <Icon icon={ICON_CHEVRON_DOWN} className={styles.chevron} aria-hidden width={20} height={20} />
            </button>
          )}
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={`${styles.content} ${variant === 'navbar' ? styles.navbarContent : ''}`}
            sideOffset={8}
            align="start"
          >
            {variant === 'navbar' && <div className={styles.arrowPointer} />}
            {options.map((opt) => {
              const isSelected = value === opt.value;

              const itemContent = (
                <>
                  <span className={styles.optionLabel}>{opt.label}</span>
                  {isSelected && <Icon icon={ICON_CHECK} className={styles.check} aria-hidden width={16} height={16} />}
                </>
              );

              return (
                <DropdownMenu.Item
                  key={`${opt.value}-${opt.label}`}
                  className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
                  onClick={() => {
                    if (opt.onClick) opt.onClick();
                    if (onChange) onChange(opt.value);
                  }}
                  asChild={!!opt.href}
                >
                  {opt.href ? <a href={opt.href}>{itemContent}</a> : itemContent}
                </DropdownMenu.Item>
              );
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

export default Dropdown;
