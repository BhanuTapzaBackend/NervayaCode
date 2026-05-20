'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_PEN, ICON_TRASH, ICON_EYE, ICON_EYE_SLASH } from '@/constants/icons';
import type { Blog } from '@/types/blog.types';
import styles from './styles.module.css';

interface BlogListCardProps {
  blog: Blog;
  formatDate: (date: Date) => string;
  onDelete: () => void;
}

export default function BlogListCard({ blog, formatDate, onDelete }: BlogListCardProps) {
  return (
    <li key={blog._id} className={styles.card}>
      <div className={styles.imageWrapper}>
        {blog.coverImage ? (
          <Image src={blog.coverImage} alt={blog.title} fill className={styles.image} />
        ) : (
          <div className={styles.noImage}>No Image</div>
        )}
        <span className={`${styles.statusBadge} ${blog.isPublished ? styles.published : styles.draft}`}>
          {blog.isPublished ? (
            <Icon icon={ICON_EYE} width={12} height={12} />
          ) : (
            <Icon icon={ICON_EYE_SLASH} width={12} height={12} />
          )}
          {blog.isPublished ? 'Published' : 'Draft'}
        </span>
      </div>
      <div className={styles.content}>
        <h3 className={styles.blogTitle}>{blog.title}</h3>
        <div className={styles.meta}>
          <span className={styles.author}>By {blog.author}</span>
          <span className={styles.date}>{formatDate(blog.createdAt)}</span>
          <span className={styles.readTime}>{blog.readTime} min read</span>
        </div>
        {blog.tags.length > 0 && (
          <div className={styles.tags}>
            {blog.tags.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
            {blog.tags.length > 3 && <span className={styles.moreTag}>+{blog.tags.length - 3}</span>}
          </div>
        )}
      </div>
      <div className={styles.actions}>
        <Link href={`/admin/blogs/edit/${blog._id}`} className={styles.editButton}>
          <Icon icon={ICON_PEN} width={16} height={16} />
          Edit
        </Link>
        <button onClick={onDelete} className={styles.deleteButton}>
          <Icon icon={ICON_TRASH} width={16} height={16} />
          Delete
        </button>
      </div>
    </li>
  );
}
