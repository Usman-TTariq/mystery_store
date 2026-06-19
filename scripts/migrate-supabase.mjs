/**
 * Migrate data from old Supabase project to new (service-role API copy).
 *
 * Usage:
 *   node scripts/migrate-supabase.mjs              # full migration
 *   node scripts/migrate-supabase.mjs --check      # test connections only
 *   node scripts/migrate-supabase.mjs --schema-hint
 *
 * Prerequisites:
 *   1. .env — new project keys (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 *   2. .env.migration — old project keys (OLD_SUPABASE_*)
 *   3. Schema on NEW project — run supabase/migrate-all.sql in SQL Editor first
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

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

const OLD_URL = process.env.OLD_SUPABASE_URL
const OLD_KEY = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY
const NEW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// FK order matters
const TABLES = [
  'categories',
  'stores',
  'coupons',
  'banners',
  'articles',
  'faqs',
  'system_pages',
  'contact_submissions',
  'newsletter_subscriptions',
  'click_tracking',
]

const BATCH = 200

function client(url, key, label) {
  if (!url || !key) {
    console.error(`Missing credentials for ${label}`)
    process.exit(1)
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function fetchAll(supabase, table) {
  const rows = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + BATCH - 1)
    if (error) throw new Error(`${table} read: ${error.message}`)
    if (!data?.length) break
    rows.push(...data)
    if (data.length < BATCH) break
    from += BATCH
  }
  return rows
}

async function upsertBatch(supabase, table, rows) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' })
    if (error) throw new Error(`${table} write: ${error.message}`)
  }
}

async function checkConnection(supabase, label) {
  const { error } = await supabase.from('categories').select('id', { count: 'exact', head: true })
  if (error?.code === 'PGRST205' || error?.code === '42P01' || error?.message?.includes('schema cache')) {
    return { ok: false, missingSchema: true, message: error.message }
  }
  if (error) return { ok: false, missingSchema: false, message: error.message }
  return { ok: true }
}

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--schema-hint')) {
    console.log('\nRun this file in NEW Supabase → SQL Editor:\n')
    console.log('  supabase/migrate-all.sql\n')
    return
  }

  const oldSb = client(OLD_URL, OLD_KEY, 'OLD')
  const newSb = client(NEW_URL, NEW_KEY, 'NEW')

  console.log('Old project:', OLD_URL)
  console.log('New project:', NEW_URL)
  console.log('')

  const oldCheck = await checkConnection(oldSb, 'old')
  if (!oldCheck.ok && !oldCheck.missingSchema) {
    console.error('Old project error:', oldCheck.message)
    process.exit(1)
  }
  if (oldCheck.missingSchema) {
    console.error('Old project has no categories table — unexpected.')
    process.exit(1)
  }
  console.log('✓ Old project reachable')

  const newCheck = await checkConnection(newSb, 'new')
  if (!newCheck.ok) {
    if (newCheck.missingSchema) {
      console.error('\n✗ New project has no schema yet.')
      console.error('\n  Open Supabase Dashboard → SQL Editor → New query')
      console.error('  Paste contents of: supabase/migrate-all.sql')
      console.error('  Click Run, then re-run: node scripts/migrate-supabase.mjs\n')
      process.exit(1)
    }
    console.error('New project error:', newCheck.message)
    process.exit(1)
  }
  console.log('✓ New project schema found')

  if (args.includes('--check')) {
    console.log('\nConnections OK. Ready to migrate.')
    return
  }

  console.log('\nMigrating data...\n')

  for (const table of TABLES) {
    process.stdout.write(`  ${table} ... `)
    try {
      const rows = await fetchAll(oldSb, table)
      if (!rows.length) {
        console.log('empty (skipped)')
        continue
      }
      await upsertBatch(newSb, table, rows)
      console.log(`${rows.length} rows`)
    } catch (err) {
      console.log('FAILED')
      console.error(`    ${err.message}`)
      console.error('\n  Fix the error above, then re-run (upsert is safe to repeat).\n')
      process.exit(1)
    }
  }

  console.log('\n✓ Data migration complete.')
  console.log('\nNext manual steps:')
  console.log('  1. Storage: create buckets banners, coupon-logos, category-logos (public read)')
  console.log('  2. Copy storage files from old project (Dashboard → Storage) or re-upload')
  console.log('  3. Auth: create admin user in new project → Authentication → Users')
  console.log('  4. Restart dev server and test the site\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
