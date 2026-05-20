'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ICON_CHEVRON_DOWN, ICON_CHECK_SIMPLE } from '@/constants/icons';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CustomDropdown.module.css';

export interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={[styles.trigger, isOpen ? styles.triggerOpen : ''].join(' ')}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className={styles.triggerContent}>
          {icon && <Icon icon={icon} className={styles.icon} />}
          <span className={styles.label}>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <Icon icon={ICON_CHEVRON_DOWN} className={[styles.chevron, isOpen ? styles.chevronRotated : ''].join(' ')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={styles.dropdown}
            role="listbox"
          >
            <div className={styles.optionsWrapper}>
              {options.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={[styles.option, value === option.value ? styles.optionSelected : ''].join(' ')}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={value === option.value}
                >
                  {option.label}
                  {value === option.value && <Icon icon={ICON_CHECK_SIMPLE} className={styles.checkIcon} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomDropdown;
