'use client';

import dynamic from 'next/dynamic';
import type React from 'react';

const Sidebar = dynamic(() => import('./Sidebar'), {
  ssr: false,
  loading: () => null,
});

export default function LazySidebar(props: { children?: React.ReactNode; className?: string }) {
  return <Sidebar {...props} />;
}
