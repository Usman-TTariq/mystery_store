'use client';

import { useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import Newsletter from '@/app/components/Newsletter';
import Footer from '@/app/components/Footer';
import { Shield, FileText, CheckCircle, AlertCircle, Info, BookOpen } from 'lucide-react';

export default function TermsAndConditionsPage() {
  useEffect(() => {
    document.title = 'Terms and Conditions - COUPACHU';
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <Breadcrumbs items={[{ label: 'Terms and Conditions' }]} />

      {/* Hero Section */}
      <div className="w-full bg-gradient-to-br from-green-50 via-white to-emerald-50 py-16 sm:py-20 md:py-24 relative overflow-hidden text-center border-b border-green-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/20 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-200/20 rounded-full -ml-36 -mb-36 blur-3xl"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-[#0B453C] text-sm font-semibold mb-6">
            <Shield className="w-4 h-4" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Terms & <span className="text-[#0B453C]">Conditions</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully before using our service. Last updated: January 2025
          </p>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-sm sm:prose-base max-w-none space-y-12">

            <section className="bg-white border border-green-50 rounded-2xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-[#0B453C]">
                  <FileText className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">
                  1. Agreement to Terms
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing and using COUPACHU ("the Website"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p className="text-gray-700 leading-relaxed m-0">
                These Terms and Conditions ("Terms") govern your access to and use of our website, services, and applications. By using our services, you agree to comply with and be bound by these Terms.
              </p>
            </section>

            <section className="bg-white border border-green-50 rounded-2xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-[#0B453C]">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">
                  2. Use of the Website
                </h2>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0B453C]"></span>
                    2.1 Eligibility
                  </h3>
                  <p className="text-gray-700 leading-relaxed m-0">
                    You must be at least 18 years old to use this website. By using the website, you represent and warrant that you are at least 18 years of age and have the legal capacity to enter into these Terms.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0B453C]"></span>
                    2.2 Acceptable Use
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You agree to use the website only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the website. Prohibited behavior includes:
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 m-0 p-0 text-gray-700 list-none">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Legal compliance only</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>No harassment or harm</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>No unauthorized scraping</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>No impersonation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-white border border-green-50 rounded-2xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-[#0B453C]">
                  <Info className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">
                  3. Coupon Codes and Deals
                </h2>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0B453C]"></span>
                    3.1 Availability
                  </h3>
                  <p className="text-gray-700 leading-relaxed m-0">
                    We strive to provide accurate and up-to-date coupon codes and deals. However, we cannot guarantee that all coupons will be valid, available, or applicable to your purchase.
                  </p>
                </div>

                <div className="bg-emerald-50 rounded-xl p-6 border-l-4 border-[#0B453C]">
                  <h3 className="text-xl font-bold text-[#0B453C] mb-3 flex items-center gap-2 m-0">
                    <AlertCircle className="w-5 h-5" />
                    3.2 No Warranty
                  </h3>
                  <p className="text-[#0B453C]/80 leading-relaxed m-0 mt-3 font-medium">
                    We do not warrant or guarantee that any coupon code will work, be valid, or provide the discount advertised. The validity and applicability of coupon codes are determined solely by the retailers.
                  </p>
                </div>
              </div>
            </section>

            {/* Rest of the sections following the same pattern */}
            <section className="bg-white border border-green-50 rounded-2xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-[#0B453C]">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">
                  4. Intellectual Property
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed m-0">
                All content on this website, including but not limited to text, graphics, logos, images, and software, is the property of COUPACHU or its content suppliers and is protected by copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="bg-[#0B453C] rounded-2xl p-8 sm:p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-6">Need Legal Help?</h2>
                <p className="text-green-100 text-lg mb-8 max-w-xl">
                  If you have any questions about these Terms and Conditions or our practices, please reach out to our legal support team.
                </p>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-green-300 text-sm font-medium">Email Support</p>
                      <p className="font-bold">legal@COUPACHU.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-green-300 text-sm font-medium">Our Website</p>
                      <p className="font-bold">www.COUPACHU.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>

      <Newsletter />
      <Footer />
    </div>
  );
}

