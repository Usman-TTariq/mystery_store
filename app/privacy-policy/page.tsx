'use client';

import { useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import Newsletter from '@/app/components/Newsletter';
import Footer from '@/app/components/Footer';
import { Shield, Lock, Eye, RefreshCw, Smartphone, Share2, AlertCircle, Mail, Globe, Users } from 'lucide-react';

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy - COUPACHU';
  }, []);

  const sections = [
    {
      id: "introduction",
      icon: <Globe className="w-6 h-6 text-[#0B453C]" />,
      title: "1. Introduction",
      content: "Welcome to COUPACHU (\"we,\" \"our,\" or \"us\"). We are committed to protecting your privacy and ensuring you have a positive experience on our website. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website COUPACHU.com."
    },
    {
      id: "collection",
      icon: <Users className="w-6 h-6 text-[#0B453C]" />,
      title: "2. Information We Collect",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">2.1 Information You Provide</h4>
            <p className="text-gray-700">We may collect information that you voluntarily provide to us when you register for an account, subscribe to our newsletter, or contact us through our forms.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">2.2 Automatically Collected Information</h4>
            <p className="text-gray-700">When you visit our website, we automatically collect certain information about your device, including IP address, browser type, and pages visited.</p>
          </div>
        </div>
      )
    },
    {
      id: "usage",
      icon: <Eye className="w-6 h-6 text-[#0B453C]" />,
      title: "3. How We Use Your Information",
      content: "We use the information we collect to provide and maintain our services, personalize your experience, send you relevant updates (with your consent), and analyze website usage to improve our platform."
    },
    {
      id: "tracking",
      icon: <RefreshCw className="w-6 h-6 text-[#0B453C]" />,
      title: "4. Cookies and Tracking",
      content: "We use cookies and similar technologies to track activity on our platform and store certain information. You can manage your cookie preferences through your browser settings at any time."
    },
    {
      id: "sharing",
      icon: <Share2 className="w-6 h-6 text-[#0B453C]" />,
      title: "5. Information Sharing",
      content: "We do not sell or rent your personal information to third parties. We may share data with trusted service providers who assist us in operating our website, provided they agree to keep this information confidential."
    },
    {
      id: "security",
      icon: <Lock className="w-6 h-6 text-[#0B453C]" />,
      title: "6. Data Security",
      content: "We implement robust technical security measures to protect your data. However, remember that no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security."
    },
    {
      id: "rights",
      icon: <Shield className="w-6 h-6 text-[#0B453C]" />,
      title: "7. Your Rights",
      content: "Depending on your location, you may have rights to access, correct, or delete your personal data. You can always opt-out of marketing communications by following the unsubscribe link in our emails."
    },
    {
      id: "third-party",
      icon: <Smartphone className="w-6 h-6 text-[#0B453C]" />,
      title: "8. Third-Party Links",
      content: "Our platform contains links to partner retailers. We are not responsible for their privacy practices, and we encourage you to read the privacy policies of any third-party site you visit."
    },
    {
      id: "updates",
      icon: <AlertCircle className="w-6 h-6 text-[#0B453C]" />,
      title: "9. Policy Updates",
      content: "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the \"Last updated\" date at the top."
    },
    {
      id: "contact",
      icon: <Mail className="w-6 h-6 text-[#0B453C]" />,
      title: "10. Contact Us",
      content: "If you have any questions about this Privacy Policy, please contact us at privacy@COUPACHU.com."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <div className="w-full bg-gradient-to-br from-green-50 via-white to-emerald-50 border-b border-green-100/50 py-16 sm:py-20 md:py-24 overflow-hidden relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-200/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-200/20 rounded-full -ml-24 -mb-24 blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-[#0B453C] text-sm font-semibold mb-6">
            <Lock className="w-4 h-4" />
            <span>Secure & Private</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Privacy <span className="text-[#0B453C]">Policy</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your privacy is our priority. Learn how we handle your data with transparency and care at COUPACHU.
          </p>
          <div className="mt-8 text-sm font-medium text-gray-400">
            Last Updated: Jan 2025
          </div>
        </div>
      </div>

      <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

      <div className="w-full px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 gap-12 sm:gap-16">
            {sections.map((section, idx) => (
              <div key={section.id} className="relative group">
                <div className="flex gap-4 sm:gap-6">
                  {/* Icon Column */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                      {section.icon}
                    </div>
                    {idx < sections.length - 1 && (
                      <div className="w-px flex-1 bg-gradient-to-b from-green-100 to-transparent my-4"></div>
                    )}
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 pb-12 sm:pb-16">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">
                      {section.title}
                    </h2>
                    <div className="text-gray-700 leading-relaxed text-base sm:text-lg">
                      {section.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Summary Card */}
          <div className="mt-8 bg-[#0B453C] rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-md">
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">Summary of Privacy</h3>
                <p className="text-white/80 leading-relaxed">
                  We collect minimal data to provide the best deals. We never sell your personal information and always prioritize security in every transaction.
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <Shield className="w-12 h-12 text-white mb-4" />
                  <div className="text-sm font-semibold uppercase tracking-wider">Verified Secure</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Newsletter />
      <Footer />
    </div>
  );
}

