import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL)
const del = await sql`DELETE FROM cms_content WHERE key='homepage_hero_de' AND domain='monocool.at' AND title='V0 TEST TITLE' RETURNING key, domain`
const check = await sql`SELECT count(*)::int AS c FROM cms_content WHERE title='V0 TEST TITLE'`
console.log(JSON.stringify({ deleted: del, remainingTestTitles: check[0].c }))
