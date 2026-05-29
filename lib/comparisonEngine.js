import { normalizeSku, fuzzyScore, isAppliance } from './skuNormalizer'

export function runComparison(designItems, invoiceItems, vendor = 'highland') {
  const dMap = buildMap(designItems, vendor)
  const iMap = buildMap(invoiceItems, vendor)
  const used = new Set()
  const results = []

  for (const [dKey, dGroup] of dMap.entries()) {
    const dItem = dGroup[0]
    if (isAppliance(dItem.sku)) continue
    const dQty = dGroup.reduce((s,i) => s+i.qty, 0)
    const isPair = dGroup.length > 1 && dGroup.some(i => i.handed)

    if (iMap.has(dKey)) {
      const iGroup = iMap.get(dKey)
      const iQty = iGroup.reduce((s,i) => s+i.qty, 0)
      used.add(dKey)
      results.push({ status: dQty===iQty ? (isPair?'handed_merge':'match') : 'qty_mismatch', designSku: dItem.sku, invoiceSku: iGroup[0].sku, description: iGroup[0].description||dItem.description, designQty: dQty, invoiceQty: iQty, section: dItem.section||iGroup[0].section, itemType: dItem.itemType, price: iGroup[0].price||null, confidence: 1.0, note: isPair ? `Handed pair · qty ${iQty}` : dQty!==iQty ? `Design: ${dQty} | Invoice: ${iQty}` : '' })
      continue
    }

    let best = null
    for (const [iKey] of iMap.entries()) {
      if (used.has(iKey)) continue
      const score = fuzzyScore(dKey, iKey)
      if (!best || score > best.score) best = { key: iKey, score }
    }

    if (best && best.score > 0.72) {
      const iGroup = iMap.get(best.key)
      const iQty = iGroup.reduce((s,i) => s+i.qty, 0)
      used.add(best.key)
      results.push({ status: best.score>0.92?'match':'substitution', designSku: dItem.sku, invoiceSku: iGroup[0].sku, description: iGroup[0].description||dItem.description, designQty: dQty, invoiceQty: iQty, section: dItem.section||iGroup[0].section, itemType: dItem.itemType, price: iGroup[0].price||null, confidence: best.score, note: `${dItem.sku} → ${iGroup[0].sku} (${Math.round(best.score*100)}% match)` })
      continue
    }

    results.push({ status: 'missing', designSku: dItem.sku, invoiceSku: null, description: dItem.description||dItem.sku, designQty: dQty, invoiceQty: 0, section: dItem.section, itemType: dItem.itemType, price: null, confidence: 1.0, note: 'In design, not on invoice' })
  }

  for (const [iKey, iGroup] of iMap.entries()) {
    if (used.has(iKey)) continue
    const iItem = iGroup[0]
    if (iItem.itemType === 'service') continue
    results.push({ status: 'extra', designSku: null, invoiceSku: iItem.sku, description: iItem.description||iItem.sku, designQty: 0, invoiceQty: iGroup.reduce((s,i)=>s+i.qty,0), section: iItem.section, itemType: iItem.itemType, price: iItem.price||null, confidence: 1.0, note: 'On invoice, not in design' })
  }

  const sorted = results.sort((a,b) => ({ missing:0,qty_mismatch:1,substitution:2,extra:3,match:4,handed_merge:5 }[a.status]??9) - ({ missing:0,qty_mismatch:1,substitution:2,extra:3,match:4,handed_merge:5 }[b.status]??9))
  const matched = sorted.filter(r => ['match','handed_merge'].includes(r.status)).length
  const mismatches = sorted.filter(r => r.status==='qty_mismatch').length
  const subs = sorted.filter(r => r.status==='substitution').length
  const missing = sorted.filter(r => r.status==='missing').length
  const extra = sorted.filter(r => r.status==='extra').length
  const issues = mismatches+subs+missing+extra

  return {
    meta: { generatedAt: new Date().toISOString() },
    summary: { overallStatus: issues===0?'APPROVED':issues<=2&&missing===0?'REVIEW':'HOLD', total: sorted.length, matched, mismatches, substitutions: subs, missing, extra, issues, matchRate: sorted.length>0 ? parseFloat(((matched/sorted.length)*100).toFixed(1)) : 0 },
    items: sorted
  }
}

function buildMap(items, vendor) {
  const map = new Map()
  for (const item of items) {
    if (!item.sku) continue
    const { canonical } = normalizeSku(item.sku, vendor)
    if (!map.has(canonical)) map.set(canonical, [])
    map.get(canonical).push(item)
  }
  return map
}
