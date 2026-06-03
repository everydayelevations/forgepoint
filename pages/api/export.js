import XLSX from 'xlsx'
import { requireAuth } from '../../lib/auth'

export const config = { api: { bodyParser: { sizeLimit: '5mb' } }, maxDuration: 30 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const auth = await requireAuth(req, ['manager', 'sales'])
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })
  const { report, trimData, designReview } = req.body
  if (!report) return res.status(400).json({ error: 'Missing report' })

  const wb = XLSX.utils.book_new()

  // Summary
  const { meta, summary } = report
  const summaryRows = [
    ['CLAVEX · CABINET ORDER VERIFICATION'],
    ['Highland Cabinetry 08, Inc'],
    [],
    ['Job Address:', meta?.jobAddress||''],
    ['Invoice #:', meta?.invoiceNumber||''],
    ['S.O. #:', meta?.soNumber||''],
    ['Generated:', new Date(meta?.generatedAt).toLocaleString()],
    [],
    ['OVERALL STATUS:', summary.overallStatus],
    [],
    ['METRIC','COUNT','DETAIL'],
    ['Total Checked', summary.total, ''],
    ['Matched', summary.matched, `${summary.matchRate}% match rate`],
    ['Qty Mismatches', summary.mismatches, 'Same SKU, wrong qty'],
    ['Substitutions', summary.substitutions, 'Different SKU, likely same item'],
    ['Missing from Invoice', summary.missing, 'In design, not on invoice'],
    ['Extra on Invoice', summary.extra, 'On invoice, not in design'],
    ['Total Issues', summary.issues, ''],
    [],
    ['ACTION ITEMS:'],
    ...report.items.filter(i=>!['match','handed_merge'].includes(i.status)).map(i=>[`${i.status.toUpperCase()}: ${i.invoiceSku||i.designSku}`, '', i.note||''])
  ]
  const ws1 = XLSX.utils.aoa_to_sheet(summaryRows)
  ws1['!cols'] = [{wch:28},{wch:14},{wch:45}]
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary')

  // All Items
  const allRows = [['STATUS','DESIGN SKU','INVOICE SKU','DESCRIPTION','SECTION','D QTY','I QTY','TYPE','PRICE','NOTE'],
    ...report.items.map(i=>[i.status.toUpperCase().replace('_',' '),i.designSku||'–',i.invoiceSku||'–',i.description,i.section||'–',i.designQty||0,i.invoiceQty||0,i.itemType,i.price?`$${i.price.toFixed(2)}`:'–',i.note||''])]
  const ws2 = XLSX.utils.aoa_to_sheet(allRows)
  ws2['!cols'] = [14,20,20,36,14,8,8,12,10,50].map(w=>({wch:w}))
  XLSX.utils.book_append_sheet(wb, ws2, 'All Items')

  // Discrepancies
  const issues = report.items.filter(i=>!['match','handed_merge'].includes(i.status))
  const discRows = [['ISSUE','SKU','DESCRIPTION','D QTY','I QTY','SECTION','NOTE'],
    ...(issues.length ? issues.map(i=>[i.status.toUpperCase().replace('_',' '),i.invoiceSku||i.designSku||'–',i.description,i.designQty||0,i.invoiceQty||0,i.section||'–',i.note||'']) : [['NO DISCREPANCIES','','','','','','']])]
  const ws3 = XLSX.utils.aoa_to_sheet(discRows)
  ws3['!cols'] = [18,22,36,8,8,14,50].map(w=>({wch:w}))
  XLSX.utils.book_append_sheet(wb, ws3, 'Discrepancies')

  // Trim — moldings ship in 8-ft sticks; fillers in stock lengths set by the
  // cabinet height (wall/base 30/36/42", tall 96"). Order qty adds 20% waste.
  const unitLabel = (u) => ({ LF: 'lineal ft', EA: 'ea', IN: 'in' }[String(u||'').toUpperCase()] || u || '')
  const heightIn = (t) => parseFloat(String(t.height||'').replace(/[^0-9.]/g,'')) || 0
  const fillerStockIn = (t) => { const h=heightIn(t); if (/tall|pantry|oven/i.test(t.itemType||'') || h>42) return 96; return [30,36,42].find(L=>L>=h) || 42 }
  const stickCell = (t) => {
    if (String(t.unit||'').toUpperCase() !== 'LF') return '–'
    if (/filler/i.test(t.itemType||'')) { const len=fillerStockIn(t); return `${Math.ceil((t.suggestedQty/(len/12))*1.2)} × ${len}"` }
    return `${Math.ceil((t.suggestedQty/8)*1.2)} × 8'`
  }
  const trimRows = [['TRIM ITEM','HEIGHT','SUGGESTED QTY','UNIT','STICKS','INVOICED QTY','STATUS','NOTE'],
    ...(trimData?.trimSuggestions||[]).map(t=>[t.itemType,t.height||'–',t.suggestedQty,unitLabel(t.unit),stickCell(t),t.invoicedQty??'–',(t.status||'').toUpperCase(),t.note||''])]
  if (trimData?.layoutNotes) { trimRows.push([]); trimRows.push(['Layout notes:', trimData.layoutNotes]) }
  const ws4 = XLSX.utils.aoa_to_sheet(trimRows)
  ws4['!cols'] = [22,10,14,11,13,14,12,50].map(w=>({wch:w}))
  XLSX.utils.book_append_sheet(wb, ws4, 'Trim Suggestions')

  // Design Review (AI design bot) — only when present
  if (designReview && ((designReview.issues||[]).length || (designReview.estimateNotes||[]).length)) {
    const NOTE_LABEL = { crown:'Crown', hinge:'Hinge side', exposed_back:'Exposed back', color:'Color codes' }
    const issues = designReview.issues || []
    const notes  = designReview.estimateNotes || []
    const drRows = [
      ['DESIGN REVIEW · AI BOT'],
      ['Job:', meta?.jobAddress||''], [],
      ['DESIGN ISSUES'],
      ['SEVERITY','CATEGORY','TITLE','DETAIL'],
      ...(issues.length ? issues.map(it=>[String(it.severity||'').toUpperCase(),it.category||'',it.title||'',it.detail||'']) : [['–','–','No design issues flagged','']]),
      [],
      ['ESTIMATE NOTES'],
      ['CATEGORY','NOTE'],
      ...(notes.length ? notes.map(n=>[NOTE_LABEL[n.category]||n.category||'',n.detail||n.title||'']) : [['–','None']]),
    ]
    const ws6 = XLSX.utils.aoa_to_sheet(drRows)
    ws6['!cols'] = [12,14,34,64].map(w=>({wch:w}))
    XLSX.utils.book_append_sheet(wb, ws6, 'Design Review')
  }

  // Sign-Off
  const signRows = [
    ['CABINET ORDER SIGN-OFF · CLAVEX'],
    ['Job:', meta?.jobAddress||''], ['Invoice #:', meta?.invoiceNumber||''], [],
    ['CHECKLIST','DONE','INITIALS','NOTES'],
    ['All SKUs verified against design','☐','',''],
    ['Quantities confirmed','☐','',''],
    ['Handed cabinets (L/R) confirmed','☐','',''],
    ['Trim quantities verified','☐','',''],
    ['Touch-up kits included','☐','',''],
    [],['DISCREPANCY RESOLUTION','RESOLVED','INITIALS','NOTES'],
    ...(issues.length ? issues.map(i=>[`${i.status.toUpperCase()}: ${i.invoiceSku||i.designSku} · ${i.note}`,'☐','','']) : [['No discrepancies ✅','','','']]),
    [],['Approved by:','_________________________','Date:','___________']
  ]
  const ws5 = XLSX.utils.aoa_to_sheet(signRows)
  ws5['!cols'] = [55,12,12,30].map(w=>({wch:w}))
  XLSX.utils.book_append_sheet(wb, ws5, 'Sign-Off')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const safeName = (meta?.jobAddress||'order').replace(/[^a-z0-9]/gi,'_').slice(0,30)
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition',`attachment; filename="clavex_${safeName}.xlsx"`)
  return res.send(buf)
}
