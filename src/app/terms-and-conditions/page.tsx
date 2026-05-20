import { Metadata } from 'next';
import TermsConditionsContent from './TermsConditionsContent';

export const metadata: Metadata = {
  title: 'Terms & Conditions | NERVAYA',
  description: 'Read the Terms & Conditions for using NERVAYA’s website, services, and products.',
};

export default function TermsConditionsPage() {
  return <TermsConditionsContent />;
}
