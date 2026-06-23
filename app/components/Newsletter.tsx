'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

export default function Newsletter() {
    const [email, setEmail] = useState('');

    const handleNewsletterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Newsletter subscription:', email);
        alert(`Thank you for subscribing with ${email}!`);
        setEmail('');
    };

    return (
        <section
            className="relative w-full max-w-full overflow-hidden py-10 sm:py-12 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/Section.png)' }}
        >
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 w-full min-w-0">
                    {/* Left Side - Text */}
                    <div className="flex-1 min-w-0 text-center md:text-left">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-sm leading-snug">
                            Subscribe Our Newsletter To Get The Best
                        </h2>
                        <p className="text-white/90 text-sm sm:text-base md:text-lg font-medium drop-shadow-sm">
                            Deals Right In Your Email
                        </p>
                    </div>

                    {/* Right Side - Form */}
                    <div className="w-full md:flex-1 md:max-w-md min-w-0">
                        <form
                            onSubmit={handleNewsletterSubmit}
                            className="flex flex-col sm:flex-row gap-3 w-full min-w-0"
                        >
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter Email"
                                required
                                className="w-full min-w-0 flex-1 px-4 sm:px-6 py-3 bg-white border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60 text-gray-900 placeholder-gray-500"
                            />
                            <button
                                type="submit"
                                className="w-full sm:w-auto shrink-0 px-6 py-3 bg-white text-[#0B453C] hover:bg-emerald-50 rounded-lg shadow-sm transition font-semibold flex items-center justify-center gap-2"
                            >
                                Send
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
