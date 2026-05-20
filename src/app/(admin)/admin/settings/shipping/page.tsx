import React from 'react';
import ShippingPolicyForm from '@/components/Admin/Settings/ShippingPolicyForm';

export const metadata = {
  title: 'Shipping Settings | Admin',
};

const ShippingSettingsPage = () => {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <ShippingPolicyForm />
    </div>
  );
};

export default ShippingSettingsPage;
