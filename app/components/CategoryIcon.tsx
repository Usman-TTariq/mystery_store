import { getCategoryIconSrc } from '@/lib/utils/categoryIcon';

interface CategoryIconProps {
  logoUrl?: string | null;
  name: string;
  imgClassName?: string;
}

export default function CategoryIcon({
  logoUrl,
  name,
  imgClassName = 'w-9 h-9 object-contain relative z-10 brightness-0',
}: CategoryIconProps) {
  const src = getCategoryIconSrc(logoUrl, name);

  return (
    <img
      src={src}
      alt={name}
      className={imgClassName}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null;
        target.src = getCategoryIconSrc(null, name);
      }}
    />
  );
}
