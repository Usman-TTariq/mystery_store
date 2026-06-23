import { isCategoryImageUrl, getCategoryEmoji } from '@/lib/utils/categoryIcon';

interface CategoryIconProps {
  logoUrl?: string | null;
  name: string;
  imgClassName?: string;
  emojiClassName?: string;
  fallbackClassName?: string;
}

export default function CategoryIcon({
  logoUrl,
  name,
  imgClassName = 'w-9 h-9 object-contain relative z-10',
  emojiClassName = 'text-3xl relative z-10 leading-none',
  fallbackClassName = 'text-xl font-bold relative z-10',
}: CategoryIconProps) {
  if (isCategoryImageUrl(logoUrl)) {
    return <img src={logoUrl!} alt={name} className={imgClassName} />;
  }

  const display = logoUrl?.trim() || getCategoryEmoji(name);
  return (
    <span className={emojiClassName} aria-hidden="true">
      {display}
    </span>
  );
}
