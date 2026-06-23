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
