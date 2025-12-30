'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import Newsletter from '@/app/components/Newsletter';
import Footer from '@/app/components/Footer';
import { Mail, Clock, MapPin, Send, CheckCircle, AlertCircle, Phone, Globe, MessageSquare, User, AtSign, Type } from 'lucide-react';

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  useEffect(() => {
    document.title = 'Contact Us - COUPACHU';
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitStatus({
        type: 'error',
        message: 'Please fill in all required fields.'
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setSubmitStatus({
        type: 'error',
        message: 'Please enter a valid email address.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Thank you for contacting us! We will get back to you soon.'
        });
        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Failed to send message. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus({
        type: 'error',
        message: 'An error occurred. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <Breadcrumbs items={[{ label: 'Contact Us' }]} />

      {/* Hero Section */}
      <div className="w-full bg-gradient-to-br from-green-50 via-white to-emerald-50 py-16 sm:py-20 md:py-24 relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/20 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-200/20 rounded-full -ml-36 -mb-36 blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-[#0B453C] text-sm font-semibold mb-6">
            <MessageSquare className="w-4 h-4" />
            <span>24/7 Support Support</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Get in <span className="text-[#0B453C]">Touch</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Have a question about a deal or need technical help? Our team of experts is ready to assist you.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 md:px-8 py-12 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto">

          {/* Minimalist Contact Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
            <div className="group flex items-center gap-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-[#0B453C]/20 hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="w-10 h-10 bg-[#0B453C] rounded-xl flex items-center justify-center text-white">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Email Us</p>
                <p className="text-sm font-bold text-[#0B453C]">contact@COUPACHU.com</p>
              </div>
            </div>

            <div className="group flex items-center gap-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-[#0B453C]/20 hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="w-10 h-10 bg-[#0B453C] rounded-xl flex items-center justify-center text-white">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Response Time</p>
                <p className="text-sm font-bold text-[#0B453C]">24-48 Hours</p>
              </div>
            </div>

            <div className="group flex items-center gap-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-[#0B453C]/20 hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="w-10 h-10 bg-[#0B453C] rounded-xl flex items-center justify-center text-white">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Availability</p>
                <p className="text-sm font-bold text-[#0B453C]">Everyday 24/7</p>
              </div>
            </div>
          </div>

          {/* Centered Narrow Form Card */}
          <div className="max-w-xl mx-auto">
            <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.08)] p-8 sm:p-12 relative overflow-hidden">
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B453C] via-emerald-400 to-[#0B453C]"></div>

              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Send us a Message</h2>
                <p className="text-gray-500 font-medium">We'd love to hear from you!</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0B453C] transition-colors duration-300">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0B453C]/10 focus:border-[#0B453C] focus:bg-white transition-all duration-300 text-gray-900 font-semibold text-sm"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0B453C] transition-colors duration-300">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0B453C]/10 focus:border-[#0B453C] focus:bg-white transition-all duration-300 text-gray-900 font-semibold text-sm"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="subject" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0B453C] transition-colors duration-300">
                      <Type className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0B453C]/10 focus:border-[#0B453C] focus:bg-white transition-all duration-300 text-gray-900 font-semibold text-sm"
                      placeholder="What is this regarding?"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Message</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-5 text-gray-300 group-focus-within:text-[#0B453C] transition-colors duration-300">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0B453C]/10 focus:border-[#0B453C] focus:bg-white transition-all duration-300 text-gray-900 font-semibold text-sm resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>
                </div>

                {/* Status Messages */}
                {submitStatus.message && (
                  <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500 ${submitStatus.type === 'success' ? 'bg-green-50 text-[#0B453C] border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {submitStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-bold text-xs sm:text-sm">{submitStatus.message}</span>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#0B453C] hover:bg-[#093a32] text-white font-extrabold rounded-2xl shadow-xl shadow-[#0B453C]/10 hover:shadow-2xl hover:shadow-[#0B453C]/20 hover:-translate-y-1 transition-all duration-500 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3 group overflow-hidden relative"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative z-10">Send Message</span>
                        <Send className="w-4 h-4 relative z-10 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-[#0B453C] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Newsletter />
      <Footer />
    </div>
  );
}

