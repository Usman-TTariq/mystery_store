import TermsAndConditionsPageClient from './TermsAndConditionsPageClient';

export const metadata = {
  title: 'Terms and Conditions',
  description: 'Review the terms and conditions for using COUPACHU coupon and cashback platform.',
  alternates: { canonical: 'https://coupachu.com/terms-and-conditions' },
  openGraph: {
    title: 'Terms and Conditions',
    description: 'Review the terms and conditions for using COUPACHU coupon and cashback platform.',
    url: 'https://coupachu.com/terms-and-conditions',
  },
};

export default function TermsAndConditionsPage() {
  return <TermsAndConditionsPageClient />;
}
