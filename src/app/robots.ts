import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nervaya.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/therapist/', '/api/'], // Prevent crawling of internal panels and API routes
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
