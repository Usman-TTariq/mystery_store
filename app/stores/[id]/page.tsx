import { Metadata } from 'next';
import StorePageClient from './StorePageClient';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { getStoreBySlug, getStoreById } = await import('@/lib/services/storeService');
  let store = await getStoreBySlug(id).catch(() => null);
  if (!store) {
    store = await getStoreById(id).catch(() => null);
  }

  const title = store?.seoTitle || (store?.name ? `${store.name} Coupons & Promo Codes ${new Date().getFullYear()}` : 'Store Not Found');
  const description = store?.seoDescription || (store?.name ? `Find the latest ${store.name} coupons, promo codes, and cashback offers on COUPACHU. Verified deals updated daily.` : '');
  const canonical = `https://coupachu.com/stores/${id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  };
}

export default async function StorePage({ params }: Props) {
  const resolvedParams = await params;
  return <StorePageClient params={resolvedParams} />;
}
