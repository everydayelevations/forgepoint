import { useState, useRef, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { upload } from '@vercel/blob/client'
import { useUser, UserButton } from '@clerk/nextjs'

const CL = {
  paper:'#FBF5EA', cream:'#F2E7D2', sand:'#E7D5B3', tan:'#D6B583',
  honey:'#C0904E', oak:'#9A6B38', walnut:'#5E3C22', espresso:'#33241A', ink:'#241A12',
  ember:'#BF5527', emberSoft:'#E4A06A',
  iron:'#6E6155', ironLt:'#9A8E80',
  match:'#5E7A4B', flag:'#BF5527', miss:'#A6391F',
  display:'"Zilla Slab", Georgia, serif',
  ui:'"Hanken Grotesk", system-ui, sans-serif',
  mono:'"Spline Sans Mono", ui-monospace, monospace',
}

const ICN = {
  check:    <polyline points="20 6 9 17 4 12" />,
  alert:    <g><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></g>,
  minus:    <g><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></g>,
  search:   <g><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></g>,
  refresh:  <g><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></g>,
  download: <g><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></g>,
  chev:     <polyline points="6 9 12 15 18 9" />,
  box:      <g><path d="M3 7 12 3l9 4-9 4-9-4Z" /><path d="M3 7v10l9 4 9-4V7" /><path d="M12 11v10" /></g>,
  truck:    <g><path d="M14 17V5H2v12" /><path d="M14 9h5l3 3v5h-8" /><circle cx="6.5" cy="17.5" r="1.6" /><circle cx="17.5" cy="17.5" r="1.6" /></g>,
  layers:   <g><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></g>,
  users:    <g><path d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 19v-2a4 4 0 0 0-3-3.9" /></g>,
  chart:    <g><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" /><rect x="13" y="7" width="3" height="10" /></g>,
  upload:   <g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></g>,
}

const SPEC_STATUS = {
  match:'match', handed_merge:'match',
  qty_mismatch:'flag', substitution:'flag', extra:'flag',
  missing:'miss',
}

function Icon({ d, size = 18, color = 'currentColor', stroke = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display:'block', flex:'0 0 auto' }}>
      {d}
    </svg>
  )
}

function StatusChip({ s }) {
  const map = {
    match: { c: CL.match, bg:'rgba(94,122,75,0.13)',  icon: ICN.check, label:'Matched' },
    flag:  { c: CL.flag,  bg:'rgba(191,85,39,0.13)',  icon: ICN.alert, label:'Needs review' },
    miss:  { c: CL.miss,  bg:'rgba(166,57,31,0.12)',  icon: ICN.minus, label:'Missing' },
  }
  const m = map[s] || map.flag
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, color:m.c, background:m.bg,
      fontFamily:CL.ui, fontWeight:600, fontSize:12, padding:'4px 9px', borderRadius:999, whiteSpace:'nowrap' }}>
      <Icon d={m.icon} size={12.5} color={m.c} stroke={2.4} />{m.label}
    </span>
  )
}

function Btn({ children, primary, icon, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:'inline-flex', alignItems:'center', gap:8, height:40, padding:'0 16px',
      borderRadius:9, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily:CL.ui, fontWeight:700, fontSize:13.5,
      border: primary ? 'none' : `1px solid ${CL.sand}`,
      background: primary ? CL.ember : CL.paper,
      color: primary ? CL.paper : CL.walnut,
      whiteSpace:'nowrap', opacity: disabled ? 0.45 : 1,
      boxShadow: primary && !disabled ? '0 2px 8px rgba(191,85,39,0.28)' : 'none',
      transition:'all .15s',
    }}>
      {icon && <Icon d={icon} size={16} color={primary ? CL.paper : CL.oak} stroke={2} />}{children}
    </button>
  )
}

function NavItem({ icon, label, active, soon, href }) {
  const body = (
    <>
      <Icon d={icon} size={17} color={active ? CL.emberSoft : 'rgba(242,231,210,0.5)'} stroke={1.9} />
      <span style={{ whiteSpace:'nowrap' }}>{label}</span>
      {soon && <span style={{ marginLeft:'auto', fontFamily:CL.mono, fontSize:9, color:'rgba(242,231,210,0.45)',
        border:'1px solid rgba(242,231,210,0.18)', borderRadius:4, padding:'1px 5px', letterSpacing:'0.04em' }}>SOON</span>}
    </>
  )
  const style = {
    display:'flex', alignItems:'center', gap:11, padding:'9px 11px', borderRadius:9,
    cursor: href && !active ? 'pointer' : 'default',
    background: active ? 'rgba(191,85,39,0.16)' : 'transparent',
    color: active ? CL.paper : 'rgba(242,231,210,0.62)',
    fontFamily:CL.ui, fontWeight: active ? 700 : 500, fontSize:13.5,
    borderLeft: active ? `2px solid ${CL.ember}` : '2px solid transparent',
    paddingLeft: active ? 11 : 13, opacity: soon ? 0.6 : 1, textDecoration:'none',
  }
  if (href && !active) return <Link href={href} style={style}>{body}</Link>
  return <div style={style}>{body}</div>
}

function StatCard({ label, value, sub, color, icon, accent }) {
  return (
    <div style={{
      flex:1, padding:'15px 17px', borderRadius:14,
      border:`1px solid ${accent ? color : CL.sand}`,
      background: accent ? 'rgba(191,85,39,0.05)' : CL.paper,
      boxShadow:'0 1px 0 rgba(255,255,255,0.6) inset, 0 6px 18px rgba(74,48,25,0.05)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {icon && <Icon d={icon} size={15} color={color} stroke={2.3} />}
        <span style={{ fontFamily:CL.ui, fontWeight:600, fontSize:12.5, color:CL.iron, whiteSpace:'nowrap' }}>{label}</span>
      </div>
      <div style={{ display:'flex', alignItems:'baseline', gap:8, marginTop:8 }}>
        <span style={{ fontFamily:CL.display, fontWeight:700, fontSize:30, color: color || CL.ink, lineHeight:1 }}>{value}</span>
        <span style={{ fontFamily:CL.ui, fontSize:12.5, color:CL.iron }}>{sub}</span>
      </div>
    </div>
  )
}

const CARD = {
  background: CL.paper, border:`1px solid ${CL.sand}`, borderRadius:14,
  boxShadow:'0 1px 0 rgba(255,255,255,0.6) inset, 0 6px 18px rgba(74,48,25,0.05)',
}

export default function Clavex() {
  const { user } = useUser()
  const role = user?.publicMetadata?.role || 'sales'
  const isManager = role === 'manager'
  const [designFiles, setDesignFiles]   = useState([])
  const [invoiceFiles, setInvoiceFiles] = useState([])
  const [vendor, setVendor]             = useState('highland')
  const [loading, setLoading]           = useState(false)
  const [loadingMsg, setLoadingMsg]     = useState('')
  const [report, setReport]             = useState(null)
  const [trimData, setTrimData]         = useState(null)
  const [error, setError]               = useState(null)
  const [exporting, setExporting]       = useState(false)
  const [openRow, setOpenRow]           = useState(-1)
  const [signoff, setSignoff]           = useState([false, false, false, false])
  const designRef  = useRef()
  const invoiceRef = useRef()

  const MSGS = ['Uploading PDFs…','Extracting SKUs with AI…','Matching line items…','Calculating trim quantities…','Building report…']

  async function uploadOne(file) {
    const blob = await upload(file.name, file, { access:'public', handleUploadUrl:'/api/blob-upload' })
    return blob.url
  }

  async function call(body) {
    setLoading(true); setError(null); setReport(null); setTrimData(null); setOpenRow(-1); setSignoff([false,false,false,false])
    let mi = 0; setLoadingMsg(MSGS[0])
    const iv = setInterval(() => { mi=(mi+1)%MSGS.length; setLoadingMsg(MSGS[mi]) }, 1800)
    try {
      const res = await fetch('/api/verify', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReport(data.report); setTrimData(data.trimData)
      const firstFlag = (data.report?.items || []).findIndex(i => SPEC_STATUS[i.status] !== 'match')
      if (firstFlag >= 0) setOpenRow(firstFlag)
    } catch(e) { setError(e.message) }
    finally { clearInterval(iv); setLoading(false) }
  }

  async function runDemo() { await call({ demo:true, vendor }) }

  async function runVerify() {
    if (!designFiles.length || !invoiceFiles.length) return
    const [designUrls, invoiceUrls] = await Promise.all([
      Promise.all(designFiles.map(uploadOne)),
      Promise.all(invoiceFiles.map(uploadOne)),
    ])
    await call({ designUrls, invoiceUrls, vendor })
  }

  async function exportExcel() {
    if (!report) return
    setExporting(true)
    try {
      const res = await fetch('/api/export', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ report, trimData }) })
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `clavex_${(report.meta?.jobAddress||'order').replace(/[^a-z0-9]/gi,'_').slice(0,30)}.xlsx`
      a.click()
    } catch(e) { alert('Export failed: '+e.message) }
    finally { setExporting(false) }
  }

  function reset() {
    setReport(null); setTrimData(null); setError(null); setDesignFiles([]); setInvoiceFiles([]); setOpenRow(-1); setSignoff([false,false,false,false])
  }

  const summary = report?.summary
  const items = report?.items || []
  const matchedCount = summary?.matched || 0
  const totalCount = summary?.total || 0
  const reviewCount = summary ? (summary.issues - summary.missing) : 0
  const missingCount = summary?.missing || 0
  const matchRatePct = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0

  const overall = summary?.overallStatus
  const pillCfg = overall === 'APPROVED'
    ? { color: CL.match, bg:'rgba(94,122,75,0.13)', label:'APPROVED' }
    : overall === 'HOLD'
      ? { color: CL.miss, bg:'rgba(166,57,31,0.12)', label:'ON HOLD' }
      : { color: CL.flag, bg:'rgba(191,85,39,0.13)', label:'IN REVIEW' }

  const fileRefs = useMemo(() => [
    { name:designFiles[0]?.name, ext:'2020 Design export' },
    { name:invoiceFiles[0]?.name, ext:`${vendor === 'highland' ? 'Highland' : vendor} invoice` },
  ], [designFiles, invoiceFiles, vendor])

  return (
    <>
      <Head>
        <title>Clavex · Order Verification</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@400;500;600;700&family=Hanken+Grotesk:wght@400;500;600;700;800&family=Spline+Sans+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ display:'flex', minHeight:'100vh', background:CL.sand }}>

        {/* ───── Sidebar ───── */}
        <aside style={{ width:244, flex:'0 0 244px', background:CL.espresso, display:'flex', flexDirection:'column', padding:'22px 16px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:11, padding:'0 6px 22px' }}>
            <img src="/clavex-key/honey.svg" width={34} height={34} alt="Clavex" style={{ display:'block' }} />
            <span style={{ fontFamily:CL.display, fontWeight:700, fontSize:21, color:CL.paper, letterSpacing:'-0.01em' }}>Clavex</span>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.06)',
            border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'8px 11px', marginBottom:18 }}>
            <Icon d={ICN.search} size={15} color="rgba(242,231,210,0.5)" stroke={2} />
            <span style={{ fontFamily:CL.ui, fontSize:13, color:'rgba(242,231,210,0.5)' }}>Search orders…</span>
            <span style={{ marginLeft:'auto', fontFamily:CL.mono, fontSize:10, color:'rgba(242,231,210,0.4)',
              border:'1px solid rgba(242,231,210,0.16)', borderRadius:4, padding:'0 5px' }}>⌘K</span>
          </div>

          <div style={{ fontFamily:CL.ui, fontWeight:700, fontSize:10.5, color:'rgba(242,231,210,0.4)',
            letterSpacing:'0.1em', padding:'0 11px 8px' }}>PLATFORM</div>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            <NavItem icon={ICN.check}  label="Order Verification" href="/" active />
            {isManager && <NavItem icon={ICN.chart} label="Reports" href="/reports" />}
            <NavItem icon={ICN.truck}  label="Delivery Scheduling" soon />
            <NavItem icon={ICN.box}    label="Inventory" soon />
            <NavItem icon={ICN.users}  label="Vendors" soon />
          </div>

          <div style={{ marginTop:'auto', display:'flex', alignItems:'center', gap:10, padding:'12px 8px 0',
            borderTop:'1px solid rgba(255,255,255,0.08)' }}>
            <UserButton appearance={{ elements: { avatarBox: { width:34, height:34 } } }} />
            <div style={{ lineHeight:1.2, minWidth:0, flex:1 }}>
              <div style={{ fontFamily:CL.ui, fontWeight:600, fontSize:13, color:CL.paper, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.primaryEmailAddress?.emailAddress : 'Highland Cabinetry'}
              </div>
              <div style={{ fontFamily:CL.ui, fontSize:11.5, color:'rgba(242,231,210,0.5)', textTransform:'capitalize' }}>
                {isManager ? 'Manager' : 'Sales'} · Highland Cabinetry CO
              </div>
            </div>
          </div>
        </aside>

        {/* ───── Main ───── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

          {/* Topbar */}
          <div style={{ padding:'20px 30px 18px', borderBottom:`1px solid ${CL.sand}`, background:CL.paper }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, fontFamily:CL.ui, fontSize:12.5, color:CL.iron, marginBottom:5 }}>
                  <span>Orders</span><span style={{ color:CL.ironLt }}>/</span>
                  <span style={{ fontFamily:CL.mono }}>{report?.meta?.invoiceNumber ? `#${String(report.meta.invoiceNumber).split(',')[0]}` : 'New'}</span>
                  <span style={{ color:CL.ironLt }}>/</span>
                  <span style={{ color:CL.walnut, fontWeight:600 }}>Verification</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                  <h1 style={{ margin:0, fontFamily:CL.display, fontWeight:700, fontSize:27, color:CL.ink, letterSpacing:'-0.01em', whiteSpace:'nowrap', flex:'0 1 auto', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {report?.meta?.jobAddress || 'Verify an order'}
                  </h1>
                  {report && (
                    <span style={{ flex:'0 0 auto', fontFamily:CL.ui, fontWeight:700, fontSize:11.5,
                      color:pillCfg.color, background:pillCfg.bg, padding:'4px 10px', borderRadius:999, whiteSpace:'nowrap' }}>
                      {pillCfg.label}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily:CL.ui, fontSize:13.5, color:CL.iron, marginTop:6, display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap', overflow:'hidden' }}>
                  {report ? (
                    <>
                      <span style={{ fontFamily:CL.mono, color:CL.walnut }}>{fileRefs[0].name || 'design.pdf'}</span>
                      <span style={{ color:CL.ironLt }}>{fileRefs[0].ext}</span>
                      <span style={{ color:CL.honey }}>✕</span>
                      <span style={{ fontFamily:CL.mono, color:CL.walnut }}>{fileRefs[1].name || 'invoice.pdf'}</span>
                      <span style={{ color:CL.ironLt }}>{`${vendor === 'highland' ? 'Highland' : vendor} · ${items.length} lines`}</span>
                      {report.meta?.salesRep && (
                        <>
                          <span style={{ color:CL.honey }}>·</span>
                          <span style={{ color:CL.ironLt }}>Rep:</span>
                          <span style={{ color:CL.walnut, fontWeight:600 }}>{report.meta.salesRep}</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span style={{ color:CL.iron }}>The key between design and delivery.</span>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', gap:10, paddingTop:4, flex:'0 0 auto' }}>
                <Btn icon={ICN.refresh} onClick={reset} disabled={loading}>New verification</Btn>
                <Btn icon={ICN.download} primary onClick={exportExcel} disabled={!report || exporting}>{exporting ? 'Exporting…' : 'Export Excel'}</Btn>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex:1, overflow:'auto', padding:'22px 30px 30px', background:'linear-gradient(180deg,#FBF5EA,#F6EEDD)' }}>

            {/* ── No-report state: upload card ── */}
            {!report && !loading && (
              <UploadCard
                designFiles={designFiles} setDesignFiles={setDesignFiles}
                invoiceFiles={invoiceFiles} setInvoiceFiles={setInvoiceFiles}
                vendor={vendor} setVendor={setVendor}
                runVerify={runVerify} runDemo={runDemo}
                designRef={designRef} invoiceRef={invoiceRef}
                error={error}
              />
            )}

            {/* ── Loading ── */}
            {loading && (
              <div style={{ ...CARD, padding:'48px 36px', textAlign:'center' }}>
                <div style={{ width:34, height:34, borderRadius:'50%', border:`3px solid ${CL.sand}`, borderTopColor:CL.ember, margin:'0 auto 16px', animation:'cl-spin 0.7s linear infinite' }} />
                <div style={{ fontFamily:CL.ui, fontSize:14, color:CL.iron }}>{loadingMsg}</div>
                <style>{`@keyframes cl-spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            )}

            {/* ── Error ── */}
            {error && !loading && report && (
              <div style={{ background:'rgba(166,57,31,0.08)', border:`1px solid ${CL.miss}`, borderRadius:11, padding:'13px 16px', color:CL.miss, fontFamily:CL.ui, fontSize:13.5, marginBottom:18 }}>
                ⚠ {error}
              </div>
            )}

            {/* ── Results ── */}
            {report && !loading && (
              <>
                {/* Progress */}
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
                  <div style={{ flex:1, height:8, borderRadius:999, background:CL.sand, overflow:'hidden' }}>
                    <div style={{ width:`${matchRatePct}%`, height:'100%', background:`linear-gradient(90deg,${CL.honey},${CL.ember})`, transition:'width .4s' }} />
                  </div>
                  <span style={{ fontFamily:CL.ui, fontSize:12.5, fontWeight:600, color:CL.walnut, whiteSpace:'nowrap' }}>
                    {matchedCount} of {totalCount} lines reconciled
                  </span>
                </div>

                {/* Stats */}
                <div style={{ display:'flex', gap:14, marginBottom:20 }}>
                  <StatCard label="Total lines"   value={totalCount}    sub="compared"      color={CL.ink}   icon={ICN.layers} />
                  <StatCard label="Matched"       value={matchedCount}  sub="auto-verified" color={CL.match} icon={ICN.check} />
                  <StatCard label="Needs review"  value={reviewCount}   sub="flagged"       color={CL.flag}  icon={ICN.alert} accent={reviewCount > 0} />
                  <StatCard label="Missing"       value={missingCount}  sub="on invoice"    color={CL.miss}  icon={ICN.minus} />
                </div>

                {/* Body grid */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 312px', gap:20, alignItems:'start' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'2px 2px 12px' }}>
                      <h2 style={{ margin:0, fontFamily:CL.ui, fontWeight:700, fontSize:16, color:CL.ink }}>Line-by-line comparison</h2>
                      <span style={{ fontFamily:CL.ui, fontSize:12.5, color:CL.iron }}>· showing exceptions first</span>
                    </div>
                    <VTable items={items} openRow={openRow} setOpenRow={setOpenRow} />
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                    <TrimCard trim={trimData} />
                    <SignoffCard signoff={signoff} setSignoff={setSignoff} reviewCount={reviewCount} missingCount={missingCount} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────── Upload card ── */
function UploadCard({ designFiles, setDesignFiles, invoiceFiles, setInvoiceFiles, vendor, setVendor, runVerify, runDemo, designRef, invoiceRef, error }) {
  const zones = [
    { label:'Design files (2020 Design export)', files:designFiles, set:setDesignFiles, ref:designRef },
    { label:'Sales estimates / invoices',         files:invoiceFiles, set:setInvoiceFiles, ref:invoiceRef },
  ]
  return (
    <div style={{ ...CARD, padding:'26px 28px', maxWidth:880 }}>
      <h2 style={{ fontFamily:CL.display, fontWeight:700, fontSize:24, color:CL.ink, letterSpacing:'-0.01em', marginBottom:4 }}>Start a verification</h2>
      <p style={{ fontFamily:CL.ui, fontSize:13.5, color:CL.iron, marginBottom:22 }}>Drop your design PDFs and the matching sales orders. Multiple files OK on either side.</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
        {zones.map((z, i) => {
          const has = z.files.length > 0
          const names = z.files.map(f => f.name).join(', ')
          return (
            <div key={i}
              onClick={() => z.ref.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = CL.ember; e.currentTarget.style.background = 'rgba(191,85,39,0.06)' }}
              onDragLeave={e => { e.currentTarget.style.borderColor = has ? CL.match : CL.tan; e.currentTarget.style.background = has ? 'rgba(94,122,75,0.06)' : CL.cream }}
              onDrop={e => { e.preventDefault(); const fs = Array.from(e.dataTransfer.files).filter(f => /\.pdf$/i.test(f.name)); if (fs.length) z.set(fs); e.currentTarget.style.borderColor = has ? CL.match : CL.tan; e.currentTarget.style.background = has ? 'rgba(94,122,75,0.06)' : CL.cream }}
              style={{
                border:`2px dashed ${has ? CL.match : CL.tan}`,
                background: has ? 'rgba(94,122,75,0.06)' : CL.cream,
                borderRadius:11, padding:'24px 18px', textAlign:'center', cursor:'pointer', transition:'all .15s',
              }}>
              <Icon d={has ? ICN.check : ICN.upload} size={24} color={has ? CL.match : CL.oak} stroke={2} />
              <div style={{ fontFamily:CL.ui, fontWeight:600, fontSize:13.5, color:CL.ink, marginTop:8 }}>
                {has ? `${z.files.length} file${z.files.length>1?'s':''} ready` : z.label}
              </div>
              <div style={{ fontFamily:CL.ui, fontSize:12, color:CL.iron, marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {has ? (names.length > 60 ? names.slice(0,58)+'…' : names) : 'Drop PDFs or click to browse'}
              </div>
              <input ref={z.ref} type="file" accept=".pdf" multiple style={{ display:'none' }}
                onChange={e => { const fs = Array.from(e.target.files); if (fs.length) z.set(fs) }} />
            </div>
          )
        })}
      </div>

      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <select value={vendor} onChange={e => setVendor(e.target.value)} style={{
          height:40, padding:'0 12px', borderRadius:9, border:`1px solid ${CL.sand}`,
          background:CL.paper, color:CL.walnut, fontFamily:CL.ui, fontWeight:600, fontSize:13.5, cursor:'pointer',
        }}>
          <option value="highland">Highland Cabinetry</option>
          <option value="kraftmaid">KraftMaid</option>
          <option value="merillat">Merillat</option>
          <option value="ultracraft">UltraCraft</option>
          <option value="waypoint">Waypoint</option>
        </select>
        <Btn primary icon={ICN.check} onClick={runVerify} disabled={!designFiles.length || !invoiceFiles.length}>Analyze</Btn>
        <Btn onClick={runDemo}>Demo · Arkansas Ave</Btn>
      </div>

      {error && (
        <div style={{ marginTop:16, background:'rgba(166,57,31,0.08)', border:`1px solid ${CL.miss}`, borderRadius:11, padding:'11px 14px', color:CL.miss, fontFamily:CL.ui, fontSize:13 }}>
          ⚠ {error}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────── Verification table ── */
function VTable({ items, openRow, setOpenRow }) {
  const grid = '1.15fr 2fr 1.15fr 0.7fr 0.7fr 1.2fr 28px'
  const sorted = [...items].sort((a,b) => {
    const order = { miss:0, flag:1, match:2 }
    return (order[SPEC_STATUS[a.status]] ?? 9) - (order[SPEC_STATUS[b.status]] ?? 9)
  })

  return (
    <div style={{ ...CARD, overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:grid, gap:14, padding:'13px 18px',
        background:CL.cream, borderBottom:`1px solid ${CL.sand}`,
        fontFamily:CL.ui, fontWeight:700, fontSize:10.5, color:CL.iron, letterSpacing:'0.07em', textTransform:'uppercase' }}>
        <div>Design code</div><div>Description</div><div>Invoice SKU</div>
        <div style={{ textAlign:'center' }}>Dsgn</div><div style={{ textAlign:'center' }}>Inv</div><div>Status</div><div></div>
      </div>

      {sorted.length === 0 && (
        <div style={{ padding:'30px 18px', textAlign:'center', fontFamily:CL.ui, fontSize:13.5, color:CL.iron }}>
          No line items in this view.
        </div>
      )}

      {sorted.map((r, i) => {
        const status = SPEC_STATUS[r.status] || 'flag'
        const dq = r.designQty ?? 0
        const iq = r.invoiceQty ?? 0
        const dqDisp = status === 'flag' && r.status === 'extra' ? '–' : dq
        const iqDisp = status === 'miss' ? 0 : iq
        const qtyBad = status === 'flag' && dq !== iq && r.status !== 'extra' && r.status !== 'substitution'
        const hasNote = !!r.note
        const isOpen = openRow === i
        return (
          <div key={i} style={{ borderBottom: i < sorted.length - 1 ? `1px solid ${CL.sand}` : 'none' }}>
            <div onClick={() => hasNote && setOpenRow(isOpen ? -1 : i)}
              style={{ display:'grid', gridTemplateColumns:grid, gap:14, padding:'13px 18px', alignItems:'center',
                cursor: hasNote ? 'pointer' : 'default', background: isOpen ? 'rgba(191,85,39,0.04)' : 'transparent' }}>
              <div style={{ fontFamily:CL.mono, fontSize:13, fontWeight:600, color:CL.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.designSku || '–'}</div>
              <div style={{ fontFamily:CL.ui, fontSize:13, color:CL.walnut, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.description || '–'}</div>
              <div style={{ fontFamily:CL.mono, fontSize:13, color: r.invoiceSku ? CL.oak : CL.ironLt, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.invoiceSku || '–'}</div>
              <div style={{ fontFamily:CL.mono, fontSize:13, textAlign:'center', color: dqDisp === '–' ? CL.ironLt : CL.ink }}>{dqDisp}</div>
              <div style={{ fontFamily:CL.mono, fontSize:13, textAlign:'center', fontWeight: qtyBad ? 700 : 400, color: qtyBad ? CL.miss : (iqDisp === 0 ? CL.ironLt : CL.ink) }}>{iqDisp}</div>
              <div><StatusChip s={status} /></div>
              <div style={{ display:'flex', justifyContent:'center', color:CL.iron,
                transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform .15s', opacity: hasNote ? 1 : 0 }}>
                <Icon d={ICN.chev} size={16} color={CL.iron} stroke={2.2} />
              </div>
            </div>
            {isOpen && hasNote && (
              <div style={{ padding:'0 18px 16px', background:'rgba(191,85,39,0.04)' }}>
                <div style={{ display:'flex', gap:12, padding:'13px 15px', background:CL.paper, border:`1px solid ${CL.sand}`, borderRadius:11 }}>
                  <div style={{ width:26, height:26, borderRadius:7, flex:'0 0 auto', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(191,85,39,0.13)' }}>
                    <Icon d={ICN.alert} size={15} color={CL.flag} stroke={2.2} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:CL.ui, fontSize:13.5, color:CL.ink, lineHeight:1.55 }}>{r.note}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────── Trim card ── */
function TrimCard({ trim }) {
  const rows = trim?.trimSuggestions || []
  return (
    <div style={{ ...CARD, padding:18 }}>
      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:4 }}>
        <Icon d={ICN.layers} size={17} color={CL.oak} stroke={2} />
        <h3 style={{ margin:0, fontFamily:CL.ui, fontWeight:700, fontSize:15, color:CL.ink, whiteSpace:'nowrap' }}>Suggested trim</h3>
      </div>
      <p style={{ margin:'0 0 13px', fontFamily:CL.ui, fontSize:12.5, color:CL.iron, lineHeight:1.5 }}>
        {trim?.layoutNotes ? trim.layoutNotes.slice(0, 120) : 'Derived from the layout perimeter and cabinet runs.'}
      </p>
      {rows.length === 0 ? (
        <div style={{ fontFamily:CL.ui, fontSize:12.5, color:CL.iron, padding:'10px 0' }}>No trim suggestions.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {rows.map((r, i) => {
            const needsAdd = r.status && r.status !== 'ok'
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 11px', background:CL.cream, borderRadius:9, border:`1px solid ${CL.sand}` }}>
                <span style={{ fontFamily:CL.ui, fontWeight:600, fontSize:13, color:CL.ink }}>{r.itemType}{r.height ? ` · ${r.height}` : ''}</span>
                <span style={{ marginLeft:'auto', fontFamily:CL.mono, fontSize:12.5, color:CL.walnut }}>{r.suggestedQty} {r.unit}</span>
                {needsAdd
                  ? <span style={{ fontFamily:CL.ui, fontWeight:700, fontSize:11, color:CL.ember, background:'rgba(191,85,39,0.12)', padding:'3px 8px', borderRadius:999 }}>+ Add</span>
                  : <Icon d={ICN.check} size={15} color={CL.match} stroke={2.6} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────── Sign-off card ── */
function SignoffCard({ signoff, setSignoff, reviewCount, missingCount }) {
  const items = ['Quantities reconciled', 'Handed pairs confirmed', 'Trim added to invoice', 'Naming differences resolved']
  const toggle = (i) => setSignoff(d => d.map((v, j) => j === i ? !v : v))
  const count = signoff.filter(Boolean).length
  const allDone = count === 4
  const canSignoff = allDone && reviewCount === 0 && missingCount === 0

  return (
    <div style={{ ...CARD, padding:18 }}>
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <h3 style={{ margin:0, fontFamily:CL.ui, fontWeight:700, fontSize:15, color:CL.ink, whiteSpace:'nowrap' }}>Sign-off checklist</h3>
        <span style={{ marginLeft:'auto', fontFamily:CL.mono, fontSize:12, color:CL.iron }}>{count}/4</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:4, margin:'14px 0 16px' }}>
        {items.map((t, i) => (
          <div key={i} onClick={() => toggle(i)} style={{ display:'flex', alignItems:'center', gap:11, padding:'8px 4px', cursor:'pointer' }}>
            <div style={{ width:20, height:20, borderRadius:6, flex:'0 0 auto', display:'flex', alignItems:'center', justifyContent:'center',
              background: signoff[i] ? CL.match : CL.paper, border:`1.5px solid ${signoff[i] ? CL.match : CL.tan}` }}>
              {signoff[i] && <Icon d={ICN.check} size={13} color={CL.paper} stroke={3} />}
            </div>
            <span style={{ fontFamily:CL.ui, fontSize:13.5, fontWeight:500,
              color: signoff[i] ? CL.iron : CL.ink, textDecoration: signoff[i] ? 'line-through' : 'none' }}>{t}</span>
          </div>
        ))}
      </div>
      <button style={{
        width:'100%', height:44, borderRadius:10, border:'none', cursor: canSignoff ? 'pointer' : 'not-allowed',
        background: canSignoff ? CL.ember : CL.tan,
        color: canSignoff ? CL.paper : CL.walnut,
        fontFamily:CL.ui, fontWeight:700, fontSize:14, transition:'background .2s',
        boxShadow: canSignoff ? '0 3px 12px rgba(191,85,39,0.3)' : 'none',
      }}>
        {canSignoff
          ? 'Sign off & lock order'
          : !allDone
            ? `Resolve ${4 - count} item${4 - count > 1 ? 's' : ''} to lock`
            : `${reviewCount + missingCount} open issue${reviewCount + missingCount > 1 ? 's' : ''} remaining`}
      </button>
    </div>
  )
}
