'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_CLOCK, ICON_ARROW_RIGHT, ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT } from '@/constants/icons';
import { decodeHtmlEntities } from '@/lib/utils/string.util';
import type { Blog } from '@/types/blog.types';
import styles from './styles.module.css';

const CARDS_PER_PAGE = 3;

interface BlogRecommendationsProps {
  recommendations: Blog[];
}

export function BlogRecommendations({ recommendations }: BlogRecommendationsProps) {
  const [page, setPage] = useState(0);
  const totalPages = useMemo(() => Math.ceil(recommendations.length / CARDS_PER_PAGE), [recommendations.length]);
  const visible = useMemo(
    () => recommendations.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE),
    [recommendations, page],
  );

  const goBack = () => setPage((p) => Math.max(0, p - 1));
  const goForward = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <section className={styles.recommendations}>
      <div className={styles.recHeaderRow}>
        <span className={styles.recLabel}>You might also enjoy</span>
        {totalPages > 1 && (
          <div className={styles.arrows}>
            <button onClick={goBack} disabled={page === 0} className={styles.arrowBtn} aria-label="Previous">
              <Icon icon={ICON_CHEVRON_LEFT} width={18} height={18} />
            </button>
            <span className={styles.pageIndicator}>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={goForward}
              disabled={page === totalPages - 1}
              className={styles.arrowBtn}
              aria-label="Next"
            >
              <Icon icon={ICON_CHEVRON_RIGHT} width={18} height={18} />
            </button>
          </div>
        )}
      </div>

      {visible.length > 0 ? (
        <>
          <ul className={styles.recGrid} aria-label="Related articles">
            {visible.map((rec) => (
              <li key={rec._id}>
                <Link href={`/sleep-blog/${rec.slug}`} className={styles.recCard}>
                  <div className={styles.recImageWrapper}>
                    {rec.coverImage ? (
                      <Image src={rec.coverImage} alt={rec.title} fill className={styles.recImage} />
                    ) : (
                      <div className={styles.recNoImage}>
                        <span>N</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.recBody}>
                    {rec.tags.length > 0 && <span className={styles.recTag}>{rec.tags[0]}</span>}
                    <h3 className={styles.recTitle}>{decodeHtmlEntities(rec.title)}</h3>
                    <div className={styles.recMeta}>
                      <Icon icon={ICON_CLOCK} width={14} height={14} />
                      <span>{rec.readTime} min read</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/sleep-blog" className={styles.recViewAll}>
            View all articles
            <Icon icon={ICON_ARROW_RIGHT} width={16} height={16} />
          </Link>
        </>
      ) : (
        <div className={styles.recEmptyCard}>
          <div className={styles.recEmptyIcon}>
            <Icon icon="solar:stars-bold-duotone" width={36} height={36} />
          </div>
          <p className={styles.recEmptyTitle}>More articles coming soon</p>
          <p className={styles.recEmptyText}>We&apos;re crafting new articles on sleep and wellness.</p>
          <Link href="/sleep-blog" className={styles.recEmptyCta}>
            Browse all articles
            <Icon icon={ICON_ARROW_RIGHT} width={16} height={16} />
          </Link>
        </div>
      )}
    </section>
  );
}
