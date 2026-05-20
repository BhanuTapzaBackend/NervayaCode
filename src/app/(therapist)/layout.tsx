'use client';

import { TherapistProvider } from '@/context/TherapistContext';

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  return <TherapistProvider>{children}</TherapistProvider>;
}
