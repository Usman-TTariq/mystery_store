'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getBannerByLayoutPosition, Banner } from '@/lib/services/bannerService';
import { getStores, Store } from '@/lib/services/storeService';
import Navbar from '@/app/components/Navbar';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import Newsletter from '@/app/components/Newsletter';
import Footer from '@/app/components/Footer';
import Image from 'next/image';
import { Filter, SortAsc, LayoutGrid, Star, CheckCircle } from 'lucide-react';

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
  const [banner10, setBanner10] = useState<Banner | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showFilter, setShowFilter] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [supabaseStores, setSupabaseStores] = useState<Store[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const storesPerPage = 24;

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

  // Calculate pagination
  const totalPages = Math.ceil(allStores.length / storesPerPage);
  const startIndex = (currentPage - 1) * storesPerPage;
  const endIndex = startIndex + storesPerPage;
  const newStores = allStores.slice(startIndex, endIndex);
  useEffect(() => {
    document.title = 'Stores - COUPACHU';

    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const fetchData = async () => {
      setLoading(true);
      try {
        const [bannerData, storesData, supabaseResponse] = await Promise.all([
          getBannerByLayoutPosition(10),
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

        setBanner10(bannerData);
        setStores(storesData);
        setSupabaseStores(supabaseList);
        setFilteredStores(storesData);
      } catch (error) {
        console.error('Error fetching stores page data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    // Reset to page 1 when sort changes
    setCurrentPage(1);
    // Sort stores based on selected option
    let sorted = [...stores];

    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => {
          const dateA = a.createdAt ? (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : (a.createdAt as any).toMillis?.() || 0) : 0;
          const dateB = b.createdAt ? (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : (b.createdAt as any).toMillis?.() || 0) : 0;
          return dateB - dateA;
        });
        break;
      case 'oldest':
        sorted.sort((a, b) => {
          const dateA = a.createdAt ? (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : (a.createdAt as any).toMillis?.() || 0) : 0;
          const dateB = b.createdAt ? (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : (b.createdAt as any).toMillis?.() || 0) : 0;
          return dateA - dateB;
        });
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    setFilteredStores(sorted);
  }, [sortBy, stores]);

  // Auto-scroll slider with smooth continuous loop (desktop only)
  useEffect(() => {
    if (!sliderRef.current || filteredStores.length === 0 || isMobile) return;

    const slider = sliderRef.current;
    let animationFrameId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame (slower for smoother effect)
    let isPaused = false;

    // Pause on hover
    const handleMouseEnter = () => { isPaused = true; };
    const handleMouseLeave = () => { isPaused = false; };

    slider.addEventListener('mouseenter', handleMouseEnter);
    slider.addEventListener('mouseleave', handleMouseLeave);

    const scroll = () => {
      if (slider && !isPaused) {
        scrollPosition += scrollSpeed;

        // Calculate the width of first set of items (for seamless loop)
        const firstSetWidth = (slider.scrollWidth / 3);

        if (scrollPosition >= firstSetWidth) {
          // Reset to start seamlessly
          scrollPosition = scrollPosition - firstSetWidth;
          slider.scrollLeft = scrollPosition;
        } else {
          slider.scrollLeft = scrollPosition;
        }
      }

      animationFrameId = requestAnimationFrame(scroll);
    };

    // Start scrolling
    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      slider.removeEventListener('mouseenter', handleMouseEnter);
      slider.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [filteredStores]);

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

      {/* Banner Section with Layout 10 - 1728x547 */}
      <div className="w-full">
        {loading ? (
          <div className="w-full bg-gray-100 aspect-[1728/547] min-h-[200px] sm:min-h-[250px] animate-pulse"></div>
        ) : banner10 ? (
          <div className="relative w-full">
            <div className="w-full aspect-[1728/547] min-h-[200px] sm:min-h-[250px]">
              <img
                src={banner10.imageUrl}
                alt={banner10.title || 'Stores'}
                className="w-full h-full object-contain sm:object-cover"
                onError={(e) => {
                  console.error('Stores banner 10 image failed to load:', banner10.imageUrl);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </div>
        ) : (
          <div className="w-full aspect-[1728/547] min-h-[200px] sm:min-h-[250px] bg-gradient-to-r from-green-50 to-emerald-50"></div>
        )}
      </div>

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Stores' }
        ]}
      />

      {/* Stores Grid Section */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12 lg:py-16 bg-white overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 sm:mb-6 md:mb-8">
            All <span className="text-orange-600">Stores</span>
          </h2>

          {/* Filter and Sort Bar */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8 pb-3 sm:pb-4 border-b border-green-100">
            <div className="text-xs sm:text-sm md:text-base text-gray-600 text-center sm:text-left">
              Showing <span className="font-semibold text-[#0B453C]">{newStores.length}</span> of <span className="font-semibold text-[#0B453C]">{allStores.length}</span> Results
            </div>

            <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 xs:gap-3 sm:gap-4 w-full">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-green-200 text-[#0B453C] rounded-lg hover:bg-green-50 active:bg-green-100 transition-colors text-xs sm:text-sm md:text-base font-medium w-full xs:w-auto"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>

              <div className="flex items-center gap-2 w-full xs:w-auto">
                <span className="text-xs sm:text-sm md:text-base text-gray-600 whitespace-nowrap">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 xs:flex-none px-2 sm:px-3 py-2 border border-green-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B453C] text-xs sm:text-sm md:text-base bg-white cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg aspect-square animate-pulse"></div>
              ))}
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No stores available yet.</p>
            </div>
          ) : (
            <div>
              {/* Featured Stores Slider (First 6 stores) */}
              {filteredStores.length > 0 && (
                <div className="mb-4 sm:mb-6 md:mb-12">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 px-2 sm:px-0">
                    Featured <span className="text-[#0B453C]">Stores</span>
                  </h3>
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 via-white to-emerald-50 p-2 sm:p-3 md:p-4 lg:p-6 border border-green-100">
                    <div
                      ref={sliderRef}
                      className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 overflow-x-auto scrollbar-hide pb-2 pt-2 snap-x snap-mandatory"
                      style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
                    >
                      {/* Mobile: Show only first 6 stores, Desktop: Show duplicated for seamless loop */}
                      {[...filteredStores.slice(0, 6), ...filteredStores.slice(0, 6), ...filteredStores.slice(0, 6)].map((store, index) => (
                        <Link
                          key={`${store.id}-${index}`}
                          href={`/stores/${store.slug || store.id}`}
                          className="group flex flex-col flex-shrink-0 w-[140px] xs:w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px] bg-white rounded-xl sm:rounded-2xl border border-gray-100 hover:border-[#0B453C] active:border-[#0B453C] transition-all duration-300 shadow-md hover:shadow-xl active:shadow-lg overflow-hidden cursor-pointer transform active:scale-95 sm:hover:-translate-y-1 sm:hover:scale-[1.02] relative snap-start"
                          style={{
                            animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
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
                          <div className="px-2 py-1.5 sm:px-3 md:px-4 sm:py-2 border-t border-gray-100 bg-white relative z-20 mt-auto">
                            <h3 className="font-bold text-xs sm:text-sm md:text-base text-gray-900 text-center break-words group-hover:text-[#0B453C] transition-colors duration-300 mb-1 line-clamp-2">
                              {store.name}
                            </h3>
                            {store.voucherText && (
                              <div className="flex justify-center mt-1">
                                <span className="inline-block bg-gradient-to-r from-[#0B453C] to-emerald-600 text-white text-[10px] xs:text-xs font-bold px-2 xs:px-3 py-1 xs:py-1.5 rounded-full shadow-lg group-hover:shadow-xl transform group-hover:scale-110 transition-all duration-300 line-clamp-1">
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
                </div>
              )}

              {/* All Stores - Horizontal Scroll on Mobile, Grid on Desktop */}
              {filteredStores.length > 0 && (
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 px-2 sm:px-0">
                    All <span className="text-[#0B453C]">Stores</span>
                  </h3>

                  {/* Mobile: Horizontal Scroll */}
                  <div className="block sm:hidden">
                    <div className="relative -mx-3 sm:-mx-4">
                      {/* Scroll indicator gradient */}
                      <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
                      <div className="overflow-x-auto scrollbar-hide pb-4 px-3 sm:px-4 snap-x snap-mandatory w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <div className="flex gap-3 sm:gap-4" style={{ width: 'max-content' }}>
                          {newStores.map((store, index) => (
                            <Link
                              key={store.id}
                              href={`/stores/${store.slug || store.id}`}
                              className="group flex flex-col bg-white rounded-xl sm:rounded-2xl border border-gray-100 hover:border-[#0B453C] active:border-[#0B453C] transition-all duration-300 shadow-md hover:shadow-xl active:shadow-lg overflow-hidden cursor-pointer transform active:scale-95 relative flex-shrink-0 w-[140px] xs:w-[160px] snap-start"
                            >
                              {/* Logo Section */}
                              <div className="aspect-[4/3] px-4 pt-3 pb-1.5 flex flex-col items-center justify-center relative bg-gradient-to-br from-gray-50 via-white to-gray-50 transition-all duration-500 flex-shrink-0">
                                {store.logoUrl ? (
                                  <div className="w-full h-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                                    <img
                                      src={store.logoUrl}
                                      alt={store.name}
                                      className="max-w-full max-h-full object-contain drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-500"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          parent.innerHTML = `<div class="text-gray-400 text-xs text-center font-semibold">${store.name}</div>`;
                                        }
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="text-gray-400 text-xs text-center font-semibold group-hover:text-orange-600 transition-colors">
                                    {store.name}
                                  </div>
                                )}
                              </div>

                              {/* Content Section - Footer */}
                              <div className="px-2 py-1.5 sm:px-3 border-t border-gray-100 bg-white relative z-20 mt-auto">
                                <h3 className="font-bold text-[11px] xs:text-xs text-gray-900 text-center break-words group-hover:text-[#0B453C] transition-colors duration-300 mb-1 line-clamp-2">
                                  {store.name}
                                </h3>
                                {store.voucherText && (
                                  <div className="flex justify-center mt-1">
                                    <span className="inline-block bg-gradient-to-r from-[#0B453C] to-emerald-600 text-white text-[9px] xs:text-[10px] font-bold px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full shadow-lg group-hover:shadow-xl transform group-hover:scale-110 transition-all duration-300 line-clamp-1">
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
                    </div>
                  </div>

                  {/* Desktop: Grid Layout */}
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
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            Showing {startIndex + 1}-{Math.min(endIndex, allStores.length)} of {allStores.length} stores
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

