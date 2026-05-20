'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ICON_ARROW_LEFT } from '@/constants/icons';
import { blogsApi } from '@/lib/api/blogs';
import BlogForm from '@/components/Admin/BlogForm';
import PageHeader from '@/components/PageHeader/PageHeader';
import { toast } from 'sonner';
import styles from './styles.module.css';

export default function AddBlogPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    coverImage: '',
    metaTitle: '',
    metaDescription: '',
    metaImage: '',
    ctaText: '',
    ctaLink: '',
    isPublished: false,
  });
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [recommendedBlogs, setRecommendedBlogs] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, coverImage: url }));
  };

  const handleMetaImageUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, metaImage: url }));
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags((prev) => [...prev, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (!formData.title.trim()) throw new Error('Title is required');
      if (!content.trim() || content === '<p><br></p>') throw new Error('Content is required');
      if (!formData.author.trim()) throw new Error('Author is required');

      const result = await blogsApi.create({ ...formData, content, tags, recommendedBlogs });
      if (!result.success) throw new Error(result.message || 'Failed to create blog');
      toast.success('Blog created successfully');
      router.push('/admin/blogs');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className={styles.container}>
      <PageHeader
        title="Create New Blog"
        subtitle="Add a new blog post to your platform."
        actions={
          <Link href="/admin/blogs" className={styles.backLink}>
            <Icon icon={ICON_ARROW_LEFT} aria-hidden />
            Back to Blogs
          </Link>
        }
      />

      <BlogForm
        formData={formData}
        onInputChange={handleInputChange}
        content={content}
        onContentChange={setContent}
        tags={tags}
        tagInput={tagInput}
        onTagInputChange={setTagInput}
        onAddTag={addTag}
        onRemoveTag={removeTag}
        onTagKeyDown={handleTagKeyDown}
        onImageUpload={handleImageUpload}
        onImageLoadingChange={setIsImageUploading}
        onMetaImageUpload={handleMetaImageUpload}
        recommendedBlogs={recommendedBlogs}
        onRecommendedChange={setRecommendedBlogs}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting || isImageUploading}
        submitLabel="Create Blog"
        error={error}
        showPublished={false}
      />
    </div>
  );
}
