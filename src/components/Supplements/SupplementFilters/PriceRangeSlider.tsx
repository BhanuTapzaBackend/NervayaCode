'use client';

import React, { useCallback } from 'react';
import styles from './PriceRangeSlider.module.css';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  step?: number;
  ariaLabelMin?: string;
  ariaLabelMax?: string;
}

const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
  step = 1,
  ariaLabelMin = 'Minimum price',
  ariaLabelMax = 'Maximum price',
}) => {
  const range = max - min || 1;
  const leftPercent = ((valueMin - min) / range) * 100;
  const rightPercent = ((valueMax - min) / range) * 100;

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      const newMin = Math.min(val, valueMax - step);
      onChange(newMin, valueMax);
    },
    [valueMax, step, onChange],
  );

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      const newMax = Math.max(val, valueMin + step);
      onChange(valueMin, newMax);
    },
    [valueMin, step, onChange],
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.trackContainer}>
        <div className={styles.filled} style={{ left: `${leftPercent}%`, right: `${100 - rightPercent}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMin}
          onChange={handleMinChange}
          className={`${styles.range} ${styles.rangeMin}`}
          aria-label={ariaLabelMin}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valueMin}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMax}
          onChange={handleMaxChange}
          className={`${styles.range} ${styles.rangeMax}`}
          aria-label={ariaLabelMax}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valueMax}
        />
      </div>
    </div>
  );
};

export default PriceRangeSlider;
