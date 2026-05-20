'use client';

import { AdminProvider } from '@/context/AdminContext';

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return <AdminProvider>{children}</AdminProvider>;
}
