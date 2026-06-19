import FaqsPageClient from './FaqsPageClient';

export const metadata = {
  title: 'Support & FAQs',
  description: 'Find answers to common questions about COUPACHU coupons, cashback, and account management.',
  alternates: { canonical: 'https://coupachu.com/faqs' },
  openGraph: {
    title: 'Support & FAQs',
    description: 'Find answers to common questions about COUPACHU coupons, cashback, and account management.',
    url: 'https://coupachu.com/faqs',
  },
};

export default function FAQsPage() {
  return <FaqsPageClient />;
}
