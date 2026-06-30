'use client';

import { useMemo, useState } from 'react';
import { getStoreLogoCandidates } from '@/lib/utils/storeImages';

type StoreLogoProps = {
  name: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  trackingLink?: string | null;
  slug?: string | null;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
};

export default function StoreLogo({
  name,
  logoUrl,
  websiteUrl,
  trackingLink,
  slug,
  className = 'w-12 h-12',
  imgClassName = 'w-full h-full object-contain',
  fallbackClassName = 'w-16 h-16 rounded-full bg-gradient-to-br from-[#0B453C] to-[#0f5c4e] flex items-center justify-center',
}: StoreLogoProps) {
  const candidates = useMemo(
    () => getStoreLogoCandidates(logoUrl, websiteUrl, trackingLink, name, slug),
    [logoUrl, websiteUrl, trackingLink, name, slug]
  );
  const [index, setIndex] = useState(0);

  const src = candidates[index];
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  if (!src) {
    return (
      <div className={`${fallbackClassName}`}>
        <span className="text-2xl font-bold text-white">{initial}</span>
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center justify-center overflow-hidden`}>
      <img
        src={src}
        alt={name}
        className={imgClassName}
        loading="lazy"
        onError={() => {
          if (index < candidates.length - 1) setIndex((i) => i + 1);
        }}
      />
    </div>
  );
}
