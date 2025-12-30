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
            className="relative w-full py-12 bg-cover bg-center overflow-hidden"
            style={{ backgroundImage: 'url(/Section.png)' }}
        >
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Left Side - Text */}
                    <div className="flex-1">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                            Subscribe Our Newsletter To Get The Best
                        </h2>
                        <p className="text-white font-medium">
                            Deals Right In Your Email
                        </p>
                    </div>

                    {/* Right Side - Form */}
                    <div className="flex-1 max-w-md w-full">
                        <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter Email"
                                required
                                className="flex-1 px-6 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B453C] text-gray-900 placeholder-gray-500"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-[#0B453C] hover:bg-emerald-700 text-white rounded-lg transition font-semibold flex items-center gap-2"
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
