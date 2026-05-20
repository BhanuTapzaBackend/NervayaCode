import type { Metadata } from 'next';
import { getBlogBySlug } from '@/lib/services/blog.service';
import { getPlainExcerpt } from '@/lib/utils/string.util';
import BlogDetailClient from './BlogDetailClient';

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const blog = await getBlogBySlug(slug);

    const title = blog.metaTitle || blog.title;
    const description = blog.metaDescription || blog.description || getPlainExcerpt(blog.content, 160);
    const image = blog.metaImage || blog.coverImage;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime: blog.createdAt.toISOString(),
        authors: [blog.author],
        tags: blog.tags,
        ...(image && { images: [{ url: image, width: 1200, height: 630, alt: title }] }),
      },
      twitter: {
        card: image ? 'summary_large_image' : 'summary',
        title,
        description,
        ...(image && { images: [image] }),
      },
    };
  } catch {
    return {
      title: 'Blog Not Found',
      description: 'The blog post you are looking for does not exist.',
    };
  }
}

export default function BlogDetailPage({ params }: BlogPageProps) {
  return <BlogDetailClient params={params} />;
}
