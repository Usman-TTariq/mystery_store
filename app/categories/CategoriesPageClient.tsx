'use client';

import Navbar from '@/app/components/Navbar';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import CategoriesGrid from '@/app/components/CategoriesGrid';
import Newsletter from '@/app/components/Newsletter';
import Footer from '@/app/components/Footer';
import PageHeroBanner from '@/app/components/PageHeroBanner';

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <PageHeroBanner
        src="/banners/category-banner.webp"
        alt="Coupon Categories – Shop by Deal Type"
        mobileFocus="right"
      />

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Categories' }
        ]}
      />

      {/* Categories Grid Section */}
      <CategoriesGrid />

      {/* Newsletter Subscription Section */}
      <Newsletter />

      {/* Footer */}
      <Footer />
    </div>
  );
}
