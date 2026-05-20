export interface Blog {
  _id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string[];
  recommendedBlogs: string[];
  metaTitle: string;
  metaDescription: string;
  metaImage: string;
  readTime: number;
  ctaText: string;
  ctaLink: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogFormData {
  title: string;
  slug?: string;
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
}

export interface BlogListItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  author: string;
  tags: string[];
  readTime: number;
  isPublished: boolean;
  createdAt: Date;
}
