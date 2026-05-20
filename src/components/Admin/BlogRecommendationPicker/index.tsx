'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ICON_X, ICON_SEARCH } from '@/constants/icons';
import { blogsApi } from '@/lib/api/blogs';
import type { Blog } from '@/types/blog.types';
import styles from './styles.module.css';

interface BlogRecommendationPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  currentBlogId?: string;
}

export function BlogRecommendationPicker({ selectedIds, onChange, currentBlogId }: BlogRecommendationPickerProps) {
  const [allBlogs, setAllBlogs] = useState<Blog[]>([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await blogsApi.getAllForAdmin({ limit: 50 });
        if (response.success && response.data) {
          setAllBlogs(response.data.blogs.filter((b) => b._id !== currentBlogId));
        }
      } catch {
        /* non-critical */
      }
    };
    fetchBlogs();
  }, [currentBlogId]);

  const selectedBlogs = allBlogs.filter((b) => selectedIds.includes(b._id));
  const filtered = allBlogs.filter(
    (b) => !selectedIds.includes(b._id) && b.title.toLowerCase().includes(search.toLowerCase()),
  );

  const addBlog = (id: string) => {
    onChange([...selectedIds, id]);
    setSearch('');
  };

  const removeBlog = (id: string) => {
    onChange(selectedIds.filter((s) => s !== id));
  };

  return (
    <div className={styles.picker}>
      {selectedBlogs.length > 0 && (
        <ul className={styles.selectedList}>
          {selectedBlogs.map((blog) => (
            <li key={blog._id} className={styles.selectedItem}>
              <span className={styles.selectedTitle}>{blog.title}</span>
              <button type="button" onClick={() => removeBlog(blog._id)} className={styles.removeBtn}>
                <Icon icon={ICON_X} width={14} height={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.searchBox}>
        <Icon icon={ICON_SEARCH} width={16} height={16} className={styles.searchIcon} />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className={styles.searchInput}
          placeholder="Search blogs to recommend..."
        />
      </div>

      {isOpen && filtered.length > 0 && (
        <ul className={styles.dropdown}>
          {filtered.slice(0, 6).map((blog) => (
            <li key={blog._id}>
              <button
                type="button"
                onClick={() => {
                  addBlog(blog._id);
                  setIsOpen(false);
                }}
                className={styles.dropdownItem}
              >
                <span className={styles.dropdownTitle}>{blog.title}</span>
                <span className={styles.dropdownMeta}>{blog.isPublished ? 'Published' : 'Draft'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && search && filtered.length === 0 && <div className={styles.noResults}>No blogs found</div>}
    </div>
  );
}
