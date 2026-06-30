/**
 * Move coupon description text into store_name/title, then clear description.
 *
 * Usage: node scripts/migrate-coupon-descriptions-to-titles.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(resolve(root, '.env'));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

const { data: coupons, error } = await supabase
  .from('coupons')
  .select('id, store_name, title, description');

if (error) {
  console.error('Fetch failed:', error.message);
  process.exit(1);
}

let updated = 0;
let skipped = 0;

for (const row of coupons || []) {
  const description = String(row.description || '').trim();
  if (!description) {
    skipped += 1;
    continue;
  }

  const { error: updateError } = await supabase
    .from('coupons')
    .update({
      store_name: description,
      title: description,
      description: '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);

  if (updateError) {
    console.error(`Failed coupon ${row.id}:`, updateError.message);
    process.exit(1);
  }

  updated += 1;
  console.log(`Updated ${row.id}: "${description.slice(0, 60)}${description.length > 60 ? '…' : ''}"`);
}

console.log(`Done. Updated: ${updated}, skipped (empty description): ${skipped}`);
