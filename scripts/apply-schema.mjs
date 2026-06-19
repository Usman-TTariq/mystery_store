/**
 * Apply supabase/migrate-all.sql to NEW project via direct Postgres connection.
 *
 * Add to .env.migration:
 *   NEW_DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
 *
 * Usage: node scripts/apply-schema.mjs
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvFile(resolve(root, '.env'))
loadEnvFile(resolve(root, '.env.migration'))

const DATABASE_URL = process.env.NEW_DATABASE_URL

if (!DATABASE_URL) {
  console.error('\nMissing NEW_DATABASE_URL in .env.migration\n')
  console.error('Get it from: Supabase Dashboard → Project Settings → Database → Connection string (URI)')
  console.error('Example: postgresql://postgres.nkvgondypdtzjtkvnxvs:[YOUR-PASSWORD]@aws-0-....pooler.supabase.com:6543/postgres\n')
  console.error('OR paste supabase/migrate-all.sql manually in SQL Editor.\n')
  process.exit(1)
}

const sql = readFileSync(resolve(root, 'supabase/migrate-all.sql'), 'utf8')

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  console.log('Connected to new database. Applying schema...')
  await client.query(sql)
  console.log('✓ Schema applied successfully.')
  console.log('\nNext: node scripts/migrate-supabase.mjs\n')
} catch (err) {
  console.error('Schema apply failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
