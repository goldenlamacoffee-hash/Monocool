import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL)
const r = await sql`SELECT key, title, domain FROM cms_content WHERE key LIKE 'hero%' ORDER BY domain, key`
console.log(JSON.stringify(r))
