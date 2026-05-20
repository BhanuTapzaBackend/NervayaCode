import React from 'react';
import ResetSleepAssessmentForm from '@/components/Admin/ResetSleepAssessmentForm';

export const metadata = {
  title: 'Reset Sleep Assessment | Admin',
};

const ResetSleepAssessmentPage = () => {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <ResetSleepAssessmentForm />
    </div>
  );
};

export default ResetSleepAssessmentPage;
