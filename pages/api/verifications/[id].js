import { neon } from '@neondatabase/serverless'

const URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || null
const sql = URL ? neon(URL) : null

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!sql) return res.status(503).json({ error: 'Database not configured' })

  const id = parseInt(req.query.id, 10)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })

  try {
    const rows = await sql`
      SELECT id, created_at, job_address, sales_rep, vendor,
             invoice_number, so_number, total_lines, matched, issues, missing,
             match_rate, overall_status, report, trim_data
      FROM verifications
      WHERE id = ${id}
    `
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json(rows[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}
