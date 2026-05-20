import type { Metadata, Viewport } from 'next';
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import Script from 'next/script';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import { EngagementTracker } from '@/components/EngagementTracker';
import BodyRouteClass from '@/components/BodyRouteClass';
import { IMAGES } from '@/utils/imageConstants';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nervaya.com'),
  title: {
    default: 'Nervaya',
    template: '%s | Nervaya',
  },
  description: 'Nervaya - Your Mental Health Companion',
  applicationName: 'Nervaya',
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Nervaya - Your Mental Health Companion',
    description: 'Nervaya - Your Mental Health Companion',
    url: '/',
    siteName: 'Nervaya',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nervaya',
  },
  icons: {
    icon: [
      { url: '/icons/pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/pwa/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#5322D5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <head>
        <Script id="data-layer-init" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
              user_context: {
                logged_in: false,
                internal_user_id: null,
                crm_contact_id: null,
                lifecycle_stage: "anonymous",
                user_type: "guest"
              }
            });
          `}
        </Script>
      </head>
      <body style={{ '--bg-main': `url(${IMAGES.BACKGROUND_MAIN})` } as React.CSSProperties}>
        <Providers>
          <BodyRouteClass />
          <EngagementTracker />
          {children}
        </Providers>
        {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
        {gaId && !gtmId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
