'use client';

import React from 'react';
import PriceRangeSlider from './PriceRangeSlider';
import styles from './SupplementFilters.module.css';

export interface PriceRange {
  min: number;
  max?: number;
}

interface SupplementFiltersProps {
  priceBounds: { min: number; max: number };
  value: PriceRange;
  onChange: (range: PriceRange) => void;
}

const SupplementFilters: React.FC<SupplementFiltersProps> = ({ priceBounds, value, onChange }) => {
  const effectiveMax = value.max ?? priceBounds.max;
  const valueMin = Math.max(Math.min(value.min, priceBounds.max), priceBounds.min);
  const valueMax = Math.min(Math.max(effectiveMax, priceBounds.min), priceBounds.max);
  const step = Math.max(1, Math.floor((priceBounds.max - priceBounds.min) / 100) || 1);

  const handleSliderChange = (min: number, max: number) => {
    onChange({ min, max: max >= priceBounds.max ? undefined : max });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Shop By Price</h3>
      <div className={styles.priceDisplay}>
        <span>₹{valueMin}</span>
        <span> – </span>
        <span>₹{valueMax}</span>
      </div>
      <PriceRangeSlider
        min={priceBounds.min}
        max={priceBounds.max}
        valueMin={valueMin}
        valueMax={valueMax}
        onChange={handleSliderChange}
        step={step}
      />
    </div>
  );
};

export default SupplementFilters;
