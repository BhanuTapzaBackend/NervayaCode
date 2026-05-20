'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_CLOCK, ICON_USER, ICON_CALENDAR } from '@/constants/icons';
import type { Blog } from '@/types/blog.types';
import { decodeHtmlEntities } from '@/lib/utils/string.util';
import styles from './styles.module.css';

interface BlogCardProps {
  blog: Blog;
  formatDate: (date: Date) => string;
  getExcerpt: (content: string, maxLength?: number) => string;
}

export default function BlogCard({ blog, formatDate, getExcerpt }: BlogCardProps) {
  const displayExcerpt = blog.description?.trim() || getExcerpt(blog.content);
  return (
    <li key={blog._id}>
      <Link href={`/blog/${blog.slug}`} className={styles.card}>
        <div className={styles.imageWrapper}>
          {blog.coverImage ? (
            <Image src={blog.coverImage} alt={blog.title} fill className={styles.image} />
          ) : (
            <div className={styles.noImage}>
              <span>Nervaya</span>
            </div>
          )}
        </div>
        <div className={styles.content}>
          {blog.tags.length > 0 && (
            <div className={styles.cardTags}>
              {blog.tags.slice(0, 2).map((tag) => (
                <span key={tag} className={styles.cardTag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h2 className={styles.cardTitle}>{decodeHtmlEntities(blog.title)}</h2>
          {displayExcerpt && <p className={styles.excerpt}>{displayExcerpt}</p>}
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <Icon icon={ICON_USER} width={16} height={16} aria-hidden />
              {blog.author}
            </span>
            <span className={styles.metaItem}>
              <Icon icon={ICON_CALENDAR} width={16} height={16} aria-hidden />
              {formatDate(blog.createdAt)}
            </span>
            <span className={styles.metaItem}>
              <Icon icon={ICON_CLOCK} width={16} height={16} aria-hidden />
              {blog.readTime} min read
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
