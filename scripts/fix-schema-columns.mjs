/** Fix camelCase column names to match production data */
import pg from 'pg'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i > 0) process.env[t.slice(0, i)] = t.slice(i + 1)
  }
}

loadEnvFile(resolve(root, '.env.migration'))

const client = new pg.Client({
  connectionString: process.env.NEW_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const fixes = [
  `ALTER TABLE stores RENAME COLUMN substorename TO "subStoreName"`,
]

await client.connect()
for (const sql of fixes) {
  try {
    await client.query(sql)
    console.log('✓', sql)
  } catch (e) {
    if (e.message.includes('does not exist')) console.log('skip (already fixed):', sql)
    else throw e
  }
}
await client.end()
console.log('Done.')
