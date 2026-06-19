import CategoriesPageClient from './CategoriesPageClient';

export const metadata = {
  title: 'Coupon Categories – Shop by Deal Type',
  description: 'Explore coupon categories on COUPACHU. Find deals on fashion, electronics, food, travel, and more.',
  alternates: { canonical: 'https://coupachu.com/categories' },
  openGraph: {
    title: 'Coupon Categories – Shop by Deal Type',
    description: 'Explore coupon categories on COUPACHU. Find deals on fashion, electronics, food, travel, and more.',
    url: 'https://coupachu.com/categories',
  },
};

export default function CategoriesPage() {
  return <CategoriesPageClient />;
}
