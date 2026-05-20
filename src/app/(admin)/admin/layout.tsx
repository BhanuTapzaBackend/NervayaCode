'use client';

import Sidebar from '@/components/Sidebar/LazySidebar';
import containerStyles from './styles.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Sidebar>
      <div className={containerStyles.container}>{children}</div>
    </Sidebar>
  );
}
