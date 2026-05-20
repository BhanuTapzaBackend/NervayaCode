import api from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';
import type { Blog, BlogFormData } from '@/types/blog.types';

export interface BlogsListResponse {
  blogs: Blog[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  allTags?: string[];
}

export interface AdminBlogsListResponse {
  blogs: Blog[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const blogsApi = {
  getAll: (params?: {
    tags?: string[];
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<BlogsListResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.tags && params.tags.length > 0) {
      params.tags.forEach((tag) => searchParams.append('tag', tag));
    }
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return api.get(`/blogs${query}`) as Promise<ApiResponse<BlogsListResponse>>;
  },

  getAllForAdmin: (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<AdminBlogsListResponse>> => {
    const searchParams = new URLSearchParams({ admin: 'true' });
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    return api.get(`/blogs?${searchParams.toString()}`) as Promise<ApiResponse<AdminBlogsListResponse>>;
  },

  getBySlug: (slug: string): Promise<ApiResponse<Blog>> => {
    return api.get(`/blogs/slug/${slug}`) as Promise<ApiResponse<Blog>>;
  },

  getById: (id: string): Promise<ApiResponse<Blog>> => {
    return api.get(`/blogs/${id}`) as Promise<ApiResponse<Blog>>;
  },

  create: (data: BlogFormData & { content?: string; tags?: string[] }): Promise<ApiResponse<Blog>> => {
    return api.post('/blogs', data) as Promise<ApiResponse<Blog>>;
  },

  update: (
    id: string,
    data: Partial<BlogFormData> & { content?: string; tags?: string[] },
  ): Promise<ApiResponse<Blog>> => {
    return api.put(`/blogs/${id}`, data) as Promise<ApiResponse<Blog>>;
  },

  delete: (id: string): Promise<ApiResponse<null>> => {
    return api.delete(`/blogs/${id}`) as Promise<ApiResponse<null>>;
  },
};
