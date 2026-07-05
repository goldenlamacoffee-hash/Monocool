import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL)
const r = await sql`SELECT name, price, domain FROM product WHERE name IN ('Silent','Silent Inverter') ORDER BY domain, name`
console.log(JSON.stringify(r, null, 0))
