import Anthropic from '@anthropic-ai/sdk'
import { runComparison } from '../../lib/comparisonEngine'
import { DEMO_DESIGN, DEMO_INVOICE, DEMO_DESIGN_TEXT } from '../../lib/demoData'
import { saveVerification } from '../../lib/db'
import { requireAuth } from '../../lib/auth'
import { resolveRep } from '../../lib/roster'

export const config = { api: { bodyParser: { sizeLimit: '1mb' } }, maxDuration: 60 }

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EXTRACT_SYSTEM = `You are a cabinet order extraction specialist for Highland Cabinetry.
Extract every cabinet, trim, and accessory line item from the document into structured JSON.
RULES:
- Extract EVERY SKU. Do not skip any line item.
- Preserve handed suffixes (-L, -R, HL, HR) exactly as written
- Identify sections from headers like "---- island ----" or "--- sink side wall ----"
- itemType: "cabinet" | "trim" | "appliance" | "accessory" | "service"
- Appliances: KRSC503ESS, KDFE104DSS, KSGG700ESS, 440149, 443028
- price: null for design files, numeric for invoices
- salesRep: pull the salesperson / sales rep / account manager / designer identifier from the document header. Look for labels like "Salesperson:", "Sales Rep:", "Rep:", "Account Manager:", "Designer:", "Prepared by:". The value is often initials (e.g. "DF", "ST", "RAT") or a short name. Return exactly what the document shows, preserving capitalization. Return null if not present.
Return ONLY valid JSON, no markdown:
{ "documentType": "design"|"invoice", "jobAddress": "string|null", "invoiceNumber": "string|null", "soNumber": "string|null", "salesRep": "string|null", "items": [{ "sku": "WHS-B18", "description": "18\\" Base Cabinet HL", "qty": 1, "section": "sink wall", "itemType": "cabinet", "handed": "left", "price": 217.00, "source": "invoice" }] }`

async function extractFromUrl(url, docType) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514', max_tokens: 4000, system: EXTRACT_SYSTEM,
    messages: [{ role: 'user', content: [
      { type: 'document', source: { type: 'url', url } },
      { type: 'text', text: `Document type hint: ${docType}. Extract all cabinet line items.` }
    ]}]
  })
  const raw = response.content[0].text.replace(/```json|```/g, '').trim()
  return JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}')+1))
}

async function calcTrim(designText, designItems, invoiceItems) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514', max_tokens: 1500,
    system: `Cabinet trim specialist. Express every linear trim run in LINEAL FEET (unit "LF"), rounded up to the nearest whole foot. Only discrete piece-count items (filler panels, end panels) may use unit "EA". Return ONLY valid JSON: { "trimSuggestions": [{ "itemType": "Toe Kick", "unit": "LF", "suggestedQty": 18, "height": "3.5in", "invoicedQty": 1, "status": "ok", "note": "" }], "layoutNotes": "string" }`,
    messages: [{ role: 'user', content: `Design:\n${designText}\n\nCabinets: ${designItems.filter(i=>i.itemType==='cabinet').map(i=>`${i.sku} x${i.qty} [${i.section}]`).join(', ')}\n\nInvoiced trim: ${invoiceItems.filter(i=>i.itemType==='trim').map(i=>`${i.sku} x${i.qty}`).join(', ')||'none'}\n\nCalculate as LINEAL FEET (round up to whole feet): toe kick, crown molding (+height), light rail, scribe, outside corner molding. Filler panels and end panels: report as EA.` }]
  })
  const raw = response.content[0].text.replace(/```json|```/g, '').trim()
  try { return JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}')+1)) }
  catch { return { trimSuggestions: [], layoutNotes: 'Could not calculate trim. Review manually.' } }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const auth = await requireAuth(req, ['manager', 'sales'])
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })
  try {
    const { demo, designUrls, invoiceUrls, vendor = 'highland' } = req.body
    let designExtracted, invoiceExtracted, rawDesignText

    const designList  = Array.isArray(designUrls)  ? designUrls  : []
    const invoiceList = Array.isArray(invoiceUrls) ? invoiceUrls : []

    if (demo) {
      designExtracted  = { ...DEMO_DESIGN,  documentType: 'design'  }
      invoiceExtracted = { ...DEMO_INVOICE, documentType: 'invoice' }
      rawDesignText = DEMO_DESIGN_TEXT
    } else if (designList.length && invoiceList.length) {
      const [designParts, invoiceParts] = await Promise.all([
        Promise.all(designList.map(u  => extractFromUrl(u, 'design'))),
        Promise.all(invoiceList.map(u => extractFromUrl(u, 'invoice'))),
      ])
      const firstNonEmpty = (arr) => arr.find(v => v) || null
      const joinUnique = (arr) => {
        const vals = [...new Set(arr.filter(Boolean))]
        return vals.length ? vals.join(', ') : null
      }
      designExtracted = {
        documentType: 'design',
        items: designParts.flatMap(p => p.items || []),
        jobAddress: firstNonEmpty(designParts.map(p => p.jobAddress)),
        salesRep:   firstNonEmpty(designParts.map(p => p.salesRep)),
      }
      invoiceExtracted = {
        documentType: 'invoice',
        items: invoiceParts.flatMap(p => p.items || []),
        jobAddress:    firstNonEmpty(invoiceParts.map(p => p.jobAddress)),
        invoiceNumber: joinUnique(invoiceParts.map(p => p.invoiceNumber)),
        soNumber:      joinUnique(invoiceParts.map(p => p.soNumber)),
        salesRep:      firstNonEmpty(invoiceParts.map(p => p.salesRep)),
      }
      rawDesignText = ''
    } else {
      return res.status(400).json({ error: 'Provide designUrls + invoiceUrls, or demo: true' })
    }

    const report = runComparison(designExtracted.items||[], invoiceExtracted.items||[], vendor)
    report.meta.jobAddress    = invoiceExtracted.jobAddress || designExtracted.jobAddress || ''
    report.meta.invoiceNumber = invoiceExtracted.invoiceNumber || null
    report.meta.soNumber      = invoiceExtracted.soNumber || null

    const rawRep = invoiceExtracted.salesRep || designExtracted.salesRep || null
    const matchedRep = resolveRep(rawRep)
    report.meta.salesRep      = matchedRep?.name  || rawRep || null
    report.meta.salesRepEmail = matchedRep?.email || null
    report.meta.salesRepRaw   = rawRep
    report.meta.salesRepResolved = !!matchedRep

    const trimData = await calcTrim(rawDesignText, designExtracted.items||[], invoiceExtracted.items||[])

    let savedId = null
    if (!demo) {
      try {
        const saved = await saveVerification({
          jobAddress:     report.meta.jobAddress || null,
          vendor,
          invoiceNumber:  report.meta.invoiceNumber,
          soNumber:       report.meta.soNumber,
          salesRep:       report.meta.salesRep,
          salesRepEmail:  report.meta.salesRepEmail,
          salesRepRaw:    report.meta.salesRepRaw,
          total:          report.summary.total,
          matched:        report.summary.matched,
          issues:         report.summary.issues,
          missing:        report.summary.missing,
          matchRate:      report.summary.matchRate,
          overallStatus:  report.summary.overallStatus,
          report,
          trimData,
        })
        savedId = saved?.id || null
      } catch (e) {
        console.error('DB save failed (non-fatal):', e.message)
      }
    }
    report.meta.id = savedId

    return res.status(200).json({ report, trimData })
  } catch(err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}
