"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { getCategories, Category } from "@/lib/services/categoryService";

// Helper component for Scroll Container
const ScrollContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
        }
    };

    return (
        <div className="relative group/section">
            <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-5 z-20 w-9 h-9 bg-[#0B453C] shadow-xl border border-[#0B453C] rounded-full flex items-center justify-center text-white hover:bg-[#08352e] hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/section:opacity-100 disabled:opacity-0"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-5 z-20 w-9 h-9 bg-[#0B453C] shadow-xl border border-[#0B453C] rounded-full flex items-center justify-center text-white hover:bg-[#08352e] hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/section:opacity-100"
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            <div
                ref={scrollRef}
                className={`flex items-center gap-6 overflow-x-auto py-6 px-2 snap-x scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${className}`}
            >
                {children}
            </div>
        </div>
    );
};

export default function ShopByCategory() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategories();
                // Duplicate data to simulate more categories for scroll testing if needed, or just use data
                setCategories(data);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex gap-6 overflow-hidden">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 min-w-[90px]">
                            <div className="w-20 h-20 bg-gray-100 rounded-full animate-pulse" />
                            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <section className="py-10 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <ScrollContainer>
                    {categories.map((cat, index) => {
                        const isEven = index % 2 === 0;
                        const bgClass = isEven ? "bg-green-50" : "bg-emerald-50";
                        const iconColorClass = isEven ? "text-[#0B453C]" : "text-emerald-700";

                        return (
                            <Link
                                key={cat.id}
                                href={`/categories/${cat.id}`}
                                className="flex flex-col items-center gap-3 min-w-[90px] snap-start group cursor-pointer"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: index * 0.05, type: "spring", stiffness: 260, damping: 20 }}
                                    className={`w-20 h-20 rounded-full flex items-center justify-center ${bgClass} ${iconColorClass} shadow-sm group-hover:shadow-lg transition-shadow duration-300 relative overflow-hidden`}
                                >
                                    {/* Parallax-like shiny effect on hover */}
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-full" />

                                    {cat.logoUrl ? (
                                        <img src={cat.logoUrl} alt={cat.name} className="w-9 h-9 object-contain relative z-10" />
                                    ) : (
                                        <span className="text-xl font-bold relative z-10">{cat.name.charAt(0)}</span>
                                    )}
                                </motion.div>
                                <span className="text-sm font-bold text-gray-700 text-center whitespace-nowrap group-hover:text-[#0B453C] transition-colors">
                                    {cat.name}
                                </span>
                            </Link>
                        );
                    })}
                </ScrollContainer>

                {/* Pagination Dots */}
                <div className="flex justify-center items-center gap-1.5 mt-4">
                    <span className="w-6 h-1.5 bg-[#0B453C] rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
                </div>

            </div>
        </section>
    );
}
