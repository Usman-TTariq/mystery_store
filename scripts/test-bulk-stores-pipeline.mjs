import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const base = process.env.TEST_BASE_URL || 'http://localhost:3000';

function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    rows.push(
      line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) =>
        c.replace(/^"|"$/g, '').replace(/""/g, '"').trim()
      )
    );
  }
  return rows;
}

async function main() {
  const csv = readFileSync('data/stores-bulk-test-55.csv', 'utf8');
  const [headerRow, ...dataRows] = parseCsv(csv);
  const header = headerRow.map((h) => h.toLowerCase());
  const idx = (n) => header.indexOf(n);

  console.log('=== Bulk stores pipeline test ===\n');

  const catRes = await fetch(`${base}/api/categories`);
  const catJson = await catRes.json();
  const map = new Map();
  for (const c of catJson.categories || []) {
    map.set(c.name.toLowerCase().trim(), c.id);
  }

  const unique = new Set();
  for (const row of dataRows) {
    const cat = row[idx('category')];
    if (cat && !map.has(cat.toLowerCase().trim())) unique.add(cat.trim());
  }

  console.log(`Missing categories: ${unique.size}`);
  let catFails = 0;
  for (const name of unique) {
    const r = await fetch(`${base}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon_url: '📦', background_color: '#E5E7EB' }),
    });
    const j = await r.json();
    if (j.success && j.id) {
      map.set(name.toLowerCase().trim(), j.id);
    } else {
      catFails++;
      console.log(`  FAIL: ${name} ->`, j.error || j);
    }
  }
  console.log(`Categories OK: ${unique.size - catFails}/${unique.size}\n`);

  const testRows = dataRows.slice(0, 5).map((row) => ({
    name: row[idx('store name')],
    description: row[idx('description')] || '',
    slug: row[idx('slug')],
    website_url: row[idx('store url')] || null,
    tracking_link: row[idx('tracking link')] || null,
    merchant_id: row[idx('merchant id')] || null,
    network_id: row[idx('network id')] || null,
    country: row[idx('country')] || 'US',
    status: 'active',
    featured: row[idx('trending')]?.toLowerCase() === 'true',
    seo_title: row[idx('seo title')] || null,
    seo_description: row[idx('seo description')] || null,
    sub_store_name: row[idx('sub store name')] || null,
    category_id: map.get((row[idx('category')] || '').toLowerCase().trim()) || null,
  }));

  const up = await fetch(`${base}/api/stores/bulk-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows: testRows }),
  });
  const upJson = await up.json();
  console.log('Bulk upload (5 stores):', up.status, JSON.stringify(upJson));

  const env = Object.fromEntries(
    readFileSync('.env', 'utf8')
      .split('\n')
      .filter((l) => l.includes('=') && !l.startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { count } = await sb
    .from('stores')
    .select('*', { count: 'exact', head: true })
    .like('slug', 'bulk-%');

  console.log(`\nStores with bulk-* slug in DB: ${count}`);
  console.log('\n=== Done — admin se full CSV upload kar sakte ho ===');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
