"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCategories, Category } from "@/lib/services/categoryService";
import { getTrendingStores, getStores, Store } from "@/lib/services/storeService";
import { getFavoritesCount } from "@/lib/services/favoritesService";
import { getUnreadCount, initializeSampleNotifications } from "@/lib/services/notificationsService";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import {
  Search, Menu, X, ChevronDown, User,
  Phone, Heart, ShoppingBag, Moon,
  MapPin, ChevronLeft, ChevronRight, Facebook, Twitter, Instagram, Youtube
} from "lucide-react";

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
  const [trendingStores, setTrendingStores] = useState<Store[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [promoIndex, setPromoIndex] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    stores: Store[];
    categories: Category[];
  }>({ stores: [], categories: [] });

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
        const [cats, stores] = await Promise.all([
          getCategories(),
          getStores()
        ]);
        setCategories(cats);
        setTrendingStores(stores);
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

  // Handle search input change and filter results
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (value.trim().length > 0) {
      const searchTerm = value.toLowerCase().trim();

      // Filter stores
      const filteredStores = trendingStores.filter(store =>
        store.name.toLowerCase().includes(searchTerm)
      ).slice(0, 5);

      // Filter categories
      const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm)
      ).slice(0, 3);

      setSearchResults({
        stores: filteredStores,
        categories: filteredCategories
      });
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSearchResults({ stores: [], categories: [] });
    }
  };

  const handleSuggestionClick = (type: 'store' | 'category', item: Store | Category) => {
    setShowSuggestions(false);
    if (type === 'store') {
      const store = item as Store;
      router.push(`/stores/${store.slug || store.id}`);
    } else {
      const category = item as Category;
      router.push(`/categories/${category.id}`);
    }
    setSearchQuery('');
  };

  // --- Dropdown Components ---

  // 1. Categories Mega Menu
  const CategoriesMenu = () => (
    <div className="grid grid-cols-4 gap-4 p-5 w-[650px] bg-white rounded-b-xl shadow-xl border border-gray-100 mt-2">
      <div className="col-span-3 grid grid-cols-2 gap-x-6 gap-y-2">
        {categories.slice(0, 10).map((cat) => (
          <Link key={cat.id} href={`/categories/${cat.id}`} className="flex items-center gap-2 group/item p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: cat.backgroundColor || '#ccc' }}>
              {cat.logoUrl ? <img src={cat.logoUrl} className="w-4 h-4 object-contain" /> : cat.name.charAt(0)}
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
        {trendingStores.slice(0, 10).map((store) => (
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

  return (
    <>

      {/* 1. TOP BAR (Teal - Balances Size) */}
      <div className="bg-[#042b26] text-white text-[11px] py-2 border-b border-white/5 relative z-50 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-full">
          <div className="hidden md:flex items-center gap-5 opacity-90">
            <Link href="/stores" className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
              <MapPin className="w-3.5 h-3.5" /> <span className="font-semibold tracking-wide">Find a Store</span>
            </Link>
            <div className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-400 transition-colors group relative">
              <span className="font-semibold tracking-wide">USD ($)</span> <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform" />
            </div>
          </div>

          <div className="flex-1 flex justify-center items-center gap-3">
            <button onClick={() => setPromoIndex((prev) => (prev - 1 + promotions.length) % promotions.length)} className="hover:text-emerald-400 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <AnimatePresence mode="wait">
              <motion.span key={promoIndex} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="font-semibold tracking-wider text-center min-w-[200px]">
                {promotions[promoIndex]}
              </motion.span>
            </AnimatePresence>
            <button onClick={() => setPromoIndex((prev) => (prev + 1) % promotions.length)} className="hover:text-emerald-400 transition-colors"><ChevronRight className="w-4 h-4" /></button>
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
      <div className="bg-[#0B453C] py-2 border-b border-[#0f5c4e] relative z-[110] font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 lg:gap-8">

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


            <div className="hidden lg:flex flex-1 max-w-2xl mx-auto relative">
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
              {showSuggestions && (searchResults.stores.length > 0 || searchResults.categories.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[150] max-h-96 overflow-y-auto">
                  {/* Stores Section */}
                  {searchResults.stores.length > 0 && (
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Stores</div>
                      {searchResults.stores.map((store) => (
                        <button
                          key={store.id}
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

                  {/* Categories Section */}
                  {searchResults.categories.length > 0 && (
                    <div className="p-2 border-t border-gray-100">
                      <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Categories</div>
                      {searchResults.categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleSuggestionClick('category', category)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: category.backgroundColor || '#ccc' }}
                          >
                            {category.logoUrl ? (
                              <img src={category.logoUrl} className="w-6 h-6 object-contain" alt={category.name} />
                            ) : (
                              category.name.charAt(0)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-900 truncate">{category.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* View All Results */}
                  <div className="p-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowSuggestions(false);
                        handleSearch({ preventDefault: () => { } } as React.FormEvent);
                      }}
                      className="w-full px-3 py-2 text-sm font-semibold text-[#0B453C] hover:bg-green-50 rounded-lg transition-colors text-center"
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                </div>
              )}
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

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="lg:hidden fixed inset-x-0 top-[140px] z-50 bg-[#0B453C] border-t border-white/10 shadow-xl overflow-hidden">
            <div className="px-4 py-6 space-y-4 max-h-[80vh] overflow-y-auto text-white">
              <div className="mb-6">
                <form onSubmit={handleSearch} className="flex w-full bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20">
                  <input type="text" placeholder="Search products..." className="flex-1 px-4 py-2 bg-transparent outline-none text-white placeholder:text-gray-300 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <button type="submit" className="bg-[#0B453C] p-2 rounded-full text-white"><Search className="w-4 h-4" /></button>
                </form>
              </div>
              {navLinks.map((link) => (
                <Link key={link.name} href={link.path} onClick={() => setMobileMenuOpen(false)} className="block py-2 border-b border-white/10 font-medium text-sm">{link.name}</Link>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/submit-coupon" onClick={() => setMobileMenuOpen(false)} className="py-2 text-xs text-gray-300">Submit Coupon</Link>
                <Link href="/support" onClick={() => setMobileMenuOpen(false)} className="py-2 text-xs text-gray-300">Support & FAQs</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
