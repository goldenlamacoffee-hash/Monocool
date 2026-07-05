import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL)
const email = process.argv[2]
const r = await sql`UPDATE "user" SET role='admin', status='approved', "updatedAt"=now() WHERE email=${email} RETURNING id, email, role, status`
console.log(JSON.stringify(r))
