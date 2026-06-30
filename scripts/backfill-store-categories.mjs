import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const CATEGORY_RULES = [
  { category: 'home and garden', patterns: [/\bshedstore\b/i, /\bbuy\s*sheds\b/i, /\bsheds?\s*direct\b/i, /\bplots?\s*discount\b/i, /\bcleva\b/i, /\blawnmaster\b/i, /\bvacmaster\b/i, /\bshed\b/i, /\bplot\b/i, /\bgarden\b/i, /\blawn\b/i, /\bmower\b/i] },
  { category: 'automotive', patterns: [/\bembossed\s*graphics\b/i, /\blicense\s*plate\b/i, /\b4knines\b/i, /\btyres?\b/i, /\btires?\b/i] },
  { category: 'food', patterns: [/\bregal\s*fish\b/i, /\bseafood\b/i, /\bfish\b/i, /\bgruns\b/i] },
  { category: 'fashion', patterns: [/\bmac\s*alyster\b/i, /\bmacalyster\b/i, /\bsunshine\s*tienda\b/i, /\bhandbag\b/i, /\bapparel\b/i, /\bfashion\b/i, /\bdress\b/i] },
  { category: 'footwear', patterns: [/\befootwear\b/i, /\bfootwear\b/i, /\bshoe\b/i] },
  { category: 'home', patterns: [/\bstarlight\s*beds\b/i, /\bbeds?\b/i, /\bmattress\b/i, /\bdecor\b/i] },
  { category: 'gifts', patterns: [/\bbloomz\b/i, /\bflorist\b/i, /\bflower\b/i, /\bbloom\b/i] },
  { category: 'electronics', patterns: [/\bdreame\b/i, /\bbinoid\b/i] },
  { category: 'health', patterns: [/\bhealth\b/i] },
  { category: 'beauty', patterns: [/\bbeauty\b/i] },
  { category: 'pets', patterns: [/\bpet\b/i] },
  { category: 'hobbies', patterns: [/\bcraft\b/i, /\bknit\b/i] },
];

function inferCategoryName(store) {
  const haystack = [store.store_name, store.slug?.replace(/-/g, ' '), store.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((p) => p.test(haystack))) return rule.category;
  }
  return null;
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

const { data: categories, error: catErr } = await supabase.from('categories').select('id, name');
if (catErr) {
  console.error(catErr);
  process.exit(1);
}

const byName = new Map((categories || []).map((c) => [c.name.toLowerCase().trim(), c.id]));

const { data: stores, error: storeErr } = await supabase
  .from('stores')
  .select('id, store_id, store_name, slug, description, category_id')
  .is('category_id', null);
if (storeErr) {
  console.error(storeErr);
  process.exit(1);
}

let updated = 0;
let skipped = 0;

for (const store of stores || []) {
  const categoryName = inferCategoryName(store);
  if (!categoryName) {
    console.log(`SKIP #${store.store_id} ${store.store_name} — no rule match`);
    skipped++;
    continue;
  }
  const categoryId = byName.get(categoryName);
  if (!categoryId) {
    console.log(`SKIP #${store.store_id} ${store.store_name} — category "${categoryName}" not in DB`);
    skipped++;
    continue;
  }
  const { error } = await supabase
    .from('stores')
    .update({ category_id: categoryId, updated_at: new Date().toISOString() })
    .eq('id', store.id);
  if (error) {
    console.error(`FAIL #${store.store_id}:`, error.message);
    continue;
  }
  console.log(`OK #${store.store_id} ${store.store_name} -> ${categoryName}`);
  updated++;
}

console.log(`\nUpdated ${updated}, skipped ${skipped}`);
