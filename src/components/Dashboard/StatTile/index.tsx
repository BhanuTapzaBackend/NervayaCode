'use client';

import Link from 'next/link';
import React from 'react';
import styles from './StatTile.module.css';

interface TileCta {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

interface StatTileProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon: React.ReactNode;
  cta?: TileCta | TileCta[];
  /** Icon and icon background color (e.g. var(--color-tile-indigo), var(--color-tile-rose), var(--color-accent-light)). Defaults to purple. */
  iconColor?: string;
  className?: string;
}

export function StatTile({ title, value, subtitle, icon, cta, iconColor, className }: StatTileProps) {
  const iconStyle = iconColor ? ({ '--tile-icon-color': iconColor } as React.CSSProperties) : undefined;

  const renderCta = (item: TileCta, index: number) => {
    const ctaClass = item.variant === 'secondary' ? styles.secondaryCta : styles.cta;
    if (item.onClick) {
      return (
        <button key={index} type="button" onClick={item.onClick} className={ctaClass}>
          {item.label}
        </button>
      );
    }
    return (
      <Link key={index} href={item.href} className={ctaClass}>
        {item.label}
      </Link>
    );
  };

  return (
    <article className={`${styles.tile} ${className || ''}`}>
      <div className={styles.topRow}>
        <div style={{ minWidth: 0 }}>
          <p className={styles.title}>{title}</p>
          <p className={styles.value}>{value}</p>
        </div>
        <div className={styles.iconWrap} style={iconStyle} aria-hidden>
          {icon}
        </div>
      </div>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {cta && (
        <div className={styles.ctaWrapper}>
          {Array.isArray(cta) ? cta.map((item, idx) => renderCta(item, idx)) : renderCta(cta, 0)}
        </div>
      )}
    </article>
  );
}
