'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getActiveCoupons, Coupon } from '@/lib/services/couponService';
import { getCategories, Category } from '@/lib/services/categoryService';
import { getStores, Store } from '@/lib/services/storeService';
import { addNotification } from '@/lib/services/notificationsService';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import Newsletter from '@/app/components/Newsletter';
import CouponPopup from '@/app/components/CouponPopup';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import Link from 'next/link';

// Helper function to extract domain from URL
const extractDomain = (url: string): string | null => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
};

// Get favicon URL with fallback to tracking link (matching homepage implementation)
const getFaviconUrl = (store: Store): string | null => {
  // Try website URL first
  if (store.websiteUrl) {
    const domain = extractDomain(store.websiteUrl);
    if (domain) return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }

  // Fallback to tracking link
  if (store.trackingLink) {
    const domain = extractDomain(store.trackingLink);
    if (domain) return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }

  // Last resort: Try to construct domain from store name
  if (store.name) {
    const nameLower = store.name.toLowerCase().replace(/\s+/g, '');
    const domain = nameLower.includes('.') ? nameLower : `${nameLower}.com`;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }

  return null;
};

function CouponsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const storeParam = searchParams.get('store');

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [supabaseCoupons, setSupabaseCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || '');
  const [selectedStore, setSelectedStore] = useState<string>(storeParam || '');
  const [revealedCoupons, setRevealedCoupons] = useState<Set<string>>(new Set());
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [supabaseStores, setSupabaseStores] = useState<Store[]>([]);
  // console.log("coupons: ", coupons);

  useEffect(() => {
    document.title = 'All Coupons - COUPACHU';

    const fetchData = async () => {
      setLoading(true);
      try {
        const [couponsData, categoriesData, storesData, supabaseResponse] = await Promise.all([
          getActiveCoupons(),
          getCategories(),
          getStores(),
          fetch('/api/coupons/supabase')
            .then((res) => res.json())
            .catch((err) => {
              console.error('Error fetching Supabase coupons:', err);
              return { success: false, coupons: [] };
            }),
        ]);

        const supabaseList: Coupon[] = Array.isArray(supabaseResponse?.coupons)
          ? (supabaseResponse.coupons as Coupon[])
          : [];

        setSupabaseCoupons(supabaseList);
        setCoupons([...couponsData, ...supabaseList]);
        setCategories(categoriesData);
        setStores(storesData);
      } catch (error) {
        console.error('Error fetching coupons data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...coupons];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(coupon => coupon.categoryId === selectedCategory);
    }

    // Filter by store
    if (selectedStore) {
      filtered = filtered.filter(coupon => {
        // Check if coupon is associated with selected store via storeIds
        if (coupon.storeIds && coupon.storeIds.includes(selectedStore)) {
          return true;
        }
        // Also check by storeName for backward compatibility
        const store = stores.find(s => s.id === selectedStore);
        if (store && coupon.storeName === store.name) {
          return true;
        }
        return false;
      });
    }

    setFilteredCoupons(filtered);
  }, [selectedCategory, selectedStore, coupons, stores]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return null;
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  // Get last 2 digits of code for code type coupons
  const getCodePreview = (coupon: Coupon): string => {
    if ((coupon.couponType || 'deal') === 'code' && coupon.code) {
      return coupon.getCodeText || 'Get Code';
    }
    return coupon.getDealText || 'Get Deal';
  };

  // Get last 2 digits for hover display
  const getLastTwoDigits = (coupon: Coupon): string | null => {
    if ((coupon.couponType || 'deal') === 'code' && coupon.code) {
      const code = coupon.code.trim();
      if (code.length >= 2) {
        return code.slice(-2);
      }
    }
    return null;
  };

  const handleGetDeal = (coupon: Coupon, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Copy code to clipboard FIRST (before showing popup) - only for code type
    if (coupon.couponType === 'code' && coupon.code) {
      const codeToCopy = coupon.code.trim();
      copyToClipboard(codeToCopy);
    }

    // Mark coupon as revealed
    if (coupon.id) {
      setRevealedCoupons(prev => new Set(prev).add(coupon.id!));
    }

    // Show popup
    setSelectedCoupon(coupon);
    setShowPopup(true);

    // Automatically open URL in new tab after a short delay (to ensure popup is visible first)
    if (coupon.url && coupon.url.trim()) {
      setTimeout(() => {
        window.open(coupon.url, '_blank', 'noopener,noreferrer');
      }, 500);
    }
  };

  const handlePopupContinue = () => {
    if (selectedCoupon?.url) {
      window.open(selectedCoupon.url, '_blank', 'noopener,noreferrer');
    }
    setShowPopup(false);
    setSelectedCoupon(null);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    setSelectedCoupon(null);
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        addNotification({
          title: 'Code Copied!',
          message: `Coupon code "${text}" has been copied to clipboard.`,
          type: 'success'
        });
      }).catch((err) => {
        console.error('Clipboard API failed:', err);
        copyToClipboardFallback(text);
      });
    } else {
      copyToClipboardFallback(text);
    }
  };

  const copyToClipboardFallback = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '0';
      textArea.style.top = '0';
      textArea.style.width = '2px';
      textArea.style.height = '2px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.style.zIndex = '-1';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999);

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        addNotification({
          title: 'Code Copied!',
          message: `Coupon code "${text}" has been copied to clipboard.`,
          type: 'success'
        });
      } else {
        addNotification({
          title: 'Copy Manually',
          message: `Code: ${text} (Please copy manually)`,
          type: 'info'
        });
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      addNotification({
        title: 'Copy Manually',
        message: `Code: ${text} (Please copy manually)`,
        type: 'info'
      });
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedStore('');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Coupons' }
        ]}
      />

      <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4">
              All <span className="text-[#0B453C]">Coupons</span>
            </h1>
            <p className="text-center text-gray-600 text-sm sm:text-base">
              Discover amazing deals and discounts from your favorite stores
            </p>
          </div>

          {/* 3-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT SIDEBAR */}
            <div className="lg:col-span-3 space-y-6">
              {/* Categories Filter */}
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0B453C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Categories
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === '' ? 'bg-green-50 text-[#0B453C] font-semibold' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    All Categories ({coupons.length})
                  </button>
                  {categories.map((category) => {
                    const count = coupons.filter(c => c.categoryId === category.id).length;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id || '')}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${selectedCategory === category.id ? 'bg-green-50 text-[#0B453C] font-semibold' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                      >
                        <span className="truncate">{category.name}</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Popular Stores */}
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0B453C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Popular Stores
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {stores.slice(0, 10).map((store) => {
                    const logoUrl = getFaviconUrl(store);
                    return (
                      <Link
                        key={store.id}
                        href={store.slug ? `/stores/${store.slug}` : `/stores/${store.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={store.name}
                            className="w-10 h-10 rounded-lg object-contain bg-gray-50"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0B453C] to-emerald-600 flex items-center justify-center text-white font-bold">${store.name.charAt(0)}</div>`;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0B453C] to-emerald-600 flex items-center justify-center text-white font-bold">
                            {store.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-700 group-hover:text-[#0B453C] truncate">{store.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Filter Stats */}
              {(selectedCategory || selectedStore) && (
                <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-green-900">Active Filters</span>
                    <button
                      onClick={clearFilters}
                      className="text-xs text-[#0B453C] hover:text-emerald-700 font-semibold"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="text-xs text-green-700">
                    Showing {filteredCoupons.length} of {coupons.length} coupons
                  </div>
                </div>
              )}
            </div>

            {/* MAIN CONTENT */}
            <div className="lg:col-span-6">
              {/* Store Filter */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
                <label htmlFor="store" className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by Store
                </label>
                <select
                  id="store"
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B453C]"
                >
                  <option value="">All Stores</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Coupons List */}
              {loading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 h-24 animate-pulse">
                      <div className="flex gap-4">
                        <div className="h-16 w-16 bg-gray-200 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredCoupons.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 text-lg mb-4">No coupons found.</p>
                  {(selectedCategory || selectedStore) && (
                    <button
                      onClick={clearFilters}
                      className="text-[#0B453C] hover:text-emerald-700 font-semibold"
                    >
                      Clear filters to see all coupons
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCoupons.map((coupon) => {
                    const isRevealed = coupon.id && revealedCoupons.has(coupon.id);
                    const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();

                    return (
                      <div
                        key={coupon.id}
                        className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-[#0B453C] flex items-center gap-4"
                      >
                        {/* Logo */}
                        <div className="flex-shrink-0">
                          {(() => {
                            // Find the store for this coupon
                            const store = stores.find(s =>
                              (coupon.storeIds && s.id && coupon.storeIds.includes(s.id)) ||
                              s.name === coupon.storeName
                            );
                            const logoUrl = store ? getFaviconUrl(store) : coupon.logoUrl;
                            const fallbackInitial = store?.name?.charAt(0) || coupon.storeName?.charAt(0) || coupon.code?.charAt(0) || '?';

                            return logoUrl ? (
                              <div className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                                <img
                                  src={logoUrl}
                                  alt={coupon.storeName || coupon.code}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<div class="w-16 h-16 rounded-lg bg-gradient-to-br from-[#0B453C] to-emerald-600 flex items-center justify-center"><span class="text-xl font-bold text-white">${fallbackInitial.toUpperCase()}</span></div>`;
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#0B453C] to-emerald-600 flex items-center justify-center">
                                <span className="text-xl font-bold text-white">
                                  {fallbackInitial.toUpperCase()}
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-gray-900 mb-1 truncate">
                            {coupon.storeName || coupon.code}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1 text-green-600">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Verified</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{formatDate(coupon.expiryDate) || '31 Dec, 2025'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Button */}
                        <div className="flex-shrink-0">
                          {isExpired ? (
                            <div className="bg-red-100 text-red-700 text-xs font-semibold px-4 py-2 rounded">
                              Expired
                            </div>
                          ) : (
                            <button
                              onClick={(e) => handleGetDeal(coupon, e)}
                              className="group relative bg-gradient-to-r from-[#0B453C] to-emerald-600 border-2 border-dashed border-white/60 rounded-lg px-6 py-3 text-white font-semibold hover:from-emerald-700 hover:to-[#0B453C] transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap"
                            >
                              {isRevealed && coupon.couponType === 'code' && coupon.code ? (
                                <span className="font-bold">{coupon.code}</span>
                              ) : (
                                <>
                                  <span className="group-hover:hidden">Get Code</span>
                                  <span className="hidden group-hover:inline font-bold">
                                    {coupon.couponType === 'code' && coupon.code
                                      ? `Get Code ${coupon.code.slice(-2)}`
                                      : 'Get Code'}
                                  </span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="lg:col-span-3 space-y-6">
              {/* Trending Deals */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0B453C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Trending Deals
                </h3>
                <div className="space-y-3">
                  {filteredCoupons.slice(0, 5).map((coupon) => (
                    <div key={coupon.id} className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        {coupon.logoUrl && (
                          <img src={coupon.logoUrl} alt="" className="w-8 h-8 rounded object-contain" />
                        )}
                        <span className="text-sm font-semibold text-gray-900 truncate">{coupon.storeName}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-2 line-clamp-2">{coupon.description}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0B453C]">{coupon.discount}% OFF</span>
                        <button
                          onClick={(e) => handleGetDeal(coupon, e)}
                          className="text-xs bg-[#0B453C] text-white px-3 py-1 rounded hover:bg-emerald-700 transition-colors"
                        >
                          Get Deal
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Stores */}
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0B453C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  You May Also Like
                </h3>
                <div className="space-y-3">
                  {stores.slice(0, 6).map((store) => {
                    const logoUrl = getFaviconUrl(store);
                    return (
                      <Link
                        key={store.id}
                        href={store.slug ? `/stores/${store.slug}` : `/stores/${store.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={store.name}
                            className="w-12 h-12 rounded-lg object-contain bg-gray-50"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">${store.name.charAt(0)}</div>`;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            {store.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-[#0B453C] truncate">{store.name}</div>
                          <div className="text-xs text-gray-500">View Coupons →</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Coupons</span>
                    <span className="text-lg font-bold text-blue-600">{coupons.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Stores</span>
                    <span className="text-lg font-bold text-purple-600">{stores.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Categories</span>
                    <span className="text-lg font-bold text-pink-600">{categories.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Subscription */}
      <Newsletter />

      {/* Footer */}
      <Footer />

      {/* Coupon Popup */}
      <CouponPopup
        coupon={selectedCoupon}
        isOpen={showPopup}
        onClose={handlePopupClose}
        onContinue={handlePopupContinue}
      />
    </div>
  );
}

export default function CouponsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B453C] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading coupons...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <CouponsContent />
    </Suspense>
  );
}

