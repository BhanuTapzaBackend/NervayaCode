'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ICON_ADD, ICON_SEARCH } from '@/constants/icons';
import { blogsApi } from '@/lib/api/blogs';
import { GlobalLoader, Pagination, StatusState, Button } from '@/components/common';
import PageHeader from '@/components/PageHeader/PageHeader';
import { BlogListCard } from '@/components/Admin/BlogList';
import { ConfirmDeleteDialog } from '@/components/Admin/common';
import { toast } from 'sonner';
import type { Blog } from '@/types/blog.types';
import { PAGE_SIZE_3 } from '@/lib/constants/pagination.constants';
import styles from './styles.module.css';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: PAGE_SIZE_3,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fetchBlogs = useCallback(async (page: number, search: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await blogsApi.getAllForAdmin({
        page,
        limit: PAGE_SIZE_3,
        search: search.trim() || undefined,
      });
      if (response.success && response.data) {
        setBlogs(response.data.blogs);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blogs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs(pagination.page, searchQuery);
  }, [pagination.page, searchQuery, fetchBlogs]);

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      setIsDeleting(true);
      const response = await blogsApi.delete(confirmDelete.id);
      if (response.success) {
        setConfirmDelete(null);
        toast.success(`Blog "${confirmDelete.title}" deleted successfully`);
        await fetchBlogs(pagination.page, searchQuery);
      } else {
        toast.error('Failed to delete blog');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete blog');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  if (loading) {
    return (
      <div className={styles.container}>
        <PageHeader
          title="Blogs"
          subtitle="Manage blog posts, drafts, and publishing workflow."
          actions={
            <Button href="/admin/blogs/add" variant="primary" size="md" fullWidth={false}>
              <Icon icon={ICON_ADD} aria-hidden />
              New Blog
            </Button>
          }
        />
        <GlobalLoader label="Loading blogs..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ConfirmDeleteDialog
        isOpen={!!confirmDelete}
        title={confirmDelete?.title || ''}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
        isDeleting={isDeleting}
      />
      <PageHeader
        title="Blogs"
        subtitle="Manage blog posts, drafts, and publishing workflow."
        actions={
          <Button href="/admin/blogs/add" variant="primary" size="md" fullWidth={false}>
            <Icon icon={ICON_ADD} aria-hidden />
            New Blog
          </Button>
        }
      />
      <div className={styles.stats}>
        <span className={styles.statPill}>{pagination.total} total posts</span>
        {searchQuery ? <span className={styles.statHint}>Filtering: &quot;{searchQuery}&quot;</span> : null}
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <form onSubmit={handleSearchSubmit} className={styles.filters}>
        <label className={styles.searchField}>
          <Icon icon={ICON_SEARCH} aria-hidden className={styles.searchIcon} />
          <input
            type="search"
            placeholder="Search by title or author..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles.searchInput}
            aria-label="Search blogs"
          />
        </label>
        <Button type="submit" variant="primary" size="md" fullWidth={false}>
          Search
        </Button>
      </form>{' '}
      {blogs.length === 0 ? (
        <StatusState
          type="empty"
          title={searchQuery ? 'No match found' : 'No blogs found'}
          message={
            searchQuery
              ? `We couldn't find any blogs matching "${searchQuery}".`
              : 'Get started by creating your first blog post to share with your audience.'
          }
          action={
            <Button href="/admin/blogs/add" variant="primary" size="md" fullWidth={false}>
              Create your first blog
            </Button>
          }
        />
      ) : (
        <ul className={styles.list} aria-label="Blog list">
          {blogs.map((blog) => (
            <BlogListCard
              key={blog._id}
              blog={blog}
              formatDate={formatDate}
              onDelete={() => setConfirmDelete({ id: blog._id, title: blog.title })}
            />
          ))}
        </ul>
      )}
      <Pagination
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={goToPage}
        ariaLabel="Manage blogs pagination"
      />
    </div>
  );
}
