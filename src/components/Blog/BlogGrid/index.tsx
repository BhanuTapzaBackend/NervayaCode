'use client';

import type { Blog } from '@/types/blog.types';
import BlogCard from '../BlogCard';
import styles from './styles.module.css';

interface BlogGridProps {
  blogs: Blog[];
  formatDate: (date: Date) => string;
  getExcerpt: (content: string, maxLength?: number) => string;
}

export default function BlogGrid({ blogs, formatDate, getExcerpt }: BlogGridProps) {
  return (
    <ul className={styles.grid} aria-label="Blog posts">
      {blogs.map((blog) => (
        <BlogCard key={blog._id} blog={blog} formatDate={formatDate} getExcerpt={getExcerpt} />
      ))}
    </ul>
  );
}
