import { neon } from '@neondatabase/serverless'

const URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || null
const sql = URL ? neon(URL) : null
let schemaReady = false

export function dbEnabled() { return !!sql }

async function ensureSchema() {
  if (!sql || schemaReady) return
  await sql`
    CREATE TABLE IF NOT EXISTS verifications (
      id              SERIAL PRIMARY KEY,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      job_address     TEXT,
      vendor          TEXT NOT NULL,
      invoice_number  TEXT,
      so_number       TEXT,
      sales_rep       TEXT,
      total_lines     INTEGER NOT NULL,
      matched         INTEGER NOT NULL,
      issues          INTEGER NOT NULL,
      missing         INTEGER NOT NULL,
      match_rate      NUMERIC(5,2),
      overall_status  TEXT NOT NULL,
      report          JSONB NOT NULL,
      trim_data       JSONB
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS verifications_sales_rep_idx  ON verifications (sales_rep)`
  await sql`CREATE INDEX IF NOT EXISTS verifications_created_at_idx ON verifications (created_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS verifications_vendor_idx     ON verifications (vendor)`
  schemaReady = true
}

export async function saveVerification(r) {
  if (!sql) return null
  await ensureSchema()
  const rows = await sql`
    INSERT INTO verifications (
      job_address, vendor, invoice_number, so_number, sales_rep,
      total_lines, matched, issues, missing, match_rate, overall_status,
      report, trim_data
    ) VALUES (
      ${r.jobAddress}, ${r.vendor}, ${r.invoiceNumber}, ${r.soNumber}, ${r.salesRep},
      ${r.total}, ${r.matched}, ${r.issues}, ${r.missing}, ${r.matchRate}, ${r.overallStatus},
      ${JSON.stringify(r.report)}::jsonb, ${JSON.stringify(r.trimData)}::jsonb
    )
    RETURNING id, created_at
  `
  return rows[0]
}
