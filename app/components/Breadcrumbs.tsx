'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useEffect } from 'react';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
    // Generate structured data for SEO
    const generateStructuredData = () => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

        const itemListElement = [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: baseUrl
            },
            ...items.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 2,
                name: item.label,
                ...(item.href && { item: `${baseUrl}${item.href}` })
            }))
        ];

        return {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement
        };
    };

    useEffect(() => {
        // Inject structured data into the page
        if (typeof window !== 'undefined') {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.text = JSON.stringify(generateStructuredData());
            script.id = 'breadcrumb-schema';

            // Remove existing breadcrumb schema if present
            const existing = document.getElementById('breadcrumb-schema');
            if (existing) {
                existing.remove();
            }

            document.head.appendChild(script);

            return () => {
                const scriptToRemove = document.getElementById('breadcrumb-schema');
                if (scriptToRemove) {
                    scriptToRemove.remove();
                }
            };
        }
    }, [items]);

    return (
        <nav
            aria-label="Breadcrumb"
            className={`w-full ${className}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <ol className="flex items-center flex-wrap gap-2 text-sm">
                    {/* Home Link */}
                    <li className="flex items-center group">
                        <Link
                            href="/"
                            className="flex items-center gap-1.5 text-gray-600 hover:text-[#0B453C] transition-all duration-300 hover:scale-105"
                        >
                            <Home className="w-4 h-4" />
                            <span className="font-medium">Home</span>
                        </Link>
                    </li>

                    {/* Breadcrumb Items */}
                    {items.map((item, index) => {
                        const isLast = index === items.length - 1;

                        return (
                            <li key={index} className="flex items-center gap-2">
                                {/* Separator */}
                                <ChevronRight className="w-4 h-4 text-gray-400" />

                                {/* Breadcrumb Item */}
                                {isLast || !item.href ? (
                                    <span
                                        className="text-[#0B453C] font-semibold px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-[#0B453C]/20"
                                        aria-current="page"
                                    >
                                        {item.label}
                                    </span>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className="text-gray-600 hover:text-[#0B453C] transition-all duration-300 font-medium hover:underline hover:underline-offset-4 px-2 py-1 rounded hover:bg-green-50"
                                    >
                                        {item.label}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>
        </nav>
    );
}
