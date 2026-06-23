'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getStores, Store } from '@/lib/services/storeService';
import Navbar from '@/app/components/Navbar';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import Newsletter from '@/app/components/Newsletter';
import Footer from '@/app/components/Footer';
import PageHeroBanner from '@/app/components/PageHeroBanner';
import { Filter, Search, X } from 'lucide-react';

// Helper function to get favicon URL from store data
const getStoreFaviconUrl = (store: Store): string => {
  // Try to extract domain from websiteUrl or trackingLink
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

  // Return Google's favicon service URL
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
};

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [supabaseStores, setSupabaseStores] = useState<Store[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const storesPerPage = 16;

  // Deduplicate stores by slug (or name if slug is missing)
  const deduplicateStores = (storesList: Store[]): Store[] => {
    const uniqueStoresMap = new Map<string, Store>();
    storesList.forEach(store => {
      // Use slug as primary identifier, fall back to name if slug is missing
      const uniqueKey = store.slug || store.name.toLowerCase().replace(/\s+/g, '-');

      if (!uniqueStoresMap.has(uniqueKey)) {
        uniqueStoresMap.set(uniqueKey, store);
      } else {
        // If duplicate found, prefer the one with more complete data (has logoUrl)
        const existing = uniqueStoresMap.get(uniqueKey);
        if (existing && !existing.logoUrl && store.logoUrl) {
          uniqueStoresMap.set(uniqueKey, store);
        }
      }
    });
    return Array.from(uniqueStoresMap.values());
  };

  // Combine and deduplicate stores
  const allStores = deduplicateStores([...stores, ...supabaseStores]);

  const availableCountries = useMemo(() => {
    const countries = new Set<string>();
    allStores.forEach((store) => {
      if (store.country?.trim()) countries.add(store.country.trim().toUpperCase());
    });
    return Array.from(countries).sort();
  }, [allStores]);

  const filteredStores = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allStores.filter((store) => {
      const matchesSearch =
        !query ||
        store.name.toLowerCase().includes(query) ||
        (store.subStoreName?.toLowerCase().includes(query) ?? false) ||
        (store.slug?.toLowerCase().includes(query) ?? false);

      const matchesCountry =
        !countryFilter || store.country?.trim().toUpperCase() === countryFilter;

      return matchesSearch && matchesCountry;
    });
  }, [allStores, searchQuery, countryFilter]);

  const sortedAllStores = useMemo(() => {
    const list = [...filteredStores];

    switch (sortBy) {
      case 'newest':
        list.sort((a, b) => {
          const dateA = a.createdAt ? (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : (a.createdAt as { toMillis?: () => number }).toMillis?.() || 0) : 0;
          const dateB = b.createdAt ? (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : (b.createdAt as { toMillis?: () => number }).toMillis?.() || 0) : 0;
          return dateB - dateA;
        });
        break;
      case 'oldest':
        list.sort((a, b) => {
          const dateA = a.createdAt ? (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : (a.createdAt as { toMillis?: () => number }).toMillis?.() || 0) : 0;
          const dateB = b.createdAt ? (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : (b.createdAt as { toMillis?: () => number }).toMillis?.() || 0) : 0;
          return dateA - dateB;
        });
        break;
      case 'name-asc':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    return list;
  }, [filteredStores, sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedAllStores.length / storesPerPage);
  const startIndex = (currentPage - 1) * storesPerPage;
  const endIndex = startIndex + storesPerPage;
  const newStores = sortedAllStores.slice(startIndex, endIndex);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [storesData, supabaseResponse] = await Promise.all([
          getStores(),
          fetch('/api/stores/supabase')
            .then((res) => res.json())
            .catch((err) => {
              console.error('Error fetching Supabase stores:', err);
              return { success: false, stores: [] };
            }),
        ]);

        const supabaseList: Store[] = Array.isArray(supabaseResponse?.stores)
          ? (supabaseResponse.stores as Store[])
          : [];

        setStores(storesData);
        setSupabaseStores(supabaseList);
      } catch (error) {
        console.error('Error fetching stores page data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, searchQuery, countryFilter]);

  const hasActiveFilters = Boolean(searchQuery.trim() || countryFilter);

  const clearFilters = () => {
    setSearchQuery('');
    setCountryFilter('');
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        /* Smooth scrolling for mobile horizontal scroll */
        @media (max-width: 640px) {
          .overflow-x-auto {
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
          }
          /* Snap scrolling for better UX */
          .snap-x {
            scroll-snap-type: x mandatory;
          }
          .snap-start {
            scroll-snap-align: start;
          }
        }
      `}</style>
      <Navbar />

      <PageHeroBanner
        src="/banners/store-banner-1.webp"
        alt="All Stores – Coupons & Cashback"
        mobileFit="contain"
      />

      {/* Breadcrumbs */}
      <Breadcrumbs
        className="border-b border-gray-100"
        items={[
          { label: 'Stores' }
        ]}
      />

      {/* Stores Grid Section */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8 md:py-12 lg:py-16 bg-white overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <h2 className="hidden sm:block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 sm:mb-6 md:mb-8">
            All <span className="text-orange-600">Stores</span>
          </h2>

          {/* Filter and Sort Bar */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8 pb-3 sm:pb-4 border-b border-[#0B453C]/15">
            <div className="text-xs sm:text-sm md:text-base text-gray-700 text-left">
              Showing{' '}
              <span className="font-semibold text-[#0B453C]">{newStores.length}</span> of{' '}
              <span className="font-semibold text-[#0B453C]">{sortedAllStores.length}</span> Results
              {hasActiveFilters && sortedAllStores.length !== allStores.length && (
                <span className="text-gray-500"> (filtered from {allStores.length})</span>
              )}
            </div>

            <div className="flex flex-row items-center gap-2 sm:gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowFilter(!showFilter)}
                className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 sm:px-4 py-2 border-2 rounded-lg transition-colors text-xs sm:text-sm md:text-base font-semibold min-w-0 ${
                  showFilter || hasActiveFilters
                    ? 'border-[#0B453C] bg-[#0B453C] text-white shadow-sm hover:bg-[#0a3d35]'
                    : 'border-[#0B453C] text-[#0B453C] bg-emerald-50 hover:bg-[#0B453C]/10 active:bg-[#0B453C]/15'
                }`}
              >
                <Filter className="w-4 h-4 shrink-0" />
                Filter
                {hasActiveFilters && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-[#0B453C]">
                    {(searchQuery.trim() ? 1 : 0) + (countryFilter ? 1 : 0)}
                  </span>
                )}
              </button>

              <div className="flex flex-1 items-center gap-2 min-w-0">
                <span className="hidden xs:inline text-xs sm:text-sm md:text-base text-[#0B453C] font-medium whitespace-nowrap shrink-0">
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full min-w-0 px-2 sm:px-3 py-2 border-2 border-[#0B453C]/25 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B453C] focus:border-[#0B453C] text-xs sm:text-sm md:text-base bg-emerald-50/50 text-gray-900 cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </select>
              </div>
            </div>

            {showFilter && (
              <div className="rounded-lg border-2 border-[#0B453C]/25 bg-gradient-to-r from-[#0B453C]/10 via-emerald-50 to-[#0B453C]/10 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0B453C]/60" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search stores by name..."
                      className="w-full rounded-lg border-2 border-[#0B453C]/25 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0B453C] focus:border-[#0B453C]"
                    />
                  </div>

                  {availableCountries.length > 0 && (
                    <select
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                      className="w-full sm:w-44 rounded-lg border-2 border-[#0B453C]/25 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B453C] focus:border-[#0B453C] cursor-pointer"
                    >
                      <option value="">All Countries</option>
                      {availableCountries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  )}

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-[#0B453C] bg-[#0B453C] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0a3d35] transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg aspect-square animate-pulse"></div>
              ))}
            </div>
          ) : sortedAllStores.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {hasActiveFilters ? 'No stores match your filters.' : 'No stores available yet.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 text-sm font-semibold text-[#0B453C] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div>
              {/* Mobile grid — 16 per page */}
              <div className="grid grid-cols-2 gap-3 sm:hidden">
                {newStores.map((store) => (
                  <Link
                    key={store.id}
                    href={`/stores/${store.slug || store.id}`}
                    className="group flex flex-col bg-white rounded-xl border border-gray-100 hover:border-[#0B453C] active:border-[#0B453C] transition-all duration-300 shadow-md overflow-hidden"
                  >
                    <div className="aspect-[4/3] px-3 pt-3 pb-1.5 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src={store.logoUrl || getStoreFaviconUrl(store)}
                          alt={store.name}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const faviconUrl = getStoreFaviconUrl(store);
                            if (target.src !== faviconUrl && store.logoUrl) {
                              target.src = faviconUrl;
                            } else {
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="text-gray-400 text-[10px] text-center font-semibold line-clamp-2">${store.name}</div>`;
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="px-2 py-2 border-t border-gray-100 bg-white">
                      <h3 className="font-bold text-[11px] text-gray-900 text-center line-clamp-2 group-hover:text-[#0B453C] transition-colors">
                        {store.name}
                      </h3>
                      {store.voucherText && (
                        <div className="flex justify-center mt-1">
                          <span className="inline-block bg-gradient-to-r from-[#0B453C] to-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full line-clamp-1">
                            {store.voucherText}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop: paginated grid */}
              <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                {newStores.map((store, index) => (
                      <Link
                        key={store.id}
                        href={`/stores/${store.slug || store.id}`}
                        className="group flex flex-col bg-white rounded-2xl border border-gray-100 hover:border-[#0B453C] transition-all duration-500 shadow-md hover:shadow-2xl overflow-hidden cursor-pointer transform hover:-translate-y-2 hover:scale-105 relative"
                        style={{
                          animation: `fadeInUp 0.6s ease-out ${(index % 12) * 0.05}s both`
                        }}
                      >
                        {/* Logo Section */}
                        <div className="aspect-[4/3] px-4 pt-3 pb-1.5 sm:px-5 sm:pt-4 sm:pb-2 flex flex-col items-center justify-center relative bg-gradient-to-br from-gray-50 via-white to-gray-50 transition-all duration-500 flex-shrink-0">
                          <div className="w-full h-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                            <img
                              src={store.logoUrl || getStoreFaviconUrl(store)}
                              alt={store.name}
                              className="max-w-full max-h-full object-contain drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-500"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                // If logoUrl failed, try favicon
                                const faviconUrl = getStoreFaviconUrl(store);
                                if (target.src !== faviconUrl && store.logoUrl) {
                                  target.src = faviconUrl;
                                } else {
                                  // If both failed, show gradient badge
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<div class="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-lg sm:text-2xl font-bold shadow-lg">${store.name.charAt(0).toUpperCase()}</div>`;
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>

                        {/* Content Section - Footer */}
                        <div className="px-3 py-1.5 sm:px-4 sm:py-2 border-t border-gray-100 bg-white relative z-20 mt-auto">
                          <h3 className="font-bold text-sm sm:text-base text-gray-900 text-center break-words group-hover:text-[#0B453C] transition-colors duration-300 mb-1">
                            {store.name}
                          </h3>
                          {store.voucherText && (
                            <div className="flex justify-center mt-1">
                              <span className="inline-block bg-gradient-to-r from-[#0B453C] to-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg group-hover:shadow-xl transform group-hover:scale-110 transition-all duration-300">
                                {store.voucherText}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Shine Effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-30"></div>
                      </Link>
                    ))}
                  </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex justify-center items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage(currentPage - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-gradient-to-r from-[#0B453C] to-emerald-600 text-white hover:shadow-lg hover:scale-105'
                }`}
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1);

                if (!showPage) {
                  // Show ellipsis
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-3 py-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${currentPage === page
                      ? 'bg-gradient-to-r from-[#0B453C] to-emerald-600 text-white shadow-lg scale-110'
                      : 'bg-white text-gray-700 hover:bg-green-50 border border-green-100'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage(currentPage + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-gradient-to-r from-[#0B453C] to-emerald-600 text-white hover:shadow-lg hover:scale-105'
                }`}
            >
              Next
            </button>
          </div>

          {/* Page Info */}
          <div className="text-center mt-4 text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, sortedAllStores.length)} of {sortedAllStores.length} stores
          </div>
        </div>
      )}

      {/* Newsletter Subscription Section */}
      <Newsletter />

      {/* Footer */}
      <Footer />
    </div>
  );
}

