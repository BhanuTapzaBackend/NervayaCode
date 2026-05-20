'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_USER, ICON_CHEVRON_LEFT } from '@/constants/icons';
import Sidebar from '@/components/Sidebar/LazySidebar';
import { BlogRecommendations } from '@/components/Blog/BlogRecommendations';
import { GlobalLoader } from '@/components/common/GlobalLoader';
import { blogsApi } from '@/lib/api/blogs';
import { decodeHtmlEntities } from '@/lib/utils/string.util';
import type { Blog } from '@/types/blog.types';
import styles from './styles.module.css';

interface BlogDetailClientProps {
  params: Promise<{ slug: string }>;
}

export default function BlogDetailClient({ params }: BlogDetailClientProps) {
  const { slug } = use(params);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [recommendations, setRecommendations] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const response = await blogsApi.getBySlug(slug);
        if (response.success && response.data) setBlog(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blog');
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug]);

  useEffect(() => {
    if (!blog) return;
    const fetchRecommendations = async () => {
      try {
        const manualIds = blog.recommendedBlogs || [];
        if (manualIds.length > 0) {
          const results = await Promise.all(manualIds.map((id) => blogsApi.getById(id).catch(() => null)));
          const manualBlogs = results
            .filter((r): r is NonNullable<typeof r> => r !== null && r.success && !!r.data)
            .map((r) => r.data as Blog);
          setRecommendations(manualBlogs);
          return;
        }

        const response = await blogsApi.getAll({ limit: 10 });
        if (response.success && response.data) {
          const otherBlogs = response.data.blogs.filter((b) => b._id !== blog._id);
          const tagSet = new Set(blog.tags.map((t) => t.toLowerCase()));
          const scored = otherBlogs.map((b) => ({
            blog: b,
            score: b.tags.filter((t) => tagSet.has(t.toLowerCase())).length,
          }));
          scored.sort((a, b) => b.score - a.score);
          setRecommendations(scored.slice(0, 9).map((s) => s.blog));
        }
      } catch {
        /* recommendations are non-critical */
      }
    };
    fetchRecommendations();
  }, [blog]);

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleShare = async () => {
    if (navigator.share && blog) {
      try {
        await navigator.share({ title: blog.title, url: window.location.href });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <Sidebar>
        <GlobalLoader label="Loading article..." />
      </Sidebar>
    );
  }

  if (error || !blog) {
    return (
      <Sidebar>
        <div className={styles.errorContainer}>
          <h2>Blog Not Found</h2>
          <p>{error || 'The blog post you are looking for does not exist.'}</p>
          <Link href="/sleep-blog" className={styles.backButton}>
            <Icon icon={ICON_CHEVRON_LEFT} />
            Back to Blog
          </Link>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className={styles.pageLayout}>
        <article className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>{decodeHtmlEntities(blog.title)}</h1>
            <div className={styles.metaBar}>
              <div className={styles.authorInfo}>
                <div className={styles.authorAvatar}>
                  <Icon icon={ICON_USER} width={24} height={24} />
                </div>
                <div className={styles.metaText}>
                  <span className={styles.authorName}>{blog.author}</span>
                  <div className={styles.subMeta}>
                    <span className={styles.publishDate}>{formatDate(blog.createdAt)}</span>
                    <span className={styles.metaDot}>&bull;</span>
                    <span className={styles.readTimeText}>{blog.readTime} min read</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {blog.coverImage && (
            <div className={styles.heroImage}>
              <Image src={blog.coverImage} alt={blog.title} fill className={styles.image} priority />
            </div>
          )}

          <div className={styles.contentWrapper}>
            {/* eslint-disable-next-line react/no-danger */}
            <div className={styles.content} dangerouslySetInnerHTML={{ __html: blog.content }} />
            {blog.tags.length > 0 && (
              <ul className={styles.tags}>
                {blog.tags.map((tag) => (
                  <li key={tag} className={styles.tag}>
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.shareSection}>
            <button onClick={handleShare} className={styles.shareCta}>
              Share
            </button>
          </div>

          {blog.ctaText && blog.ctaLink && (
            <a
              href={blog.ctaLink}
              className={styles.blogCta}
              target={blog.ctaLink.startsWith('http') ? '_blank' : undefined}
              rel={blog.ctaLink.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {blog.ctaText}
            </a>
          )}
        </article>

        <BlogRecommendations recommendations={recommendations} />
      </div>
    </Sidebar>
  );
}
