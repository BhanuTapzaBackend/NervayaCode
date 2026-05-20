import React from 'react';
import SleepPlanForm from '@/components/Admin/Settings/SleepPlanForm';

export const metadata = {
  title: 'Sleep Plan Settings | Admin',
};

const SleepPlanSettingsPage = () => {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <SleepPlanForm />
    </div>
  );
};

export default SleepPlanSettingsPage;
