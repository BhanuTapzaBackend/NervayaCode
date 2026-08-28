'use client';

import { TherapistProvider } from '@/context/TherapistContext';
import { TherapistDashboardProvider } from '@/context/TherapistDashboardContext';
import { TherapistShell } from '@/components/Therapist/TherapistShell';

/**
 * Chrome is mounted here, not per page.
 *
 * Previously every therapist page imported LazySidebar itself, which meant the
 * layout was re-created on each navigation and the global `.main-content`
 * offset was applied before the sidebar chunk had even loaded.
 */
export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  return (
    <TherapistProvider>
      <TherapistDashboardProvider>
        <TherapistShell>{children}</TherapistShell>
      </TherapistDashboardProvider>
    </TherapistProvider>
  );
}
