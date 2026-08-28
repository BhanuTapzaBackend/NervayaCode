'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginSignupForm from '@/components/LoginSignupForm';
import { validateReturnUrl } from '@/utils/returnUrl';

/**
 * The OAuth routes redirect here with a generic code rather than Google's own
 * error text — the raw message can leak deployment configuration, and none of
 * it is actionable for the user.
 */
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_cancelled: 'Google sign-in was cancelled. You can try again or use your WhatsApp number.',
  google_state: 'That sign-in link expired. Please try signing in with Google again.',
  google_session: "We couldn't complete your sign-in. Please try again.",
  google_unavailable: 'Google sign-in is unavailable right now. Please use your WhatsApp number.',
  google_failed: "We couldn't sign you in with Google. Please try again.",
  google_email_conflict:
    'An account already uses that email. Sign in with your WhatsApp number, then add Google from your account.',
};

function LoginContent() {
  const searchParams = useSearchParams();
  const returnUrlParam = searchParams.get('returnUrl');
  const returnUrl = validateReturnUrl(returnUrlParam) ?? undefined;

  const errorCode = searchParams.get('error');
  const initialError = errorCode ? (OAUTH_ERROR_MESSAGES[errorCode] ?? OAUTH_ERROR_MESSAGES.google_failed) : undefined;

  return <LoginSignupForm initialMode="login" returnUrl={returnUrl} initialError={initialError} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
