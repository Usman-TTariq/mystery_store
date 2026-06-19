import ContactUsPageClient from './ContactUsPageClient';

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the COUPACHU team. We are available 24/7 to help with coupons, cashback, and account support.',
  alternates: { canonical: 'https://coupachu.com/contact-us' },
  openGraph: {
    title: 'Contact Us',
    description: 'Get in touch with the COUPACHU team. We are available 24/7 to help with coupons, cashback, and account support.',
    url: 'https://coupachu.com/contact-us',
  },
};

export default function ContactUsPage() {
  return <ContactUsPageClient />;
}
