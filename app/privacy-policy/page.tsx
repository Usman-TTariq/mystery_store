import PrivacyPolicyPageClient from './PrivacyPolicyPageClient';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Read COUPACHU privacy policy to understand how we collect, use, and protect your personal information.',
  alternates: { canonical: 'https://coupachu.com/privacy-policy' },
  openGraph: {
    title: 'Privacy Policy',
    description: 'Read COUPACHU privacy policy to understand how we collect, use, and protect your personal information.',
    url: 'https://coupachu.com/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyPageClient />;
}
