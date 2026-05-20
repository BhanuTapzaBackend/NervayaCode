'use client';

import { useSearchParams } from 'next/navigation';
import LoginSignupForm from '@/components/LoginSignupForm';
import { validateReturnUrl } from '@/utils/returnUrl';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const returnUrlParam = searchParams.get('returnUrl');
  const returnUrl = validateReturnUrl(returnUrlParam) ?? undefined;

  return <LoginSignupForm initialMode="login" returnUrl={returnUrl} />;
}
