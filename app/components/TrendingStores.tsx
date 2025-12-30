"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MoveRight, Star, Heart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { getStores, Store } from "@/lib/services/storeService";

export default function TrendingStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayedText, setDisplayedText] = useState("");
  const fullText = "Trending Stores";

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await getStores();
        setStores(data.slice(0, 8));
      } catch (error) {
        console.error("Failed to fetch stores", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  // Typing effect
  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, []);

  // Helper function to extract domain from URL (including tracking URLs)
  const extractDomain = (url: string): string | null => {
    if (!url) return null;
    try {
      // Handle tracking URLs that might redirect
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return null;
    }
  };

  // Get favicon URL with fallback to tracking link
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

    return null;
  };

  if (loading) {
    return (
      <div className="w-full px-2 sm:px-4 md:px-6 py-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded mb-8 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white h-80 rounded-xl shadow-sm animate-pulse border border-gray-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header with Typing Effect */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-10"
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-12 h-12 bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] rounded-xl flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black">
                <span className="bg-gradient-to-r from-[#0B453C] to-[#0f5c4e] bg-clip-text text-transparent">
                  {displayedText}
                </span>
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="text-[#0B453C]"
                >
                  |
                </motion.span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Discover top-rated stores with exclusive deals</p>
            </div>
          </div>
          <Link
            href="/stores"
            className="group flex items-center gap-2 px-5 py-2.5 bg-[#0B453C] text-white rounded-lg font-semibold hover:bg-[#08352e] transition-all duration-300 shadow-md hover:shadow-lg text-sm"
          >
            View All <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Grid Layout with entrance animations */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stores.map((store, index) => (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#0B453C]/20 transition-all duration-300 p-5 flex flex-col relative overflow-hidden"
            >
              {/* Hover overlay effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0B453C]/0 to-[#0B453C]/0 group-hover:from-[#0B453C]/5 group-hover:to-transparent transition-all duration-500 pointer-events-none" />

              {/* Verified Badge */}
              <div className="absolute top-3 left-3 bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 z-10">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                VERIFIED
              </div>

              {/* Favorite Button */}
              <button className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-[#0B453C] hover:bg-green-50 transition-colors z-10">
                <Heart className="w-4 h-4" />
              </button>

              {/* Store Favicon */}
              <div className="w-full h-40 bg-gray-50 rounded-lg mb-4 flex items-center justify-center p-4 overflow-hidden mt-6 relative">
                {getFaviconUrl(store) ? (
                  <img
                    src={getFaviconUrl(store)!}
                    alt={store.name}
                    className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] flex items-center justify-center"><span class="text-2xl font-bold text-white">${store.name.charAt(0).toUpperCase()}</span></div>`;
                      }
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{store.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>

              {/* Store Name */}
              <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-[#0B453C] transition-colors line-clamp-1 text-center relative z-10">
                {store.name}
              </h3>

              {/* Rating */}
              <div className="flex items-center justify-center gap-1 mb-3 relative z-10">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-gray-700">4.9</span>
                <span className="text-xs text-gray-500">(120+ Reviews)</span>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-500 text-center mb-4 line-clamp-2 flex-grow relative z-10">
                Get the best deals and coupons for {store.name}. Save big today!
              </p>

              {/* Visit Store Button */}
              <Link
                href={store.slug ? `/stores/${store.slug}` : `/stores/${store.id}`}
                className="w-full block text-center py-2.5 rounded-lg bg-gradient-to-r from-[#0B453C] to-[#0f5c4e] text-white text-sm font-semibold hover:shadow-lg transition-all duration-300 relative z-10 group/btn"
              >
                <span className="flex items-center justify-center gap-2">
                  Visit Store
                  <MoveRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
