import vendorConfig from '../config/vendors.json'

export function normalizeSku(rawSku, vendor = 'highland') {
  if (!rawSku) return { canonical: '', original: rawSku, handed: null, shouldCombine: false }
  const upper = rawSku.trim().toUpperCase()
  const vCfg = vendorConfig.vendors[vendor] || vendorConfig.vendors.highland
  const alias = vCfg.skuAliases[rawSku] || vCfg.skuAliases[upper]
  if (alias) {
    return { canonical: stripPrefix(alias, vCfg).toUpperCase(), original: rawSku, handed: null, shouldCombine: false, note: `Alias: ${rawSku} → ${alias}` }
  }
  const base = stripPrefix(upper, vCfg)
  for (const s of ['-LH','-RH','-L','-R']) {
    if (base.endsWith(s)) {
      const pairBase = base.slice(0, base.length - s.length)
      const pairCfg = vCfg.handedPairs[pairBase]
      const shouldCombine = pairCfg?.combine ?? false
      return { canonical: shouldCombine ? pairBase : base, original: rawSku, handed: s.includes('R') ? 'right' : 'left', shouldCombine, pairBase, note: pairCfg?.note || '' }
    }
  }
  return { canonical: base, original: rawSku, handed: null, shouldCombine: false }
}

function stripPrefix(sku, vCfg) {
  for (const p of Object.keys(vCfg.lines || {})) {
    if (sku.startsWith(p + '-')) return sku.slice(p.length + 1)
  }
  return sku
}

export function fuzzyScore(a, b) {
  const c = s => s.replace(/[-_\s]/g, '').toUpperCase()
  const ca = c(a), cb = c(b)
  if (ca === cb) return 1.0
  const dist = lev(ca, cb)
  const base = 1 - dist / Math.max(ca.length, cb.length)
  const boost = (ca.match(/\d+/g)||[]).filter(d => (cb.match(/\d+/g)||[]).includes(d)).length * 0.1
  return Math.min(1.0, base + boost)
}

function lev(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({length: m+1}, (_,i) => Array.from({length: n+1}, (_,j) => i===0?j:j===0?i:0))
  for (let i=1;i<=m;i++) for (let j=1;j<=n;j++)
    dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1])
  return dp[m][n]
}

export function isAppliance(sku) {
  return vendorConfig.applianceCodes.some(a => sku.toUpperCase().includes(a.toUpperCase()))
}
