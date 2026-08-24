import Blog, { IBlog } from '@/lib/models/blog.model';
import connectDB from '@/lib/db/mongodb';
import { PAGE_SIZE_3 } from '@/lib/constants/pagination.constants';
import { ValidationError, NotFoundError } from '@/lib/utils/error.util';
import { Types, type SortOrder } from 'mongoose';

type BlogSortOption = Record<string, SortOrder | { $meta: 'textScore' }>;

export interface CreateBlogData {
  title: string;
  description?: string;
  content: string;
  coverImage?: string;
  author: string;
  tags?: string[];
  recommendedBlogs?: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaImage?: string;
  readTime?: number;
  ctaText?: string;
  ctaLink?: string;
  isPublished?: boolean;
  slug?: string;
}

export interface UpdateBlogData {
  title?: string;
  description?: string;
  content?: string;
  coverImage?: string;
  author?: string;
  tags?: string[];
  recommendedBlogs?: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaImage?: string;
  readTime?: number;
  ctaText?: string;
  ctaLink?: string;
  isPublished?: boolean;
  slug?: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function calculateReadTime(content: string): number {
  const plainText = content.replace(/<[^>]{0,10000}>/g, '');
  const wordCount = plainText.split(/\s+/).filter((word) => word.length > 0).length;
  const readTime = Math.ceil(wordCount / 200);
  return Math.max(1, readTime);
}

export async function createBlog(data: CreateBlogData): Promise<IBlog> {
  await connectDB();
  if (!data.title || !data.content || !data.author) {
    throw new ValidationError('Title, content, and author are required');
  }

  const slug = data.slug || generateSlug(data.title);

  const existingBlog = await Blog.findOne({ slug });
  if (existingBlog) {
    throw new ValidationError('A blog with this slug already exists');
  }

  const readTime = data.readTime || calculateReadTime(data.content);

  const blog = await Blog.create({
    ...data,
    slug,
    readTime,
  });

  return blog;
}

export interface AdminBlogsPaginatedResult {
  blogs: IBlog[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export async function getAllBlogsPaginated(
  options: { page?: number; limit?: number; search?: string } = {},
): Promise<AdminBlogsPaginatedResult> {
  await connectDB();
  const { page = 1, limit = PAGE_SIZE_3, search } = options;
  const filter: Record<string, unknown> = {};

  if (search && search.trim()) {
    filter.$text = { $search: search.trim() };
  }

  const skip = (Math.max(1, page) - 1) * limit;
  const sortOption: BlogSortOption = search?.trim() ? { score: { $meta: 'textScore' } } : { createdAt: -1 };
  const [blogs, total] = await Promise.all([
    Blog.find(filter).sort(sortOption).skip(skip).limit(limit).lean().exec(),
    Blog.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);

  return {
    blogs: blogs as IBlog[],
    total,
    totalPages,
    page: currentPage,
    limit,
  };
}

export interface PaginatedBlogsResult {
  blogs: IBlog[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  allTags: string[];
}

export async function getPublishedBlogsPaginated(
  options: { tags?: string[]; search?: string; page?: number; limit?: number } = {},
): Promise<PaginatedBlogsResult> {
  await connectDB();
  const { tags, search, page = 1, limit = PAGE_SIZE_3 } = options;
  const filter: Record<string, unknown> = { isPublished: true };

  if (tags && tags.length > 0) {
    filter.tags = { $in: tags };
  }

  if (search && search.trim()) {
    filter.$text = { $search: search.trim() };
  }

  const skip = (Math.max(1, page) - 1) * limit;
  const sortOption: BlogSortOption = search?.trim() ? { score: { $meta: 'textScore' } } : { createdAt: -1 };
  const [blogs, total] = await Promise.all([
    Blog.find(filter).sort(sortOption).skip(skip).limit(limit).lean().exec(),
    Blog.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const allTagsResult = await Blog.distinct('tags', { isPublished: true });
  const allTags = (allTagsResult as string[]).filter(Boolean).sort((a, b) => a.localeCompare(b));

  return {
    blogs: blogs as IBlog[],
    total,
    totalPages: totalPages,
    page: currentPage,
    limit,
    allTags,
  };
}

export async function getBlogById(id: string): Promise<IBlog> {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid Blog ID');
  }
  const blog = await Blog.findById(id).lean();
  if (!blog) {
    throw new NotFoundError('Blog not found');
  }
  return blog as IBlog;
}

export async function getBlogBySlug(slug: string): Promise<IBlog> {
  await connectDB();
  const blog = await Blog.findOne({ slug, isPublished: true }).lean();
  if (!blog) {
    throw new NotFoundError('Blog not found');
  }
  return blog as IBlog;
}

export async function updateBlog(id: string, data: UpdateBlogData): Promise<IBlog> {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid Blog ID');
  }

  if (data.slug) {
    const existingBlog = await Blog.findOne({ slug: data.slug, _id: { $ne: id } });
    if (existingBlog) {
      throw new ValidationError('A blog with this slug already exists');
    }
  }

  const updateData: UpdateBlogData = { ...data };

  if (data.content && !data.readTime) {
    updateData.readTime = calculateReadTime(data.content);
  }

  const blog = await Blog.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!blog) {
    throw new NotFoundError('Blog not found');
  }

  return blog;
}

export async function deleteBlog(id: string): Promise<{ message: string }> {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid Blog ID');
  }
  const blog = await Blog.findByIdAndDelete(id);
  if (!blog) {
    throw new NotFoundError('Blog not found');
  }
  return { message: 'Blog deleted successfully' };
}
