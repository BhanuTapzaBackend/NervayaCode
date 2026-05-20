import { Metadata } from 'next';
import ReturnPolicyContent from './ReturnPolicyContent';

export const metadata: Metadata = {
  title: 'Return, Refund & Cancellation Policy | Nervaya',
  description: 'Understand the conditions for returns, refunds, replacements, and cancellations at Nervaya.',
};

export default function ReturnPolicyPage() {
  return <ReturnPolicyContent />;
}
