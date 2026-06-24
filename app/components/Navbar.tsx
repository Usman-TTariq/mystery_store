"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCategories, Category } from "@/lib/services/categoryService";
import { getActiveCoupons, Coupon } from "@/lib/services/couponService";
import { getStores, Store } from "@/lib/services/storeService";
import { getFavoritesCount } from "@/lib/services/favoritesService";
import { getUnreadCount, initializeSampleNotifications } from "@/lib/services/notificationsService";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import {
  Search, Menu, X, ChevronDown, User,
  Phone, Heart, Moon, Tag,
  MapPin, ChevronLeft, ChevronRight, Facebook, Twitter, Instagram, Youtube
} from "lucide-react";
import CategoryIcon from "@/app/components/CategoryIcon";
import { categoryIconBgClass } from "@/lib/utils/categoryIcon";
import {
  filterCategoriesForSearch,
  filterCouponsForSearch,
  filterStoresForSearch,
  getCouponLabel,
  getCouponSubtitle,
} from "@/lib/utils/search";

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

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [promoIndex, setPromoIndex] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRequestRef = useRef(0);
  const [searchResults, setSearchResults] = useState<{
    stores: Store[];
    categories: Category[];
    coupons: Coupon[];
  }>({ stores: [], categories: [], coupons: [] });

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    // Height of TopBar (~40px) + MiddleBar (~90px) = ~130px
    // We show shadow right as it sticks
    setIsScrolled(latest > 120);
  });

  const promotions = [
    "Get 35% Off Code FG6556KD",
    "Free Shipping on Orders Over $50",
    "New Arrivals - Check Them Out!"
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, stores, activeCoupons, supabaseCouponsRes] = await Promise.all([
          getCategories(),
          getStores(),
          getActiveCoupons(),
          fetch('/api/coupons/supabase')
            .then((res) => res.json())
            .catch(() => ({ coupons: [] })),
        ]);

        setCategories(cats);
        setAllStores(stores);

        const supabaseCoupons: Coupon[] = Array.isArray(supabaseCouponsRes?.coupons)
          ? supabaseCouponsRes.coupons
          : [];
        const couponMap = new Map<string, Coupon>();
        [...activeCoupons, ...supabaseCoupons].forEach((coupon) => {
          if (coupon.id && coupon.isActive !== false) {
            couponMap.set(coupon.id, coupon);
          }
        });
        setAllCoupons(Array.from(couponMap.values()));
      } catch (error) {
        console.error('Error fetching navbar data:', error);
      }
    };
    fetchData();
    initializeSampleNotifications();
    updateCounts();

    const handleUpdate = () => updateCounts();
    window.addEventListener('notificationUpdated', handleUpdate);
    window.addEventListener('favoritesUpdated', handleUpdate);

    const interval = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);

    return () => {
      window.removeEventListener('notificationUpdated', handleUpdate);
      window.removeEventListener('favoritesUpdated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const updateCounts = () => {
    setFavoritesCount(getFavoritesCount());
    setNotificationsCount(getUnreadCount());
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const runSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setShowSuggestions(false);
      setSearchResults({ stores: [], categories: [], coupons: [] });
      setSearchLoading(false);
      return;
    }

    const localResults = {
      stores: filterStoresForSearch(allStores, trimmed, 5),
      categories: filterCategoriesForSearch(categories, trimmed, 3),
      coupons: filterCouponsForSearch(allCoupons, trimmed, allStores, 6),
    };

    const hasLocalResults =
      localResults.stores.length > 0 ||
      localResults.categories.length > 0 ||
      localResults.coupons.length > 0;

    if (hasLocalResults) {
      setSearchResults(localResults);
      setShowSuggestions(true);
    }

    const requestId = ++searchRequestRef.current;
    setSearchLoading(true);

    window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`, {
          cache: 'no-store',
        });
        const data = await res.json();

        if (requestId !== searchRequestRef.current) return;
        if (!data?.success) return;

        setSearchResults(data.results);
        setShowSuggestions(
          data.results.stores.length > 0 ||
          data.results.categories.length > 0 ||
          data.results.coupons.length > 0
        );
      } catch (error) {
        console.error('Search suggest fetch failed:', error);
      } finally {
        if (requestId === searchRequestRef.current) {
          setSearchLoading(false);
        }
      }
    }, 150);
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      runSearch(searchQuery);
    }
  }, [allStores, allCoupons, categories]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    runSearch(value);
  };

  const handleSuggestionClick = (type: 'store' | 'category' | 'coupon', item: Store | Category | Coupon) => {
    setShowSuggestions(false);
    setMobileMenuOpen(false);
    if (type === 'store') {
      const store = item as Store;
      router.push(`/stores/${store.slug || store.id}`);
    } else if (type === 'category') {
      const category = item as Category;
      router.push(`/categories/${category.id}`);
    } else {
      const coupon = item as Coupon;
      const storeId = coupon.storeIds?.[0];
      if (storeId) {
        router.push(`/coupons?store=${storeId}`);
      } else if (coupon.storeName) {
        router.push(`/search?q=${encodeURIComponent(coupon.storeName)}`);
      } else {
        router.push(`/search?q=${encodeURIComponent(coupon.code || searchQuery.trim())}`);
      }
    }
    setSearchQuery('');
  };

  const hasSearchResults =
    searchResults.stores.length > 0 ||
    searchResults.categories.length > 0 ||
    searchResults.coupons.length > 0;

  const renderSearchSuggestions = (variant: 'desktop' | 'mobile') => {
    const containerClass =
      variant === 'desktop'
        ? 'absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[200] max-h-96 overflow-y-auto'
        : 'mt-2 rounded-xl border border-white/20 bg-white text-gray-900 shadow-xl overflow-hidden max-h-72 overflow-y-auto';

    return (
      <div className={containerClass}>
        {searchLoading && !hasSearchResults && (
          <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
        )}
        {searchResults.stores.length > 0 && (
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Stores</div>
            {searchResults.stores.map((store) => (
              <button
                key={store.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSuggestionClick('store', store)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full border border-gray-100 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src={store.logoUrl || getStoreFaviconUrl(store)}
                    alt={store.name}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const faviconUrl = getStoreFaviconUrl(store);
                      if (target.src !== faviconUrl && store.logoUrl) {
                        target.src = faviconUrl;
                      } else {
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B453C] to-emerald-600 flex items-center justify-center text-white text-sm font-bold">${store.name.charAt(0).toUpperCase()}</div>`;
                        }
                      }
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">{store.name}</div>
                  {store.description && (
                    <div className="text-xs text-gray-500 truncate">{store.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {searchResults.coupons.length > 0 && (
          <div className={`p-2 ${searchResults.stores.length > 0 ? 'border-t border-gray-100' : ''}`}>
            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Coupons</div>
            {searchResults.coupons.map((coupon) => (
              <button
                key={coupon.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSuggestionClick('coupon', coupon)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full border border-gray-100 bg-[#f0fdf4] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {coupon.logoUrl ? (
                    <img
                      src={coupon.logoUrl}
                      alt={getCouponLabel(coupon)}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Tag className="w-4 h-4 text-[#0B453C]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">{getCouponLabel(coupon)}</div>
                  <div className="text-xs text-gray-500 truncate">{getCouponSubtitle(coupon)}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {searchResults.categories.length > 0 && (
          <div className={`p-2 ${searchResults.stores.length > 0 || searchResults.coupons.length > 0 ? 'border-t border-gray-100' : ''}`}>
            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Categories</div>
            {searchResults.categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSuggestionClick('category', category)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${categoryIconBgClass}`}>
                  <CategoryIcon
                    logoUrl={category.logoUrl}
                    name={category.name}
                    imgClassName="w-6 h-6 object-contain brightness-0"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">{category.name}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="p-2 border-t border-gray-100">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowSuggestions(false);
              handleSearch({ preventDefault: () => {} } as React.FormEvent);
            }}
            className="w-full px-3 py-2 text-sm font-semibold text-[#0B453C] hover:bg-green-50 rounded-lg transition-colors text-center"
          >
            View all results for &quot;{searchQuery}&quot;
          </button>
        </div>
      </div>
    );
  };

  // --- Dropdown Components ---

  // 1. Categories Mega Menu
  const CategoriesMenu = () => (
    <div className="grid grid-cols-4 gap-4 p-5 w-[650px] bg-white rounded-b-xl shadow-xl border border-gray-100 mt-2">
      <div className="col-span-3 grid grid-cols-2 gap-x-6 gap-y-2">
        {categories.slice(0, 10).map((cat) => (
          <Link key={cat.id} href={`/categories/${cat.id}`} className="flex items-center gap-2 group/item p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${categoryIconBgClass}`}>
              <CategoryIcon logoUrl={cat.logoUrl} name={cat.name} imgClassName="w-4 h-4 object-contain brightness-0" />
            </div>
            <span className="text-sm text-gray-700 font-medium group-hover/item:text-[#0B453C] transition-colors">{cat.name}</span>
          </Link>
        ))}
      </div>
      <div className="col-span-1 bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
        <h4 className="font-bold text-gray-900 mb-1 text-sm">All Categories</h4>
        <p className="text-[10px] text-gray-500 mb-3">Explore thousands of products</p>
        <Link href="/categories" className="text-[10px] bg-[#043830] text-white px-3 py-1.5 rounded hover:bg-[#064e42] transition-colors">
          View All
        </Link>
      </div>
    </div>
  );

  // 2. Stores Mega Menu
  const StoresMenu = () => (
    <div className="grid grid-cols-4 gap-4 p-5 w-[650px] bg-white rounded-b-xl shadow-xl border border-gray-100 mt-2">
      <div className="col-span-3 grid grid-cols-2 gap-x-6 gap-y-2">
        {allStores.slice(0, 10).map((store) => (
          <Link key={store.id} href={store.slug ? `/stores/${store.slug}` : `/stores/${store.id}`} className="flex items-center gap-2 group/item p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full border border-gray-100 bg-white flex items-center justify-center overflow-hidden">
              <img
                src={store.logoUrl || getStoreFaviconUrl(store)}
                alt={store.name}
                className="w-6 h-6 object-contain"
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
                      parent.innerHTML = `<div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B453C] to-emerald-600 flex items-center justify-center text-white text-xs font-bold">${store.name.charAt(0).toUpperCase()}</div>`;
                    }
                  }
                }}
              />
            </div>
            <span className="text-sm text-gray-700 font-medium group-hover/item:text-[#0B453C] transition-colors truncate">{store.name}</span>
          </Link>
        ))}
      </div>
      <div className="col-span-1 bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
        <h4 className="font-bold text-gray-900 mb-1 text-sm">Top Stores</h4>
        <p className="text-[10px] text-gray-500 mb-3">Find best coupons</p>
        <Link href="/stores" className="text-[10px] bg-[#043830] text-white px-3 py-1.5 rounded hover:bg-[#064e42] transition-colors">
          View All
        </Link>
      </div>
    </div>
  );

  // 3. Simple List Menu
  const SimpleMenu = ({ items }: { items: { label: string; href: string }[] }) => (
    <div className="w-48 bg-white rounded-b-xl shadow-xl border border-gray-100 py-2">
      {items.map((item) => (
        <Link key={item.label} href={item.href} className="block px-4 py-2 text-sm text-gray-600 hover:text-[#0B453C] hover:bg-gray-50 font-medium">
          {item.label}
        </Link>
      ))}
    </div>
  );

  const navLinks = [
    { name: "Home", path: "/", component: null },
    { name: "Stores", path: "/stores", component: <StoresMenu /> },
    { name: "Categories", path: "/categories", component: <CategoriesMenu /> },
    {
      name: "Pages",
      path: "/pages",
      component: <SimpleMenu items={[
        { label: "About Us", href: "/about-us" },
        { label: "Contact Us", href: "/contact-us" },
        { label: "Privacy Policy", href: "/privacy-policy" }
      ]} />
    },
    {
      name: "Blogs",
      path: "/blog",
      component: <SimpleMenu items={[
        { label: "Latest News", href: "/blog" },
        { label: "Savings Tips", href: "/blog/tips" }
      ]} />
    },
  ];

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="w-full max-w-full">

      {/* 1. TOP BAR (Teal - Balances Size) */}
      <div className="bg-[#042b26] text-white text-[11px] py-2 border-b border-white/5 relative z-50 font-sans w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-full min-w-0">
          <div className="hidden md:flex items-center gap-5 opacity-90">
            <Link href="/stores" className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
              <MapPin className="w-3.5 h-3.5" /> <span className="font-semibold tracking-wide">Find a Store</span>
            </Link>
            <div className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-400 transition-colors group relative">
              <span className="font-semibold tracking-wide">USD ($)</span> <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform" />
            </div>
          </div>

          <div className="flex-1 flex justify-center items-center gap-2 sm:gap-3 min-w-0 px-1">
            <button onClick={() => setPromoIndex((prev) => (prev - 1 + promotions.length) % promotions.length)} className="hover:text-emerald-400 transition-colors shrink-0"><ChevronLeft className="w-4 h-4" /></button>
            <AnimatePresence mode="wait">
              <motion.span key={promoIndex} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="font-semibold tracking-wider text-center min-w-0 max-w-[52vw] sm:max-w-none truncate text-[10px] sm:text-[11px]">
                {promotions[promoIndex]}
              </motion.span>
            </AnimatePresence>
            <button onClick={() => setPromoIndex((prev) => (prev + 1) % promotions.length)} className="hover:text-emerald-400 transition-colors shrink-0"><ChevronRight className="w-4 h-4" /></button>
          </div>

          <div className="hidden md:flex items-center gap-3 opacity-90">
            <a href="#" className="hover:text-emerald-400 transition-colors"><Facebook className="w-3.5 h-3.5" /></a>
            <a href="#" className="hover:text-emerald-400 transition-colors"><Twitter className="w-3.5 h-3.5" /></a>
            <a href="#" className="hover:text-emerald-400 transition-colors"><Instagram className="w-3.5 h-3.5" /></a>
            <a href="#" className="hover:text-emerald-400 transition-colors"><Youtube className="w-3.5 h-3.5" /></a>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE BAR (Teal - Compact) */}
      <div className="bg-[#0B453C] py-2 border-b border-[#0f5c4e] relative z-[110] font-sans w-full overflow-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0 overflow-visible">
          <div className="flex items-center justify-between gap-4 lg:gap-8 overflow-visible">

            <Link href="/" className="flex-shrink-0 flex items-center gap-0.5">
              <img
                src="/Coupachu Icone-2.svg"
                alt="Coupachu Icon"
                className="w-10 h-10 object-contain -mr-1"
              />
              <span className="text-2xl font-bold tracking-tight mt-3">
                <span className="text-[#CD3D1C]">o</span>
                <span className="text-white">upachu</span>
              </span>
            </Link>


            <div className="hidden lg:flex flex-1 max-w-2xl mx-auto relative z-[120]">
              <form onSubmit={handleSearch} className="flex w-full bg-white rounded-full p-1 shadow-lg items-center relative z-20 h-[46px]">
                <div className="pl-4 pr-2 flex items-center">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search for stores, coupons, categories..."
                  className="flex-1 px-2 py-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm font-medium"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchQuery.trim().length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                <button type="submit" className="mr-1 bg-[#0B453C] text-white px-6 py-2 rounded-full font-bold text-xs hover:bg-emerald-700 transition-all hover:shadow-md">
                  Search
                </button>
              </form>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && (hasSearchResults || searchLoading) && renderSearchSuggestions('desktop')}
            </div>

            <div className="flex items-center gap-6 text-white">
              <div className="hidden lg:flex items-center gap-2 pr-4 border-r border-white/20">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center"><Phone className="w-4 h-4 text-[#0B453C]" /></div>
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] text-teal-100/90 font-medium tracking-wide">Hotline:</span>
                  <span className="text-sm font-bold">196475</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="hidden sm:block hover:text-emerald-400 transition-colors"><Moon className="w-5 h-5" /></button>
                <Link href="/favorites" className="relative hover:text-emerald-400 transition-colors">
                  <Heart className="w-5 h-5" />
                  {favoritesCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>}
                </Link>
                <Link href="/profile" className="hover:text-emerald-400 transition-colors"><User className="w-5 h-5" /></Link>
                <button className="lg:hidden p-1 ml-1 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM BAR (White - Sticky) */}
      <div className={`w-full bg-white border-b border-gray-200 hidden lg:block sticky top-0 z-[100] transition-shadow duration-300 ${isScrolled ? "shadow-md" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-7">
              {navLinks.map((link) => (
                <div key={link.name} className="relative group h-14 flex items-center" onMouseEnter={() => setActiveDropdown(link.name)} onMouseLeave={() => setActiveDropdown(null)}>
                  <Link href={link.path} className={`text-[13px] font-bold flex items-center gap-1 hover:text-[#0B453C] transition-colors uppercase tracking-wide ${pathname === link.path ? "text-[#0B453C]" : "text-gray-700"}`}>
                    {link.name}
                    {link.component && (
                      <ChevronDown className={`w-3.5 h-3.5 mt-0.5 text-gray-400 group-hover:rotate-180 transition-transform duration-300 ${activeDropdown === link.name ? 'rotate-180 text-[#0B453C]' : ''}`} />
                    )}
                  </Link>
                  <AnimatePresence>
                    {activeDropdown === link.name && link.component && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.15 }} className="absolute top-full left-0 z-50 pt-2">
                        {link.component}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6">
              <Link href="/submit-coupon" className="text-[13px] font-bold text-gray-600 hover:text-[#0B453C] transition-colors uppercase tracking-wide">Submit Coupon</Link>
              <Link href="/support" className="text-[13px] font-bold text-gray-600 hover:text-[#0B453C] transition-colors uppercase tracking-wide">Support & FAQs</Link>
            </div>
          </div>
        </div>
      </div>
      </header>

      {/* Mobile Menu — full screen overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="lg:hidden fixed inset-0 z-[200] flex min-h-[100dvh] flex-col bg-[#0B453C] text-white"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-0.5">
                <img
                  src="/Coupachu Icone-2.svg"
                  alt="Coupachu Icon"
                  className="h-10 w-10 object-contain -mr-1"
                />
                <span className="mt-3 text-2xl font-bold tracking-tight">
                  <span className="text-[#CD3D1C]">o</span>
                  <span className="text-white">upachu</span>
                </span>
              </Link>

              <div className="flex items-center gap-4">
                <Link href="/favorites" onClick={closeMobileMenu} className="relative hover:text-emerald-300 transition-colors">
                  <Heart className="h-5 w-5" />
                  {favoritesCount > 0 && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-400" />
                  )}
                </Link>
                <Link href="/profile" onClick={closeMobileMenu} className="hover:text-emerald-300 transition-colors">
                  <User className="h-5 w-5" />
                </Link>
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="rounded-lg border border-white/30 p-1.5 hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="relative mb-6">
                <form
                  onSubmit={(e) => {
                    handleSearch(e);
                    closeMobileMenu();
                  }}
                  className="flex w-full items-center rounded-full border border-white/25 bg-white/10 p-1"
                >
                  <input
                    type="text"
                    placeholder="Search stores, coupons..."
                    className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/50"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => searchQuery.trim().length > 0 && setShowSuggestions(true)}
                  />
                  <button
                    type="submit"
                    className="mr-1 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/25 transition-colors"
                    aria-label="Search"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </form>
                {showSuggestions && (hasSearchResults || searchLoading) && renderSearchSuggestions('mobile')}
              </div>

              <nav className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.path}
                    onClick={closeMobileMenu}
                    className={`block rounded-lg px-3 py-3 text-base font-medium transition-colors ${
                      pathname === link.path
                        ? 'bg-white/10 text-white'
                        : 'text-white/90 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}

                <div className="my-4 border-t border-white/10" />

                <Link
                  href="/submit-coupon"
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Submit Coupon
                </Link>
                <Link
                  href="/support"
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Support & FAQs
                </Link>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
