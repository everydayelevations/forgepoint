import { neon } from '@neondatabase/serverless'
import { requireAuth } from '../../lib/auth'

const URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || null
const sql = URL ? neon(URL) : null

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const auth = await requireAuth(req, ['manager'])
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })
  if (!sql) return res.status(200).json({ enabled: false, leaderboard: [], recent: [] })

  const vendor = req.query.vendor || null
  const since  = req.query.since  || null

  try {
    const leaderboard = await sql`
      SELECT
        COALESCE(sales_rep, '(Unattributed)') AS sales_rep,
        COUNT(*)::int                          AS orders,
        SUM(total_lines)::int                  AS total_lines,
        SUM(matched)::int                      AS total_matched,
        SUM(issues)::int                       AS total_issues,
        SUM(missing)::int                      AS total_missing,
        ROUND(AVG(issues)::numeric, 1)         AS avg_issues,
        CASE WHEN SUM(total_lines) > 0
          THEN ROUND((SUM(issues)::numeric / SUM(total_lines)::numeric * 100), 1)
          ELSE 0 END                           AS issue_rate
      FROM verifications
      WHERE (${vendor}::text IS NULL OR vendor = ${vendor})
        AND (${since}::timestamptz IS NULL OR created_at >= ${since}::timestamptz)
      GROUP BY COALESCE(sales_rep, '(Unattributed)')
      ORDER BY issue_rate DESC NULLS LAST, orders DESC
      LIMIT 50
    `

    const recent = await sql`
      SELECT id, created_at, job_address, sales_rep, vendor,
             total_lines, matched, issues, missing, overall_status
      FROM verifications
      WHERE (${vendor}::text IS NULL OR vendor = ${vendor})
        AND (${since}::timestamptz IS NULL OR created_at >= ${since}::timestamptz)
      ORDER BY created_at DESC
      LIMIT 50
    `

    return res.status(200).json({ enabled: true, leaderboard, recent })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}
