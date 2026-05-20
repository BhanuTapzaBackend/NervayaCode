'use client';

import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { ICON_CHEVRON_DOWN } from '@/constants/icons';
import styles from './RecentActivity.module.css';

export interface ActivityItem {
  id: string;
  label: string;
  timeLabel: string;
  time?: Date | string | number;
  icon?: React.ReactNode;
}

interface RecentActivityProps {
  items: ActivityItem[];
  previewCount?: number;
}

function formatAbsoluteTime(value: ActivityItem['time']): string | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const now = new Date();
  const isSameDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (isSameDay) return time;
  const isSameYear = d.getFullYear() === now.getFullYear();
  const datePart = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(isSameYear ? {} : { year: 'numeric' }),
  });
  return `${datePart} · ${time}`;
}

export function RecentActivity({ items, previewCount = 2 }: RecentActivityProps) {
  const [expanded, setExpanded] = useState(false);
  const canCollapse = items.length > previewCount;
  const visible = useMemo(
    () => (expanded || !canCollapse ? items : items.slice(0, previewCount)),
    [items, expanded, canCollapse, previewCount],
  );
  const hiddenCount = items.length - previewCount;

  return (
    <section className={styles.wrap} aria-label="Recent activity">
      <div className={styles.titleRow}>
        <h2 className={styles.title}>Recent activity</h2>
        {items.length > 0 && <span className={styles.count}>{items.length}</span>}
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>No recent activity yet.</p>
      ) : (
        <>
          <ul className={styles.list}>
            {visible.map((it) => {
              const absolute = formatAbsoluteTime(it.time);
              return (
                <li key={it.id} className={styles.item}>
                  <span className={styles.left}>
                    {it.icon && (
                      <span className={styles.icon} aria-hidden>
                        {it.icon}
                      </span>
                    )}
                    <span className={styles.textBlock}>
                      <span className={styles.label}>{it.label}</span>
                      {absolute && <span className={styles.sub}>{absolute}</span>}
                    </span>
                  </span>
                  <span className={styles.time}>{it.timeLabel}</span>
                </li>
              );
            })}
          </ul>

          {canCollapse && (
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              <span>{expanded ? 'Show less' : `Show ${hiddenCount} more`}</span>
              <Icon
                icon={ICON_CHEVRON_DOWN}
                className={`${styles.chev} ${expanded ? styles.chevUp : ''}`}
                aria-hidden
              />
            </button>
          )}
        </>
      )}
    </section>
  );
}
