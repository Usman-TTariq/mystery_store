import CouponsPageClient from './CouponsPageClient';

export const metadata = {
  title: 'Latest Coupons & Promo Codes',
  description: 'Browse the latest verified coupons and promo codes on COUPACHU. Updated daily with fresh discounts from top brands.',
  alternates: { canonical: 'https://coupachu.com/coupons' },
  openGraph: {
    title: 'Latest Coupons & Promo Codes',
    description: 'Browse the latest verified coupons and promo codes on COUPACHU. Updated daily with fresh discounts from top brands.',
    url: 'https://coupachu.com/coupons',
  },
};

export default function CouponsPage() {
  return <CouponsPageClient />;
}
