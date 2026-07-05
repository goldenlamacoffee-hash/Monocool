import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL)
const r = await sql`UPDATE "user" SET role='admin', status='approved', "updatedAt"=now() WHERE email=${process.argv[2]} RETURNING email, role, status`
console.log(JSON.stringify(r))
