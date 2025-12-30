'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getBannerByLayoutPosition, Banner } from '@/lib/services/bannerService';
import { getActiveFAQs, FAQ } from '@/lib/services/faqService';
import Navbar from '@/app/components/Navbar';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import Newsletter from '@/app/components/Newsletter';
import Footer from '@/app/components/Footer';
import ContactSupportModal from '@/app/components/ContactSupportModal';
import { HelpCircle, MessageCircle, ChevronDown, CheckCircle, Search } from 'lucide-react';

export default function FAQsPage() {
  const [banner11, setBanner11] = useState<Banner | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    // Set page title
    document.title = 'FAQs - COUPACHU';

    const fetchData = async () => {
      setLoading(true);
      try {
        const [bannerData, faqsData] = await Promise.all([
          getBannerByLayoutPosition(11),
          getActiveFAQs()
        ]);
        setBanner11(bannerData);
        setFaqs(faqsData);
      } catch (error) {
        console.error('Error fetching FAQs page data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <Navbar />

      {/* Banner Section with Layout 11 */}
      <div className="w-full">
        {loading ? (
          <div className="w-full bg-gray-100 aspect-[1728/547] min-h-[200px] sm:min-h-[250px] animate-pulse"></div>
        ) : banner11 ? (
          <div className="relative w-full">
            <div className="relative w-full aspect-[1728/547] min-h-[200px] sm:min-h-[250px]">
              {banner11.imageUrl.includes('res.cloudinary.com') || banner11.imageUrl.includes('storage.googleapis.com') ? (
                <Image
                  src={banner11.imageUrl}
                  alt={banner11.title || 'FAQs'}
                  fill
                  className="object-contain sm:object-cover"
                  priority
                  sizes="100vw"
                  onError={(e) => {
                    console.error('FAQs banner 11 image failed to load:', banner11.imageUrl);
                  }}
                />
              ) : (
                <img
                  src={banner11.imageUrl}
                  alt={banner11.title || 'FAQs'}
                  className="w-full h-full object-contain sm:object-cover"
                  loading="lazy"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error('FAQs banner 11 image failed to load:', banner11.imageUrl);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="w-full aspect-[1728/547] min-h-[200px] sm:min-h-[250px] bg-gradient-to-r from-pink-100 to-orange-100"></div>
        )}
      </div>

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'FAQs' }
        ]}
      />

      {/* FAQs Section */}
      <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 bg-white overflow-x-hidden">
        <div className="max-w-4xl mx-auto w-full">

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg p-6 animate-pulse h-24"></div>
              ))}
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">No FAQs available at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={faq.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  {/* Question */}
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-4 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#0B453C] focus:ring-offset-2 rounded-lg group"
                  >
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 pr-4 flex-1 group-hover:text-[#0B453C] transition-colors">
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0">
                      <ChevronDown
                        className={`w-5 h-5 sm:w-6 sm:h-6 text-[#0B453C] transition-transform duration-300 ${openIndex === index ? 'transform rotate-180' : ''
                          }`}
                      />
                    </div>
                  </button>

                  {/* Answer */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                  >
                    <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-0">
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Additional Help Section */}
          <div className="mt-12 sm:mt-16 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 sm:p-12 text-center border border-green-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#0B453C]/10 rounded-2xl flex items-center justify-center text-[#0B453C] mx-auto mb-6">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Still have questions?
              </h3>
              <p className="text-gray-600 text-lg mb-8 max-w-xl mx-auto">
                Can't find the answer you're looking for? Our friendly support team is here to help you get the most out of COUPACHU.
              </p>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#0B453C] to-emerald-700 text-white font-bold rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5" />
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>

      <Newsletter />

      {/* Footer */}
      <Footer />

      {/* Contact Support Modal */}
      <ContactSupportModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div>
  );
}

