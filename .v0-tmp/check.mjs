import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL)
const r = await sql`SELECT name, price, domain FROM product WHERE name='Silent Inverter' ORDER BY domain`
console.log(JSON.stringify(r))
