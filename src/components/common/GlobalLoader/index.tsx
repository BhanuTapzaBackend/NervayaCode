'use client';

import React from 'react';
import styles from './styles.module.css';

export interface GlobalLoaderProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  label?: string;
  centerPage?: boolean;
}

function toCssSize(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

function isInlineSize(value: number | string): boolean {
  return typeof value === 'number' && value <= 64;
}

export function GlobalLoader({ width = 120, height = 120, className = '', label, centerPage }: GlobalLoaderProps) {
  // centerPage = true means it takes up full width/height of parent and centers content
  // if width/height are small, we treat it as an inline spinner
  const isInline = isInlineSize(width) && isInlineSize(height) && !centerPage;

  const loaderStyle = {
    '--loader-width': toCssSize(width),
    '--loader-height': toCssSize(height),
  } as React.CSSProperties;

  return (
    <div
      className={`${styles.root} ${isInline ? styles.inline : styles.container}${className ? ` ${className}` : ''}`}
      style={loaderStyle}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label || 'Loading'}
    >
      <div className={styles.shell} aria-hidden>
        <span className={styles.spinner}></span>
      </div>
      {label ? <p className={styles.label}>{label}</p> : null}
    </div>
  );
}

export default GlobalLoader;
