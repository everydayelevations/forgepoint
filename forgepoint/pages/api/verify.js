import Anthropic from '@anthropic-ai/sdk'
import { runComparison } from '../../lib/comparisonEngine'
import { DEMO_DESIGN, DEMO_INVOICE, DEMO_DESIGN_TEXT } from '../../lib/demoData'

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } }

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EXTRACT_SYSTEM = `You are a cabinet order extraction specialist for Highland Cabinetry.
Extract every cabinet, trim, and accessory line item from the document into structured JSON.
RULES:
- Extract EVERY SKU — do not skip any line item
- Preserve handed suffixes (-L, -R, HL, HR) exactly as written
- Identify sections from headers like "---- island ----" or "--- sink side wall ----"
- itemType: "cabinet" | "trim" | "appliance" | "accessory" | "service"
- Appliances: KRSC503ESS, KDFE104DSS, KSGG700ESS, 440149, 443028
- price: null for design files, numeric for invoices
Return ONLY valid JSON, no markdown:
{ "documentType": "design"|"invoice", "jobAddress": "string|null", "invoiceNumber": "string|null", "soNumber": "string|null", "items": [{ "sku": "WHS-B18", "description": "18\\" Base Cabinet HL", "qty": 1, "section": "sink wall", "itemType": "cabinet", "handed": "left", "price": 217.00, "source": "invoice" }] }`

async function extractFromBase64(b64, docType) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514', max_tokens: 4000, system: EXTRACT_SYSTEM,
    messages: [{ role: 'user', content: [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } },
      { type: 'text', text: `Document type hint: ${docType}. Extract all cabinet line items.` }
    ]}]
  })
  const raw = response.content[0].text.replace(/```json|```/g, '').trim()
  return JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}')+1))
}

async function calcTrim(designText, designItems, invoiceItems) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514', max_tokens: 1500,
    system: `Cabinet trim specialist. Return ONLY valid JSON: { "trimSuggestions": [{ "itemType": "Toe Kick", "unit": "LF", "suggestedQty": 18, "height": "3.5in", "invoicedQty": 1, "status": "ok", "note": "" }], "layoutNotes": "string" }`,
    messages: [{ role: 'user', content: `Design:\n${designText}\n\nCabinets: ${designItems.filter(i=>i.itemType==='cabinet').map(i=>`${i.sku} x${i.qty} [${i.section}]`).join(', ')}\n\nInvoiced trim: ${invoiceItems.filter(i=>i.itemType==='trim').map(i=>`${i.sku} x${i.qty}`).join(', ')||'none'}\n\nCalculate: toe kick LF, crown molding LF+height, light rail, scribe, filler panels, end panels.` }]
  })
  const raw = response.content[0].text.replace(/```json|```/g, '').trim()
  try { return JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}')+1)) }
  catch { return { trimSuggestions: [], layoutNotes: 'Could not calculate trim — review manually.' } }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { demo, designB64, invoiceB64, vendor = 'highland' } = req.body
    let designExtracted, invoiceExtracted, rawDesignText

    if (demo) {
      designExtracted  = { ...DEMO_DESIGN,  documentType: 'design'  }
      invoiceExtracted = { ...DEMO_INVOICE, documentType: 'invoice' }
      rawDesignText = DEMO_DESIGN_TEXT
    } else if (designB64 && invoiceB64) {
      ;[designExtracted, invoiceExtracted] = await Promise.all([
        extractFromBase64(designB64, 'design'),
        extractFromBase64(invoiceB64, 'invoice')
      ])
      rawDesignText = ''
    } else {
      return res.status(400).json({ error: 'Provide designB64 + invoiceB64, or demo: true' })
    }

    const report = runComparison(designExtracted.items||[], invoiceExtracted.items||[], vendor)
    report.meta.jobAddress    = invoiceExtracted.jobAddress || designExtracted.jobAddress || ''
    report.meta.invoiceNumber = invoiceExtracted.invoiceNumber || null
    report.meta.soNumber      = invoiceExtracted.soNumber || null

    const trimData = await calcTrim(rawDesignText, designExtracted.items||[], invoiceExtracted.items||[])
    return res.status(200).json({ report, trimData })
  } catch(err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}
