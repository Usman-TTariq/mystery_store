'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getStoreById, getStoreBySlug, Store, getStores } from '@/lib/services/storeService';
import { getCouponsByStoreId, Coupon } from '@/lib/services/couponService';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import CouponPopup from '@/app/components/CouponPopup';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import { ExternalLink, Tag, CheckCircle, Calendar, Copy, Star, ArrowRight } from 'lucide-react';

// Helper function to get favicon URL from store data
const getStoreFaviconUrl = (store: Store): string => {
  let domain = '';

  if (store.websiteUrl) {
    try {
      domain = new URL(store.websiteUrl).hostname.replace('www.', '');
    } catch (e) {
      console.error('Invalid websiteUrl:', store.websiteUrl);
    }
  } else if (store.trackingLink) {
    try {
      domain = new URL(store.trackingLink).hostname.replace('www.', '');
    } catch (e) {
      console.error('Invalid trackingLink:', store.trackingLink);
    }
  }

  // If no domain found, try to construct from store name
  if (!domain && store.name) {
    // Check if name already looks like a domain (contains a dot)
    const nameLower = store.name.toLowerCase();
    if (nameLower.includes('.')) {
      // Name already looks like a domain, use it as-is
      domain = nameLower.replace(/\s+/g, '');
    } else {
      // Convert store name to potential domain (e.g., "SamBoat" -> "samboat.com")
      domain = nameLower.replace(/\s+/g, '') + '.com';
    }
  }

  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
};

export default function StoreDetailPage() {
  const params = useParams();
  const idOrSlug = params.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (store) {
      const pageTitle = store.seoTitle || `${store.name} - COUPACHU`;
      document.title = pageTitle;

      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', store.seoDescription || store.description || `Get exclusive coupons and deals from ${store.name}. Save money with verified promo codes!`);
    }
  }, [store]);

  useEffect(() => {
    const fetchStoreData = async () => {
      setLoading(true);
      try {
        let storeData = await getStoreBySlug(idOrSlug);

        if (!storeData) {
          storeData = await getStoreById(idOrSlug);
        }

        if (!storeData) {
          try {
            const res = await fetch('/api/stores/supabase');
            if (res.ok) {
              const data = await res.json();
              const supabaseList: Store[] = Array.isArray(data?.stores) ? (data.stores as Store[]) : [];
              const matched = supabaseList.find((s) => s.slug === idOrSlug || s.id === idOrSlug);
              if (matched) {
                storeData = matched;
              }
            }
          } catch (supabaseError) {
            console.error('Error fetching store from Supabase list:', supabaseError);
          }
        }

        if (storeData) {
          console.log('Store Data Loaded:', storeData);
          console.log('Logo URL:', storeData.logoUrl);
          console.log('Tracking Link:', storeData.trackingLink);
          console.log('Tracking URL:', storeData.trackingUrl);
          console.log('Website URL:', storeData.websiteUrl);
          setStore(storeData);

          if (storeData.id) {
            try {
              const [firebaseCoupons, supabaseResponse, storesData] = await Promise.all([
                getCouponsByStoreId(storeData.id),
                fetch('/api/coupons/supabase').then((res) => res.json()).catch(() => ({ success: false, coupons: [] })),
                getStores()
              ]);

              const firebaseActive = (firebaseCoupons || []).filter((coupon) => coupon.isActive);
              const supabaseList: Coupon[] = Array.isArray(supabaseResponse?.coupons) ? (supabaseResponse.coupons as Coupon[]) : [];
              const supabaseForStore = supabaseList.filter((c) => Array.isArray(c.storeIds) && c.storeIds.includes(storeData!.id as string));

              setCoupons([...firebaseActive, ...supabaseForStore]);
              setAllStores(storesData);
            } catch (couponErr) {
              console.error('Error fetching coupons for store:', couponErr);
              setCoupons([]);
            }
          }
        } else {
          setStore(null);
        }
      } catch (error) {
        console.error('Error fetching store data:', error);
        setStore(null);
      } finally {
        setLoading(false);
      }
    };

    if (idOrSlug) {
      fetchStoreData();
    }
  }, [idOrSlug]);

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedCode(text);
        setTimeout(() => setCopiedCode(null), 2000);
      }).catch((err) => {
        console.error('Clipboard API failed:', err);
      });
    }
  };

  const handleCouponClick = (coupon: Coupon) => {
    if (coupon.couponType === 'code' && coupon.code) {
      const codeToCopy = coupon.code.trim();
      copyToClipboard(codeToCopy);
    }

    setSelectedCoupon(coupon);
    setShowPopup(true);

    if (coupon.url && coupon.url.trim()) {
      setTimeout(() => {
        window.open(coupon.url, '_blank', 'noopener,noreferrer');
      }, 500);
    }
  };

  const handleContinue = () => {
    if (selectedCoupon?.url) {
      window.open(selectedCoupon.url, '_blank', 'noopener,noreferrer');
    }
    setShowPopup(false);
    setSelectedCoupon(null);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return null;
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (error) {
      return null;
    }
  };

  const getLastTwoDigits = (coupon: Coupon): string | null => {
    if ((coupon.couponType || 'deal') === 'code' && coupon.code) {
      const code = coupon.code.trim();
      if (code.length >= 2) {
        return code.slice(-2);
      }
    }
    return null;
  };

  // Get related stores (exclude current store)
  const relatedStores = allStores.filter(s => s.id !== store?.id).slice(0, 8);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B453C] mb-4"></div>
            <p className="text-gray-600">Loading store...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Store Not Found</h1>
            <p className="text-gray-600 mb-6">The store you're looking for doesn't exist.</p>
            <Link href="/stores" className="inline-block px-6 py-3 bg-gradient-to-r from-[#0B453C] to-[#0f5c4e] text-white rounded-lg hover:shadow-lg transition-all">
              Browse All Stores
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Navbar />

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-[#0B453C]/10 to-[#0f5c4e]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-green-300/5 rounded-full blur-3xl"></div>
      </div>

      {/* Breadcrumbs */}
      <div className="relative z-10">
        <Breadcrumbs
          items={[
            { label: 'Stores', href: '/stores' },
            { label: store?.name || 'Store Details' }
          ]}
        />
      </div>

      {/* Store Header Section */}
      <div className="relative w-full py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Store Logo */}
            <motion.div
              className="flex-shrink-0"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-white rounded-2xl shadow-xl p-6 flex items-center justify-center border border-gray-100">
                <img
                  src={store.logoUrl || getStoreFaviconUrl(store)}
                  alt={store.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const faviconUrl = getStoreFaviconUrl(store);
                    // If logoUrl failed, try favicon
                    if (target.src !== faviconUrl && store.logoUrl) {
                      target.src = faviconUrl;
                    } else {
                      // If both failed, show gradient fallback
                      const parent = target.parentElement;
                      if (parent) {
                        target.style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-full bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] rounded-xl flex items-center justify-center';
                        fallback.innerHTML = `<span class="text-white font-bold text-4xl">${store.name.charAt(0).toUpperCase()}</span>`;
                        parent.appendChild(fallback);
                      }
                    }
                  }}
                />
              </div>
            </motion.div>

            {/* Store Info */}
            <div className="flex-1 text-center sm:text-left">
              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="bg-gradient-to-r from-[#0B453C] to-[#0f5c4e] bg-clip-text text-transparent">
                  {store.subStoreName || store.name}
                </span>
              </motion.h1>

              {store.description && (
                <motion.p
                  className="text-gray-600 text-base sm:text-lg max-w-2xl mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  {store.description}
                </motion.p>
              )}

              <motion.div
                className="flex flex-wrap items-center justify-center sm:justify-start gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span>Verified Store</span>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  <Tag className="w-4 h-4" />
                  <span>{coupons.length} Active Offers</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                  <span className="text-gray-600 text-sm ml-1">(4.9)</span>
                </div>
              </motion.div>


              <motion.a
                href={store.trackingLink || store.trackingUrl || store.websiteUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-[#0B453C] to-[#0f5c4e] text-white rounded-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                onClick={() => {
                  console.log('Visit Store clicked');
                  console.log('Using URL:', store.trackingLink || store.trackingUrl || store.websiteUrl || 'No URL available');
                }}
              >
                <ExternalLink className="w-5 h-5" />
                Visit Store
              </motion.a>
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Section */}
      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Available <span className="bg-gradient-to-r from-[#0B453C] to-[#0f5c4e] bg-clip-text text-transparent">Coupons</span>
            </h2>
            <p className="text-gray-600">
              {coupons.length > 0
                ? `Found ${coupons.length} active coupon${coupons.length !== 1 ? 's' : ''}`
                : 'No active coupons available at the moment'}
            </p>
          </div>

          {coupons.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-md">
              <p className="text-gray-500 text-lg mb-4">No coupons available for this store right now.</p>
              <Link href="/stores" className="inline-block px-6 py-3 bg-gradient-to-r from-[#0B453C] to-[#0f5c4e] text-white rounded-lg hover:shadow-lg transition-all">
                Browse Other Stores
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {coupons.map((coupon, index) => {
                const isExpired = coupon.expiryDate && coupon.expiryDate.toDate() < new Date();

                return (
                  <motion.div
                    key={coupon.id}
                    className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-[#0B453C]/30 cursor-pointer"
                    onClick={() => !isExpired && handleCouponClick(coupon)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-transparent to-emerald-50/30 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                            {coupon.storeName || coupon.title || 'Special Offer'}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              <span className="font-medium">Verified</span>
                            </div>
                            {coupon.expiryDate && (
                              <div className="flex items-center gap-1 text-gray-500 text-sm">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(coupon.expiryDate) || '31 Dec, 2025'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {coupon.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {coupon.description}
                        </p>
                      )}

                      {/* Button */}
                      {isExpired ? (
                        <div className="bg-red-50 text-red-700 text-sm font-semibold px-4 py-2.5 rounded-lg text-center border border-red-200">
                          Expired
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCouponClick(coupon);
                          }}
                          className="relative w-full bg-gradient-to-r from-[#0B453C] to-[#0f5c4e] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 group/btn hover:shadow-lg flex items-center justify-center gap-2 overflow-hidden"
                        >
                          <span className="flex items-center gap-2">
                            {coupon.couponType === 'code' ? (
                              <>
                                <Copy className="w-4 h-4" />
                                {copiedCode === coupon.code ? 'Copied!' : (coupon.getCodeText || 'Get Code')}
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4" />
                                {coupon.getDealText || 'Get Deal'}
                              </>
                            )}
                          </span>
                          {getLastTwoDigits(coupon) && (
                            <div className="hidden sm:flex w-0 opacity-0 group-hover/btn:w-16 group-hover/btn:opacity-100 transition-all duration-300 items-center justify-center border-l-2 border-dashed border-white/70 ml-2 pl-2">
                              <span className="text-white font-bold text-xs">...{getLastTwoDigits(coupon)}</span>
                            </div>
                          )}
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Related Stores Section */}
      {relatedStores.length > 0 && (
        <div className="relative w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Related <span className="bg-gradient-to-r from-[#0B453C] to-[#0f5c4e] bg-clip-text text-transparent">Stores</span>
              </h2>
              <p className="text-gray-600">Discover more amazing deals from similar stores</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {relatedStores.map((relatedStore, index) => (
                <Link
                  key={relatedStore.id}
                  href={`/stores/${relatedStore.slug || relatedStore.id}`}
                  className="group"
                >
                  <motion.div
                    className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#0B453C]/30 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="w-16 h-16 mx-auto mb-3 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                      <img
                        src={relatedStore.logoUrl || getStoreFaviconUrl(relatedStore)}
                        alt={relatedStore.name}
                        className="max-w-full max-h-full object-contain p-2"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const faviconUrl = getStoreFaviconUrl(relatedStore);
                          // If logoUrl failed, try favicon
                          if (target.src !== faviconUrl && relatedStore.logoUrl) {
                            target.src = faviconUrl;
                          } else {
                            // If both failed, show gradient fallback
                            const parent = target.parentElement;
                            if (parent) {
                              target.style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.className = 'w-16 h-16 rounded-lg bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] flex items-center justify-center';
                              fallback.innerHTML = `<span class="text-white font-bold text-xl">${relatedStore.name.charAt(0)}</span>`;
                              parent.appendChild(fallback);
                            }
                          }
                        }}
                      />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-[#0B453C] transition-colors">
                      {relatedStore.name}
                    </h3>
                  </motion.div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/stores"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#0B453C] text-[#0B453C] rounded-lg hover:bg-[#0B453C] hover:text-white transition-all duration-300 font-semibold"
              >
                View All Stores
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Back to Stores Link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Link
          href="/stores"
          className="inline-flex items-center gap-2 text-[#0B453C] hover:text-[#0f5c4e] font-semibold transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to All Stores</span>
        </Link>
      </div>

      {/* Footer */}
      <Footer />

      {/* Coupon Popup */}
      <CouponPopup
        coupon={selectedCoupon}
        isOpen={showPopup}
        onClose={() => {
          setShowPopup(false);
          setSelectedCoupon(null);
        }}
        onContinue={handleContinue}
      />
    </div>
  );
}
