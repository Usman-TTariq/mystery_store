'use client';

import { useEffect, useState } from 'react';
import { getActiveFAQs, FAQ } from '@/lib/services/faqService';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FAQSection() {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    useEffect(() => {
        const fetchFaqs = async () => {
            setLoading(true);
            try {
                const data = await getActiveFAQs();
                setFaqs(data.slice(0, 6)); // Show first 6 FAQs on homepage
            } catch (error) {
                console.error('Error fetching FAQs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFaqs();
    }, []);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    if (!loading && faqs.length === 0) return null;

    return (
        <section className="py-20 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B453C]/10 text-[#0B453C] text-sm font-bold mb-4"
                    >
                        <HelpCircle className="w-4 h-4" />
                        <span>Common Questions</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4"
                    >
                        Frequently Asked <span className="text-[#0B453C]">Questions</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="text-gray-600 max-w-2xl mx-auto text-lg"
                    >
                        Everything you need to know about using COUPACHU and getting the best deals.
                    </motion.p>
                </div>

                <div className="max-w-3xl mx-auto">
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-16 bg-white rounded-2xl animate-pulse shadow-sm" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <motion.div
                                    key={faq.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className={`bg-white rounded-2xl border transition-all duration-300 ${openIndex === index
                                            ? 'border-[#0B453C] shadow-lg shadow-[#0B453C]/5'
                                            : 'border-gray-100 shadow-sm hover:border-[#0B453C]/30'
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleFAQ(index)}
                                        className="w-full px-6 py-5 text-left flex items-center justify-between group"
                                    >
                                        <span className={`text-lg font-bold transition-colors ${openIndex === index ? 'text-[#0B453C]' : 'text-gray-900'
                                            }`}>
                                            {faq.question}
                                        </span>
                                        <div className={`p-2 rounded-full transition-all duration-300 ${openIndex === index ? 'bg-[#0B453C] text-white' : 'bg-gray-50 text-gray-400 group-hover:text-[#0B453C]'
                                            }`}>
                                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''
                                                }`} />
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {openIndex === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 pb-6 pt-0">
                                                    <div className="pt-4 border-t border-gray-50">
                                                        <p className="text-gray-600 leading-relaxed text-base">
                                                            {faq.answer}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        viewport={{ once: true }}
                        className="text-center mt-12"
                    >
                        <a
                            href="/faqs"
                            className="inline-flex items-center gap-2 text-[#0B453C] font-bold hover:underline group"
                        >
                            View all FAQs
                            <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
