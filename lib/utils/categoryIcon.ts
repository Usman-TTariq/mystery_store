const CATEGORY_BLACK_ICONS: Record<string, string> = {
  education: 'mdi:school-outline',
  gifts: 'mdi:gift-outline',
  gift: 'mdi:gift-outline',
  technology: 'mdi:laptop',
  gaming: 'mdi:gamepad-variant-outline',
  baby: 'mdi:baby-carriage',
  hobbies: 'mdi:palette-outline',
  health: 'mdi:leaf',
  toys: 'mdi:toy-brick-outline',
  automotive: 'mdi:car-outline',
  books: 'mdi:book-open-page-variant-outline',
  sports: 'mdi:soccer',
  'sports and outdoor': 'mdi:hiking',
  home: 'mdi:home-outline',
  'home and garden': 'mdi:sprout-outline',
  fashion: 'mdi:tshirt-crew-outline',
  electronics: 'mdi:cellphone',
  travel: 'mdi:airplane',
  pets: 'mdi:paw-outline',
  food: 'mdi:food-outline',
  office: 'mdi:briefcase-outline',
  beauty: 'mdi:face-woman-shimmer-outline',
  fitness: 'mdi:dumbbell',
  furniture: 'mdi:sofa-outline',
  footwear: 'mdi:shoe-formal',
  kids: 'mdi:human-child',
  hotel: 'mdi:bed-outline',
  'e-commerce': 'mdi:cart-outline',
};

/** Light mint circle behind category icons (matches site design) */
export const categoryIconBgClass = 'bg-green-50';
export const categoryIconBgHex = '#f0fdf4';

const CATEGORY_EMOJI: Record<string, string> = {
  education: '📚',
  gifts: '🎁',
  gift: '🎁',
  technology: '💻',
  gaming: '🎮',
  baby: '👶',
  hobbies: '🎨',
  health: '💚',
  toys: '🧸',
  automotive: '🚗',
  books: '📖',
  sports: '⚽',
  home: '🏠',
  'home and garden': '🏡',
  fashion: '👗',
  electronics: '📱',
  travel: '✈️',
  pets: '🐾',
  food: '🍔',
  office: '📝',
  beauty: '💄',
  fitness: '💪',
  furniture: '🛋️',
  footwear: '👟',
  kids: '🧸',
  hotel: '🏨',
  'e-commerce': '🛒',
};

export function getCategoryEmoji(name: string): string {
  const key = name.toLowerCase().trim();
  if (CATEGORY_EMOJI[key]) return CATEGORY_EMOJI[key];
  for (const [k, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (key.includes(k) || k.includes(key)) return emoji;
  }
  return '📦';
}

export function getCategoryBlackIconUrl(name: string): string {
  const key = name.toLowerCase().trim();
  let iconId = 'mdi:tag-outline';

  if (CATEGORY_BLACK_ICONS[key]) {
    iconId = CATEGORY_BLACK_ICONS[key];
  } else {
    for (const [k, icon] of Object.entries(CATEGORY_BLACK_ICONS)) {
      if (key.includes(k) || k.includes(key)) {
        iconId = icon;
        break;
      }
    }
  }

  return `https://api.iconify.design/${iconId}.svg?color=%23000000`;
}

export function getCategoryIconSrc(logoUrl?: string | null, name?: string): string {
  if (isCategoryImageUrl(logoUrl)) return logoUrl!.trim();
  return getCategoryBlackIconUrl(name || 'category');
}

export function isCategoryImageUrl(url?: string | null): boolean {
  if (!url?.trim()) return false;
  const v = url.trim();
  return (
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('data:') ||
    v.startsWith('/')
  );
}

export function getCategoryIconDisplay(logoUrl?: string | null, name?: string): string {
  if (isCategoryImageUrl(logoUrl)) return logoUrl!.trim();
  if (logoUrl?.trim()) return logoUrl.trim();
  return getCategoryEmoji(name || '');
}
