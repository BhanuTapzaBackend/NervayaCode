'use client';

import Script from 'next/script';

interface RazorpayCheckoutScriptProps {
  onLoad?: () => void;
}

export default function RazorpayCheckoutScript({ onLoad }: RazorpayCheckoutScriptProps) {
  return <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" onLoad={onLoad} />;
}
