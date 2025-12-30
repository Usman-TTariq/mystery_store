'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Testimonial {
    id: number;
    name: string;
    role: string;
    text: string;
    rating: number;
    avatar: string;
}

const testimonials: Testimonial[] = [
    {
        id: 1,
        name: 'David Smith',
        role: 'Software Engineer',
        text: "I've saved so much money using this platform! From groceries to electronics, the cashback offers are legit and timely. What I love most is how easy it is to request money after making a purchase.",
        rating: 5,
        avatar: '👨‍💼'
    },
    {
        id: 2,
        name: 'Sarah Johnson',
        role: 'Marketing Manager',
        text: "Amazing deals and cashback offers! This platform has become my go-to for all online shopping. The savings add up quickly and the process is super smooth.",
        rating: 5,
        avatar: '👩‍💼'
    },
    {
        id: 3,
        name: 'Michael Chen',
        role: 'Business Owner',
        text: "Best cashback platform I've used. The variety of stores and exclusive coupons make shopping so much more rewarding. Highly recommend!",
        rating: 5,
        avatar: '👨‍💻'
    },
    {
        id: 4,
        name: 'Emily Davis',
        role: 'Teacher',
        text: "Love the exclusive deals and how easy it is to save money on everyday purchases. The customer service is also top-notch!",
        rating: 5,
        avatar: '👩‍🏫'
    },
    {
        id: 5,
        name: 'James Wilson',
        role: 'Designer',
        text: "Great platform with amazing offers. I've saved hundreds of dollars in just a few months. The interface is clean and user-friendly.",
        rating: 5,
        avatar: '👨‍🎨'
    },
    {
        id: 6,
        name: 'Lisa Anderson',
        role: 'Entrepreneur',
        text: "Fantastic savings and excellent customer support. This platform makes online shopping so much more rewarding!",
        rating: 5,
        avatar: '👩‍💼'
    },
    {
        id: 7,
        name: 'Robert Taylor',
        role: 'Developer',
        text: "The best cashback platform I've ever used. Simple, effective, and the deals are always great!",
        rating: 5,
        avatar: '👨‍💻'
    }
];

export default function Testimonials() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const nextTestimonial = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const currentTestimonial = testimonials[currentIndex];

    // Get visible testimonials (current and adjacent)
    const getVisibleTestimonials = () => {
        const prev = (currentIndex - 1 + testimonials.length) % testimonials.length;
        const next = (currentIndex + 1) % testimonials.length;
        return [prev, currentIndex, next];
    };

    // Auto-play functionality
    useEffect(() => {
        const interval = setInterval(() => {
            if (!isHovered) {
                setCurrentIndex((prev) => (prev + 1) % testimonials.length);
            }
        }, 5000); // Auto-advance every 5 seconds

        return () => clearInterval(interval);
    }, [isHovered]);

    return (
        <section className="py-20 bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-[#0B453C]/10 to-[#0f5c4e]/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-green-300/5 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <motion.h2
                        className="text-4xl md:text-5xl font-bold mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="bg-gradient-to-r from-[#0B453C] to-[#0f5c4e] bg-clip-text text-transparent">
                            What Our Users Say
                        </span>
                    </motion.h2>
                    <motion.p
                        className="text-gray-600 text-lg max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        Join thousands of happy customers saving money every day
                    </motion.p>
                </div>

                {/* Testimonials Carousel */}
                <div className="relative">
                    {/* Desktop: 3-Card Carousel */}
                    <div className="hidden md:block">
                        <div
                            className="relative h-[400px] flex items-center justify-center"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            <div className="flex items-center gap-6 justify-center w-full max-w-6xl mx-auto px-16">
                                {getVisibleTestimonials().map((testimonialIndex, position) => {
                                    const testimonial = testimonials[testimonialIndex];
                                    const isCenter = position === 1;

                                    return (
                                        <motion.div
                                            key={testimonial.id}
                                            className={`relative ${isCenter ? 'w-[420px]' : 'w-[340px]'}`}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{
                                                opacity: isCenter ? 1 : 0.6,
                                                scale: isCenter ? 1 : 0.9,
                                                y: isCenter ? 0 : 20
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 200,
                                                damping: 30,
                                                mass: 1
                                            }}
                                        >
                                            {/* Card */}
                                            <div className={`relative bg-white rounded-2xl p-8 shadow-xl transition-all duration-500 border border-gray-100 ${isCenter ? 'shadow-2xl' : 'shadow-lg'
                                                }`}>
                                                {/* Gradient Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-transparent to-emerald-50/30 rounded-2xl pointer-events-none"></div>

                                                {/* Quote Icon */}
                                                <div className="relative mb-4">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] rounded-xl flex items-center justify-center shadow-lg">
                                                        <Quote className="w-7 h-7 text-white" strokeWidth={2} />
                                                    </div>
                                                </div>

                                                {/* Rating */}
                                                <div className="flex gap-1 mb-4 relative">
                                                    {[...Array(testimonial.rating)].map((_, i) => (
                                                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                                    ))}
                                                </div>

                                                {/* Testimonial Text */}
                                                <p className="text-gray-700 text-base leading-relaxed mb-6 relative min-h-[120px]">
                                                    "{testimonial.text}"
                                                </p>

                                                {/* Author */}
                                                <div className="flex items-center gap-4 relative">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] rounded-full flex items-center justify-center text-2xl shadow-md">
                                                        {testimonial.avatar}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-lg">
                                                            {testimonial.name}
                                                        </h4>
                                                        <p className="text-gray-600 text-sm">
                                                            {testimonial.role}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Decorative Corner */}
                                                {isCenter && (
                                                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#0B453C]/10 to-transparent rounded-bl-full rounded-tr-2xl"></div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Navigation Buttons */}
                            <button
                                onClick={prevTestimonial}
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#0B453C] group z-20"
                                aria-label="Previous testimonial"
                            >
                                <ChevronLeft className="w-6 h-6 text-gray-600 group-hover:text-[#0B453C] transition-colors" />
                            </button>

                            <button
                                onClick={nextTestimonial}
                                className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110 z-20"
                                aria-label="Next testimonial"
                            >
                                <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile: Single Card */}
                    <div className="md:hidden">
                        <div
                            className="relative h-[450px] flex items-center justify-center px-4"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentIndex}
                                    initial={{ opacity: 0, x: 100 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{
                                        duration: 0.5,
                                        ease: "easeInOut"
                                    }}
                                    className="w-full max-w-md"
                                >
                                    {/* Card */}
                                    <div className="relative bg-white rounded-2xl p-6 shadow-2xl border border-gray-100">
                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-transparent to-emerald-50/30 rounded-2xl pointer-events-none"></div>

                                        {/* Quote Icon */}
                                        <div className="relative mb-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] rounded-xl flex items-center justify-center shadow-lg">
                                                <Quote className="w-6 h-6 text-white" strokeWidth={2} />
                                            </div>
                                        </div>

                                        {/* Rating */}
                                        <div className="flex gap-1 mb-4 relative">
                                            {[...Array(currentTestimonial.rating)].map((_, i) => (
                                                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                            ))}
                                        </div>

                                        {/* Testimonial Text */}
                                        <p className="text-gray-700 text-base leading-relaxed mb-6 relative">
                                            "{currentTestimonial.text}"
                                        </p>

                                        {/* Author */}
                                        <div className="flex items-center gap-4 relative">
                                            <div className="w-14 h-14 bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] rounded-full flex items-center justify-center text-2xl shadow-md">
                                                {currentTestimonial.avatar}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-lg">
                                                    {currentTestimonial.name}
                                                </h4>
                                                <p className="text-gray-600 text-sm">
                                                    {currentTestimonial.role}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Decorative Corner */}
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#0B453C]/10 to-transparent rounded-bl-full rounded-tr-2xl"></div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation Buttons */}
                            <button
                                onClick={prevTestimonial}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 border border-gray-200 z-20"
                                aria-label="Previous testimonial"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>

                            <button
                                onClick={nextTestimonial}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 z-20"
                                aria-label="Next testimonial"
                            >
                                <ChevronRight className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Dots Indicator */}
                    <div className="flex justify-center gap-2 mt-8">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`transition-all duration-300 rounded-full ${index === currentIndex
                                    ? 'w-8 h-2 bg-gradient-to-r from-[#0B453C] to-[#0f5c4e]'
                                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                                    }`}
                                aria-label={`Go to testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
