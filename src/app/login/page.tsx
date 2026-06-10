'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginSignupForm from '@/components/LoginSignupForm';
import { validateReturnUrl } from '@/utils/returnUrl';

function LoginContent() {
  const searchParams = useSearchParams();
  const returnUrlParam = searchParams.get('returnUrl');
  const returnUrl = validateReturnUrl(returnUrlParam) ?? undefined;

  return <LoginSignupForm initialMode="login" returnUrl={returnUrl} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
