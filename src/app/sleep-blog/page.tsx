'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar/LazySidebar';
import { GlobalLoader } from '@/components/common';
import Pagination from '@/components/common/Pagination';
import { BlogFilters, BlogGrid } from '@/components/Blog';
import { blogsApi } from '@/lib/api/blogs';
import { getPlainExcerpt } from '@/lib/utils/string.util';
import type { Blog } from '@/types/blog.types';
import { PAGE_SIZE_3 } from '@/lib/constants/pagination.constants';
import styles from './styles.module.css';
import PageHeader from '@/components/PageHeader/PageHeader';
import FrequentlyAskedQuestions from '@/components/Support/FrequentlyAskedQuestions';
import { blogFaqData } from '@/utils/blogFaqData';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: PAGE_SIZE_3,
    total: 0,
    totalPages: 0,
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const fetchBlogs = useCallback(async (page: number, tags: string[], search: string) => {
    try {
      setError(null);
      const response = await blogsApi.getAll({
        page,
        limit: PAGE_SIZE_3,
        tags: tags.length > 0 ? tags : undefined,
        search: search.trim() || undefined,
      });
      if (response.success && response.data) {
        setBlogs(response.data.blogs);
        setPagination(response.data.pagination);
        setAllTags(response.data.allTags || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blogs');
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs(1, selectedTags, searchQuery);
  }, [selectedTags, searchQuery, fetchBlogs]);

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchBlogs(page, selectedTags, searchQuery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleFilterChange = (values: string[]) => {
    setSelectedTags(values);
    setSearchQuery('');
    setSearchInput('');
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getExcerpt = (content: string, maxLength?: number) => getPlainExcerpt(content, maxLength);
  return (
    <Sidebar>
      <div className={styles.container}>
        <PageHeader title="Sleep Blog" subtitle="Insights, tips, and stories about sleep wellness" />

        {!isInitialLoading && (
          <BlogFilters
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            onSearchSubmit={handleSearchSubmit}
            allTags={allTags}
            selectedTags={selectedTags}
            onFilterChange={handleFilterChange}
          />
        )}

        {isInitialLoading ? (
          <GlobalLoader label="Loading blogs..." />
        ) : (
          <>
            {error ? (
              <div className={styles.error}>
                <p>{error}</p>
              </div>
            ) : (
              <>
                {blogs.length === 0 ? (
                  <div className={styles.empty}>
                    <p>
                      {searchQuery || selectedTags.length > 0
                        ? 'No posts match your filters. Try a different search or tag.'
                        : 'No blog posts available yet.'}
                    </p>
                  </div>
                ) : (
                  <BlogGrid blogs={blogs} formatDate={formatDate} getExcerpt={getExcerpt} />
                )}
                {pagination.total >= 0 && (
                  <Pagination
                    page={pagination.page}
                    limit={pagination.limit}
                    total={pagination.total}
                    totalPages={pagination.totalPages}
                    onPageChange={goToPage}
                    ariaLabel="Blog pagination"
                  />
                )}
              </>
            )}
          </>
        )}
        <div className={styles.faqWrapper}>
          <FrequentlyAskedQuestions
            data={blogFaqData}
            title="Frequently Asked Questions About Sleeep"
            subtitle="Find answers to common questions about sleep health and our Deep Rest Sessions"
          />
        </div>
      </div>
    </Sidebar>
  );
}
