"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { getBannersWithLayout, Banner } from "@/lib/services/bannerService";

export default function MultiPanelHero({ initialBanners }: { initialBanners?: (Banner | null)[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [banners, setBanners] = useState<(Banner | null)[]>(initialBanners || Array(4).fill(null));
  const [loading, setLoading] = useState(!initialBanners);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const yCenter = useTransform(scrollYProgress, [0, 1], ["0%", "-5%"]);
  const scaleSides = useTransform(scrollYProgress, [0, 1], [1, 1.02]);

  useEffect(() => {
    if (initialBanners) return;

    const fetchBanners = async () => {
      try {
        const data = await getBannersWithLayout();
        setBanners(data);
      } catch (error) {
        console.error("Error fetching banners:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, [initialBanners]);

  const leftBanner = banners[0];
  const centerTopBanner = banners[1];
  const centerBottomBanner = banners[2];
  const rightBanner = banners[3];

  const defaultImages = [
    "/banners/main-hero.png",
    "/banners/side-banner-1.png",
    "/banners/side-banner-1.png",
    "/banners/main-hero.png"
  ];

  const getImage = (banner: Banner | null, index: number) => {
    return banner?.imageUrl || defaultImages[index];
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 }
    })
  };

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden bg-gray-50 py-8 lg:py-2 lg:scale-90 lg:origin-center">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* 3 Equal Columns (1-1-1) - HEIGHT INCREASED to 750px */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[750px]">

          {/* LEFT COLUMN (Tall) - Slot 1 */}
          <motion.div
            className="md:col-span-1 relative h-[400px] md:h-full group rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeInUp}
            style={{ scale: scaleSides }}
          >
            <Link href="/stores" className="block w-full h-full relative">
              <img
                src={getImage(leftBanner, 0)}
                alt="Featured Deal"
                className="w-full h-full object-fill rounded-xl transition-transform duration-700 group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).src = defaultImages[0]; }}
              />
            </Link>
          </motion.div>

          {/* CENTRE COLUMN (2 Stacked) - Slots 2 & 3 */}
          <div className="md:col-span-1 flex flex-col gap-6 h-full">

            {/* Center Top - Slot 2 */}
            <motion.div
              className="relative flex-1 h-[300px] md:h-1/2 group rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeInUp}
              style={{ y: yCenter }}
            >
              <Link href="/categories" className="block w-full h-full relative">
                <img
                  src={getImage(centerTopBanner, 1)}
                  alt="Trending"
                  className="w-full h-full object-fill rounded-xl transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).src = defaultImages[1]; }}
                />
              </Link>
            </motion.div>

            {/* Center Bottom - Slot 3 */}
            <motion.div
              className="relative flex-1 h-[300px] md:h-1/2 group rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
              initial="hidden"
              animate="visible"
              custom={2}
              variants={fadeInUp}
            >
              <Link href="/featured" className="block w-full h-full relative">
                <img
                  src={getImage(centerBottomBanner, 2)}
                  alt="Editor's Pick"
                  className="w-full h-full object-fill rounded-xl transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).src = defaultImages[2]; }}
                />
              </Link>
            </motion.div>

          </div>

          {/* RIGHT COLUMN (Tall) - Slot 4 */}
          <motion.div
            className="md:col-span-1 relative h-[400px] md:h-full group rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeInUp}
            style={{ scale: scaleSides }}
          >
            <Link href="/events" className="block w-full h-full relative">
              <img
                src={getImage(rightBanner, 3)}
                alt="Special Offer"
                className="w-full h-full object-fill rounded-xl transition-transform duration-700 group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).src = defaultImages[3]; }}
              />
            </Link>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
