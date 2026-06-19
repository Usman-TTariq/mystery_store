import AboutUsPageClient from './AboutUsPageClient';

export const metadata = {
  title: 'About COUPACHU – Our Story & Mission',
  description: 'Learn about COUPACHU – the platform dedicated to bringing you the best coupons, cashback, and exclusive deals every day.',
  alternates: { canonical: 'https://coupachu.com/about-us' },
  openGraph: {
    title: 'About COUPACHU – Our Story & Mission',
    description: 'Learn about COUPACHU – the platform dedicated to bringing you the best coupons, cashback, and exclusive deals every day.',
    url: 'https://coupachu.com/about-us',
  },
};

export default function AboutUsPage() {
  return <AboutUsPageClient />;
}
