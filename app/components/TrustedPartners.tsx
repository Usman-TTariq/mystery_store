'use client';

import { useEffect, useState } from 'react';
import { getLogosWithLayout, Logo } from '@/lib/services/logoService';
import { motion } from 'framer-motion';

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

// Get favicon URL with fallback to website URL
const getFaviconUrl = (logo: Logo): string | null => {
  if (logo.websiteUrl) {
    const domain = extractDomain(logo.websiteUrl);
    if (domain) return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }
  return null;
};

export default function TrustedPartners() {
  const [logos, setLogos] = useState<(Logo | null)[]>(Array(18).fill(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogos = async () => {
      setLoading(true);
      try {
        const data = await getLogosWithLayout();
        setLogos(data);
      } catch (error) {
        console.error('Error fetching logos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogos();
  }, []);

  // Filter out null logos
  const validLogos = logos.filter(logo => logo !== null) as Logo[];

  if (loading) {
    return (
      <div className="w-full px-2 sm:px-4 md:px-6 py-12 sm:py-16 md:py-20 bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-[#0B453C]/10 to-[#0f5c4e]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-green-300/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="h-12 bg-gray-200 rounded-lg w-96 mx-auto mb-4 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded-lg w-64 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4">
            {[...Array(18)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 h-24 animate-pulse shadow-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (validLogos.length === 0) {
    return null; // Don't show section if no logos
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-12 sm:py-16 md:py-20 bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-[#0B453C]/10 to-[#0f5c4e]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-green-300/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Text */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="bg-gradient-to-r from-[#0B453C] to-[#0f5c4e] bg-clip-text text-transparent">
              We're Just Keep Growing
            </span>
          </motion.h2>
          <motion.p
            className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            With <span className="bg-gradient-to-r from-[#0B453C] to-[#0f5c4e] bg-clip-text text-transparent">6.3k</span> Trusted Stores
          </motion.p>
        </div>

        <div className="relative overflow-hidden w-full">
          {/* Animated Sliding Row for Layout 1-9 */}
          <div className="overflow-hidden w-full mb-4 sm:mb-6">
            <div
              className="flex gap-3 sm:gap-4 md:gap-5"
              style={{
                animation: 'slideLeft 30s linear infinite',
                width: 'fit-content'
              }}
            >
              {[...Array(2)].map((_, loopIndex) => (
                logos.slice(0, 9).map((logo, index) => (
                  logo ? (
                    <div
                      key={`${logo.id}-${loopIndex}`}
                      className="bg-white rounded-xl p-3 sm:p-4 md:p-5 h-20 sm:h-24 md:h-28 w-24 sm:w-28 md:w-32 flex-shrink-0 flex items-center justify-center shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 group"
                    >
                      {(() => {
                        const faviconUrl = getFaviconUrl(logo);
                        const primaryUrl = logo.logoUrl;
                        const fallbackInitial = logo.name?.charAt(0) || '?';

                        return (
                          <div className="w-full h-full flex items-center justify-center overflow-hidden">
                            {primaryUrl ? (
                              <img
                                src={primaryUrl}
                                alt={logo.name}
                                className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (faviconUrl && target.src !== faviconUrl) {
                                    target.src = faviconUrl;
                                  } else {
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<div class="w-12 h-12 rounded-full bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] flex items-center justify-center text-white font-bold">${fallbackInitial.toUpperCase()}</div>`;
                                    }
                                  }
                                }}
                              />
                            ) : faviconUrl ? (
                              <img
                                src={faviconUrl}
                                alt={logo.name}
                                className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<div class="w-12 h-12 rounded-full bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] flex items-center justify-center text-white font-bold">${fallbackInitial.toUpperCase()}</div>`;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] flex items-center justify-center text-white font-bold">
                                {fallbackInitial.toUpperCase()}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div
                      key={`empty-${index}-${loopIndex}`}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 sm:p-4 md:p-5 h-20 sm:h-24 md:h-28 w-24 sm:w-28 md:w-32 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-gray-200"
                    >
                      <div className="text-gray-400 text-xs text-center">
                        <p className="font-medium">Slot {index + 1}</p>
                        <p className="text-[10px] mt-1">Empty</p>
                      </div>
                    </div>
                  )
                ))
              ))}
            </div>
          </div>

          {/* Animated Sliding Row for Layout 10-18 (Right to Left) */}
          <div className="overflow-hidden w-full">
            <div
              className="flex gap-3 sm:gap-4 md:gap-5"
              style={{
                animation: 'slideRight 30s linear infinite',
                width: 'fit-content'
              }}
            >
              {[...Array(2)].map((_, loopIndex) => (
                logos.slice(9, 18).map((logo, index) => (
                  logo ? (
                    <div
                      key={`${logo.id}-${loopIndex}`}
                      className="bg-white rounded-xl p-3 sm:p-4 md:p-5 h-20 sm:h-24 md:h-28 w-24 sm:w-28 md:w-32 flex-shrink-0 flex items-center justify-center shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 group"
                    >
                      {(() => {
                        const faviconUrl = getFaviconUrl(logo);
                        const primaryUrl = logo.logoUrl;
                        const fallbackInitial = logo.name?.charAt(0) || '?';

                        return (
                          <div className="w-full h-full flex items-center justify-center overflow-hidden">
                            {primaryUrl ? (
                              <img
                                src={primaryUrl}
                                alt={logo.name}
                                className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (faviconUrl && target.src !== faviconUrl) {
                                    target.src = faviconUrl;
                                  } else {
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<div class="w-12 h-12 rounded-full bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] flex items-center justify-center text-white font-bold">${fallbackInitial.toUpperCase()}</div>`;
                                    }
                                  }
                                }}
                              />
                            ) : faviconUrl ? (
                              <img
                                src={faviconUrl}
                                alt={logo.name}
                                className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<div class="w-12 h-12 rounded-full bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] flex items-center justify-center text-white font-bold">${fallbackInitial.toUpperCase()}</div>`;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] flex items-center justify-center text-white font-bold">
                                {fallbackInitial.toUpperCase()}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div
                      key={`empty-${index + 9}-${loopIndex}`}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 sm:p-4 md:p-5 h-20 sm:h-24 md:h-28 w-24 sm:w-28 md:w-32 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-gray-200"
                    >
                      <div className="text-gray-400 text-xs text-center">
                        <p className="font-medium">Slot {index + 10}</p>
                        <p className="text-[10px] mt-1">Empty</p>
                      </div>
                    </div>
                  )
                ))
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

