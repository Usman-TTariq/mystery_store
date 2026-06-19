import BlogsPageClient from './BlogsPageClient';

export const metadata = {
  title: 'Blog – Savings Tips & Deal News',
  description: 'Read the COUPACHU blog for money-saving tips, coupon guides, and the latest cashback news.',
  alternates: { canonical: 'https://coupachu.com/blogs' },
  openGraph: {
    title: 'Blog – Savings Tips & Deal News',
    description: 'Read the COUPACHU blog for money-saving tips, coupon guides, and the latest cashback news.',
    url: 'https://coupachu.com/blogs',
  },
};

export default function BlogsPage() {
  return <BlogsPageClient />;
}
