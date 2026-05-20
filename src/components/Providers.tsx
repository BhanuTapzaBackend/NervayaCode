'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import { CartProvider } from '@/context/CartContext';
import ScrollToTop from '@/components/ScrollToTop/ScrollToTop';
import { Toaster } from 'sonner';
import Navbar from '@/components/Navbar';

import { SidebarProvider } from '@/context/SidebarContext';
import { FloatingActionsProvider } from '@/context/FloatingActionsContext';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import { WriteReviewModal } from '@/components/WriteReviewModal';
import { FloatingActionsTrigger } from '@/components/FloatingActionsTrigger';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <CartProvider>
        <SidebarProvider>
          <ScrollToTop />
          <Navbar />
          <AuthGuard>{children}</AuthGuard>
          <Toaster
            richColors
            position="top-center"
            closeButton
            toastOptions={{
              className: 'sonner-toast',
              style: {
                borderRadius: '12px',
                fontFamily: 'var(--font-sans)',
                boxShadow: 'var(--color-card-shadow)',
                padding: '12px 16px',
              },
            }}
          />
          <FloatingActionsProvider>
            <WriteReviewModal />
            <FeedbackWidget />
            <FloatingActionsTrigger />
          </FloatingActionsProvider>
        </SidebarProvider>
      </CartProvider>
    </AuthProvider>
  );
}
