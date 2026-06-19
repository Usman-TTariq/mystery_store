import StoresPageClient from './StoresPageClient';

export const metadata = {
  title: 'All Stores – Coupons & Cashback',
  description: 'Browse all stores on COUPACHU and find the best coupons, discount codes, and cashback deals in one place.',
  alternates: { canonical: 'https://coupachu.com/stores' },
  openGraph: {
    title: 'All Stores – Coupons & Cashback',
    description: 'Browse all stores on COUPACHU and find the best coupons, discount codes, and cashback deals in one place.',
    url: 'https://coupachu.com/stores',
  },
};

export default function StoresPage() {
  return <StoresPageClient />;
}
