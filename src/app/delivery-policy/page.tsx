'use client';

import { GlobalLoader } from '@/components/common/GlobalLoader';
import dynamic from 'next/dynamic';

const DeliveryPolicy = dynamic(() => import('./DeliveryPolicyContent'), {
  ssr: true,
  loading: () => (
    <div
      style={{
        minHeight: '100vh',
        paddingTop: 'var(--navbar-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <GlobalLoader centerPage />
    </div>
  ),
});

export default DeliveryPolicy;
