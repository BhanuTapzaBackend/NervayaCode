'use client';

import React from 'react';
import styles from './styles.module.css';

interface QuantitySelectorProps {
  value: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
}) => {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (!max || value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      if (newValue < min) {
        onChange(min);
      } else if (max && newValue > max) {
        onChange(max);
      } else {
        onChange(newValue);
      }
    }
  };

  return (
    <div className={styles.quantitySelector}>
      <button
        type="button"
        className={`${styles.button} ${styles.decrease}`}
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        className={styles.input}
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        disabled={disabled}
        aria-label="Quantity"
      />
      <button
        type="button"
        className={`${styles.button} ${styles.increase}`}
        onClick={handleIncrease}
        disabled={disabled || (max !== undefined && value >= max)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
};

export default QuantitySelector;
