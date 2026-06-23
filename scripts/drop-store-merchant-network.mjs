import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0 && !process.env[t.slice(0, i).trim()]) {
      process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, '');
    }
  }
}

loadEnvFile(resolve(root, '.env'));
loadEnvFile(resolve(root, '.env.migration'));

const DATABASE_URL = process.env.NEW_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing NEW_DATABASE_URL or DATABASE_URL');
  process.exit(1);
}

const sql = readFileSync(resolve(root, 'supabase/drop-store-merchant-network.sql'), 'utf8');
const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

await client.connect();
await client.query(sql);
await client.end();
console.log('Dropped merchant_id and network_id from stores table.');
