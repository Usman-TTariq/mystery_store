"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { getCategories, Category } from "@/lib/services/categoryService";
import CategoryIcon from "@/app/components/CategoryIcon";
import { categoryIconBgClass } from "@/lib/utils/categoryIcon";

const ITEM_WIDTH = 90;
const ITEM_GAP = 24;

export default function ShopByCategory() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePage, setActivePage] = useState(0);
    const [pageCount, setPageCount] = useState(1);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategories();
                setCategories(data);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const updatePagination = useCallback(() => {
        const el = scrollRef.current;
        if (!el || categories.length === 0) return;

        const itemStride = ITEM_WIDTH + ITEM_GAP;
        const visible = Math.max(1, Math.floor(el.clientWidth / itemStride));
        const pages = Math.max(1, Math.ceil(categories.length / visible));
        setPageCount(pages);

        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll <= 0) {
            setActivePage(0);
            return;
        }

        const progress = el.scrollLeft / maxScroll;
        setActivePage(Math.min(pages - 1, Math.round(progress * (pages - 1))));
    }, [categories.length]);

    useEffect(() => {
        updatePagination();
        window.addEventListener("resize", updatePagination);
        return () => window.removeEventListener("resize", updatePagination);
    }, [updatePagination, categories]);

    const scroll = (direction: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        const scrollAmount = Math.max(el.clientWidth * 0.85, ITEM_WIDTH + ITEM_GAP);
        el.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    const scrollToPage = (page: number) => {
        const el = scrollRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll <= 0) return;
        const target = pageCount <= 1 ? 0 : (page / (pageCount - 1)) * maxScroll;
        el.scrollTo({ left: target, behavior: "smooth" });
    };

    const navButtonClass =
        "w-9 h-9 bg-[#0B453C] shadow-md border border-[#0B453C] rounded-full flex items-center justify-center text-white hover:bg-[#08352e] active:scale-95 transition-all shrink-0";

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full min-w-0">
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
        <section className="py-10 bg-white overflow-x-hidden w-full max-w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
                <div className="relative group/section">
                    <button
                        type="button"
                        onClick={() => scroll("left")}
                        aria-label="Previous categories"
                        className={`hidden md:flex absolute left-0 top-[calc(50%-12px)] -translate-y-1/2 z-20 ${navButtonClass} opacity-0 group-hover/section:opacity-100`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scroll("right")}
                        aria-label="Next categories"
                        className={`hidden md:flex absolute right-0 top-[calc(50%-12px)] -translate-y-1/2 z-20 ${navButtonClass} opacity-0 group-hover/section:opacity-100`}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    <div
                        ref={scrollRef}
                        onScroll={updatePagination}
                        className="flex items-start gap-6 overflow-x-auto py-6 px-1 md:px-12 snap-x scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full min-w-0"
                    >
                        {categories.map((cat, index) => (
                            <Link
                                key={cat.id}
                                href={`/categories/${cat.id}`}
                                className="flex flex-col items-center gap-3 min-w-[90px] snap-start group cursor-pointer shrink-0"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: index * 0.05,
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 20,
                                    }}
                                    className={`w-20 h-20 rounded-full flex items-center justify-center ${categoryIconBgClass} shadow-sm group-hover:shadow-lg transition-shadow duration-300 relative overflow-hidden`}
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-full" />
                                    <CategoryIcon
                                        logoUrl={cat.logoUrl}
                                        name={cat.name}
                                        imgClassName="w-10 h-10 object-contain relative z-10 brightness-0"
                                    />
                                </motion.div>
                                <span className="text-sm font-bold text-gray-700 text-center whitespace-nowrap group-hover:text-[#0B453C] transition-colors lowercase">
                                    {cat.name.toLowerCase()}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                {pageCount > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-1 md:mt-2">
                        <button
                            type="button"
                            onClick={() => scroll("left")}
                            aria-label="Previous categories"
                            className={`md:hidden ${navButtonClass}`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: pageCount }).map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    aria-label={`Go to category page ${i + 1}`}
                                    onClick={() => scrollToPage(i)}
                                    className={`rounded-full transition-all ${
                                        i === activePage
                                            ? "w-6 h-1.5 bg-[#0B453C]"
                                            : "w-1.5 h-1.5 bg-gray-200 hover:bg-gray-300"
                                    }`}
                                />
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => scroll("right")}
                            aria-label="Next categories"
                            className={`md:hidden ${navButtonClass}`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
