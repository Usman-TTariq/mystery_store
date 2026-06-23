import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const CATEGORY_EMOJI = {
  education: '📚', gifts: '🎁', gift: '🎁', technology: '💻', gaming: '🎮',
  baby: '👶', hobbies: '🎨', health: '💚', toys: '🧸', automotive: '🚗',
  books: '📖', sports: '⚽', home: '🏠', fashion: '👗', electronics: '📱',
  travel: '✈️', pets: '🐾', food: '🍔', office: '📝', beauty: '💄',
  fitness: '💪', furniture: '🛋️', footwear: '👟', kids: '🧸', hotel: '🏨',
};

function getCategoryEmoji(name) {
  const key = name.toLowerCase().trim();
  if (CATEGORY_EMOJI[key]) return CATEGORY_EMOJI[key];
  for (const [k, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (key.includes(k) || k.includes(key)) return emoji;
  }
  return '📦';
}

function isCategoryImageUrl(url) {
  if (!url?.trim()) return false;
  const v = url.trim();
  return v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:') || v.startsWith('/');
}

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: categories, error } = await supabase.from('categories').select('id, name, icon_url');
if (error) { console.error(error); process.exit(1); }

let updated = 0;
for (const cat of categories || []) {
  if (isCategoryImageUrl(cat.icon_url)) continue;
  const emoji = getCategoryEmoji(cat.name);
  const { error: upErr } = await supabase
    .from('categories')
    .update({ icon_url: emoji, updated_at: new Date().toISOString() })
    .eq('id', cat.id);
  if (!upErr) { updated++; console.log(`${cat.name} -> ${emoji}`); }
}
console.log(`\nUpdated ${updated} categories`);
