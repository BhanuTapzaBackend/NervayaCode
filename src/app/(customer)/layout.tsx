'use client';

import { CustomerProvider } from '@/context/CustomerContext';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <CustomerProvider>{children}</CustomerProvider>;
}
