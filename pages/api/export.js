import XLSX from 'xlsx'

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { report, trimData } = req.body
  if (!report) return res.status(400).json({ error: 'Missing report' })

  const wb = XLSX.utils.book_new()

  // Summary
  const { meta, summary } = report
  const summaryRows = [
    ['FORGEPOINT — CABINET ORDER VERIFICATION'],
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
    ...report.items.map(i=>[i.status.toUpperCase().replace('_',' '),i.designSku||'—',i.invoiceSku||'—',i.description,i.section||'—',i.designQty||0,i.invoiceQty||0,i.itemType,i.price?`$${i.price.toFixed(2)}`:'—',i.note||''])]
  const ws2 = XLSX.utils.aoa_to_sheet(allRows)
  ws2['!cols'] = [14,20,20,36,14,8,8,12,10,50].map(w=>({wch:w}))
  XLSX.utils.book_append_sheet(wb, ws2, 'All Items')

  // Discrepancies
  const issues = report.items.filter(i=>!['match','handed_merge'].includes(i.status))
  const discRows = [['ISSUE','SKU','DESCRIPTION','D QTY','I QTY','SECTION','NOTE'],
    ...(issues.length ? issues.map(i=>[i.status.toUpperCase().replace('_',' '),i.invoiceSku||i.designSku||'—',i.description,i.designQty||0,i.invoiceQty||0,i.section||'—',i.note||'']) : [['NO DISCREPANCIES','','','','','','']])]
  const ws3 = XLSX.utils.aoa_to_sheet(discRows)
  ws3['!cols'] = [18,22,36,8,8,14,50].map(w=>({wch:w}))
  XLSX.utils.book_append_sheet(wb, ws3, 'Discrepancies')

  // Trim
  const trimRows = [['TRIM ITEM','HEIGHT','SUGGESTED QTY','UNIT','INVOICED QTY','STATUS','NOTE'],
    ...(trimData?.trimSuggestions||[]).map(t=>[t.itemType,t.height||'—',t.suggestedQty,t.unit,t.invoicedQty??'—',(t.status||'').toUpperCase(),t.note||''])]
  if (trimData?.layoutNotes) { trimRows.push([]); trimRows.push(['Layout notes:', trimData.layoutNotes]) }
  const ws4 = XLSX.utils.aoa_to_sheet(trimRows)
  ws4['!cols'] = [22,10,14,8,14,12,50].map(w=>({wch:w}))
  XLSX.utils.book_append_sheet(wb, ws4, 'Trim Suggestions')

  // Sign-Off
  const signRows = [
    ['CABINET ORDER SIGN-OFF — FORGEPOINT'],
    ['Job:', meta?.jobAddress||''], ['Invoice #:', meta?.invoiceNumber||''], [],
    ['CHECKLIST','DONE','INITIALS','NOTES'],
    ['All SKUs verified against design','☐','',''],
    ['Quantities confirmed','☐','',''],
    ['Handed cabinets (L/R) confirmed','☐','',''],
    ['Trim quantities verified','☐','',''],
    ['Touch-up kits included','☐','',''],
    [],['DISCREPANCY RESOLUTION','RESOLVED','INITIALS','NOTES'],
    ...(issues.length ? issues.map(i=>[`${i.status.toUpperCase()}: ${i.invoiceSku||i.designSku} — ${i.note}`,'☐','','']) : [['No discrepancies ✅','','','']]),
    [],['Approved by:','_________________________','Date:','___________']
  ]
  const ws5 = XLSX.utils.aoa_to_sheet(signRows)
  ws5['!cols'] = [55,12,12,30].map(w=>({wch:w}))
  XLSX.utils.book_append_sheet(wb, ws5, 'Sign-Off')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const safeName = (meta?.jobAddress||'order').replace(/[^a-z0-9]/gi,'_').slice(0,30)
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition',`attachment; filename="forgepoint_${safeName}.xlsx"`)
  return res.send(buf)
}
