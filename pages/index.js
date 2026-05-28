import { useState, useRef } from 'react'
import Head from 'next/head'

const STATUS_CFG = {
  match:        { label: 'MATCH',    bg: '#D4EDDA', color: '#1A5C35' },
  handed_merge: { label: 'PAIR OK',  bg: '#D4EDDA', color: '#1A5C35' },
  qty_mismatch: { label: 'QTY DIFF', bg: '#FFF3CD', color: '#7B5C00' },
  substitution: { label: 'SUB',      bg: '#FFF3CD', color: '#7B5C00' },
  missing:      { label: 'MISSING',  bg: '#F8D7DA', color: '#6B1A1F' },
  extra:        { label: 'EXTRA',    bg: '#CCE5FF', color: '#0A3D62' },
}

const OVERALL_CFG = {
  APPROVED: { bg: '#1A5C35', icon: '✓' },
  REVIEW:   { bg: '#7B5C00', icon: '⚠' },
  HOLD:     { bg: '#842029', icon: '✗' },
}

const NAV_MODULES = [
  { id: 'verify',    label: 'Order Verify',   icon: '⬡', active: true  },
  { id: 'inventory', label: 'Inventory',       icon: '⬢', active: false },
  { id: 'delivery',  label: 'Delivery',        icon: '⬡', active: false },
  { id: 'vendors',   label: 'Vendors',         icon: '⬢', active: false },
]

export default function Forgepoint() {
  const [designFiles, setDesignFiles]   = useState([])
  const [invoiceFiles, setInvoiceFiles] = useState([])
  const [vendor, setVendor]           = useState('highland')
  const [loading, setLoading]         = useState(false)
  const [loadingMsg, setLoadingMsg]   = useState('')
  const [report, setReport]           = useState(null)
  const [trimData, setTrimData]       = useState(null)
  const [error, setError]             = useState(null)
  const [activeTab, setActiveTab]     = useState('all')
  const [exporting, setExporting]     = useState(false)
  const [navOpen, setNavOpen]         = useState(true)
  const designRef  = useRef()
  const invoiceRef = useRef()

  const MSGS = ['Reading PDFs...','Extracting SKUs with AI...','Matching line items...','Calculating trim quantities...','Building report...']

  async function toB64(file) {
    return new Promise((res,rej) => { const r=new FileReader(); r.onload=e=>res(e.target.result.split(',')[1]); r.onerror=rej; r.readAsDataURL(file) })
  }

  async function call(body) {
    setLoading(true); setError(null); setReport(null); setTrimData(null)
    let mi = 0; setLoadingMsg(MSGS[0])
    const iv = setInterval(() => { mi=(mi+1)%MSGS.length; setLoadingMsg(MSGS[mi]) }, 1800)
    try {
      const res = await fetch('/api/verify', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReport(data.report); setTrimData(data.trimData); setActiveTab('all')
    } catch(e) { setError(e.message) }
    finally { clearInterval(iv); setLoading(false) }
  }

  async function runDemo() { await call({ demo:true, vendor }) }

  async function runVerify() {
    if (!designFiles.length || !invoiceFiles.length) return
    const [designB64s, invoiceB64s] = await Promise.all([
      Promise.all(designFiles.map(toB64)),
      Promise.all(invoiceFiles.map(toB64)),
    ])
    await call({ designB64s, invoiceB64s, vendor })
  }

  async function exportExcel() {
    if (!report) return
    setExporting(true)
    try {
      const res = await fetch('/api/export', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ report, trimData }) })
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `forgepoint_${(report.meta?.jobAddress||'order').replace(/[^a-z0-9]/gi,'_').slice(0,30)}.xlsx`
      a.click()
    } catch(e) { alert('Export failed: '+e.message) }
    finally { setExporting(false) }
  }

  const displayItems = report?.items?.filter(i => {
    if (activeTab==='issues') return !['match','handed_merge'].includes(i.status)
    if (activeTab==='match')  return  ['match','handed_merge'].includes(i.status)
    return true
  }) || []

  const oCfg = report ? (OVERALL_CFG[report.summary.overallStatus]||OVERALL_CFG.HOLD) : null

  return (
    <>
      <Head>
        <title>Forgepoint — Highland Cabinetry</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        .layout { display:flex; min-height:100vh; }

        /* ── Sidebar ── */
        .sidebar { width:${navOpen?220:64}px; background:var(--navy-dark); display:flex; flex-direction:column; transition:width 0.2s; flex-shrink:0; }
        .sidebar-top { padding:20px ${navOpen?'20px':'12px'}; border-bottom:1px solid rgba(255,255,255,0.07); }
        .brand { display:flex; align-items:center; gap:10px; cursor:default; }
        .brand-mark { width:36px; height:36px; background:var(--teal); border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .brand-mark svg { width:20px; height:20px; }
        .brand-text { overflow:hidden; }
        .brand-name { color:white; font-size:15px; font-weight:600; letter-spacing:-0.01em; white-space:nowrap; }
        .brand-sub  { color:var(--steel); font-size:10px; white-space:nowrap; }
        .nav { flex:1; padding:12px 0; }
        .nav-section { padding: 0 ${navOpen?'12px':'8px'} 4px; }
        .nav-label { font-size:9px; font-weight:600; color:rgba(255,255,255,0.25); text-transform:uppercase; letter-spacing:0.1em; padding: 8px ${navOpen?'8px':'4px'} 4px; white-space:nowrap; overflow:hidden; }
        .nav-item { display:flex; align-items:center; gap:10px; padding:9px ${navOpen?'10px':'12px'}; border-radius:8px; cursor:pointer; transition:background 0.12s; margin-bottom:2px; }
        .nav-item:hover { background:rgba(255,255,255,0.06); }
        .nav-item.active { background:rgba(110,140,150,0.25); }
        .nav-icon { font-size:16px; flex-shrink:0; color:var(--steel); width:20px; text-align:center; }
        .nav-item.active .nav-icon { color:var(--teal); }
        .nav-item-label { font-size:13px; color:rgba(255,255,255,0.6); white-space:nowrap; overflow:hidden; }
        .nav-item.active .nav-item-label { color:white; }
        .nav-soon { font-size:9px; background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.3); padding:2px 6px; border-radius:4px; margin-left:auto; white-space:nowrap; }
        .sidebar-bottom { padding:16px ${navOpen?'20px':'12px'}; border-top:1px solid rgba(255,255,255,0.07); }
        .hci-badge { display:flex; align-items:center; gap:8px; }
        .hci-dot { width:8px; height:8px; background:var(--teal); border-radius:50%; flex-shrink:0; }
        .hci-text { font-size:11px; color:rgba(255,255,255,0.35); white-space:nowrap; overflow:hidden; }
        .toggle-btn { background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.3); font-size:14px; padding:0; margin-left:auto; }
        .toggle-btn:hover { color:white; }

        /* ── Main ── */
        .main { flex:1; display:flex; flex-direction:column; min-width:0; }
        .topbar { background:var(--white); border-bottom:1px solid var(--border); padding:0 2rem; height:56px; display:flex; align-items:center; justify-content:space-between; }
        .topbar-title { font-size:15px; font-weight:500; }
        .topbar-meta { font-size:12px; color:var(--muted); }
        .content { flex:1; padding:1.75rem 2rem; overflow-y:auto; max-width:1000px; }

        /* ── Upload card ── */
        .card { background:var(--white); border-radius:14px; border:1px solid var(--border); padding:1.75rem; margin-bottom:1.25rem; }
        .card-title { font-family:'DM Serif Display',serif; font-size:20px; margin-bottom:4px; }
        .card-sub   { font-size:13px; color:var(--muted); margin-bottom:1.5rem; }

        .upload-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:1.25rem; }
        @media(max-width:580px){.upload-grid{grid-template-columns:1fr;}}
        .dropzone { border:2px dashed var(--border); border-radius:10px; padding:1.75rem 1.25rem; text-align:center; cursor:pointer; transition:all 0.15s; background:var(--bg); }
        .dropzone:hover { border-color:var(--teal); background:var(--teal-lt); }
        .dropzone.drag { border-color:var(--teal); background:var(--teal-lt); }
        .dropzone.has { border-style:solid; border-color:var(--sage); background:#EEF1EC; }
        .dz-icon  { font-size:28px; margin-bottom:8px; }
        .dz-label { font-size:14px; font-weight:500; }
        .dz-sub   { font-size:12px; color:var(--muted); margin-top:3px; }
        .dropzone.has .dz-label { color:var(--sage); }

        .controls { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        select { padding:9px 13px; border:1px solid var(--border); border-radius:8px; font-size:13px; font-family:inherit; background:var(--white); color:var(--text); }
        .btn { padding:10px 20px; border-radius:8px; font-size:13px; font-weight:500; font-family:inherit; cursor:pointer; border:none; transition:all 0.15s; }
        .btn-primary { background:var(--navy); color:white; }
        .btn-primary:hover { background:var(--navy-dark); }
        .btn-primary:disabled { opacity:0.35; cursor:not-allowed; }
        .btn-teal { background:var(--teal); color:white; }
        .btn-teal:hover { opacity:0.88; }
        .btn-teal:disabled { opacity:0.35; cursor:not-allowed; }
        .btn-ghost { background:transparent; color:var(--muted); border:1px dashed var(--border); font-size:12px; }
        .btn-ghost:hover { border-color:var(--teal); color:var(--teal); }

        /* ── Loading ── */
        .loading { text-align:center; padding:3rem; background:var(--white); border-radius:14px; border:1px solid var(--border); margin-bottom:1.25rem; }
        .spinner { width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--navy); border-radius:50%; animation:spin 0.7s linear infinite; margin:0 auto 14px; }
        @keyframes spin{to{transform:rotate(360deg)}}
        .loading p { font-size:13px; color:var(--muted); }

        .error-box { background:#FEF2F2; border:1px solid #FECACA; border-radius:10px; padding:1rem 1.25rem; color:#7F1D1D; font-size:13px; margin-bottom:1.25rem; }

        /* ── Results header ── */
        .results-hdr { background:var(--navy); border-radius:14px; padding:1.5rem 1.75rem; margin-bottom:1.25rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; }
        .rh-title { font-family:'DM Serif Display',serif; font-size:22px; color:white; margin-bottom:3px; }
        .rh-meta  { font-size:12px; color:var(--steel); }
        .status-badge { padding:8px 18px; border-radius:8px; color:white; font-size:13px; font-weight:600; letter-spacing:0.02em; }

        /* ── Stats ── */
        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:1.25rem; }
        @media(max-width:640px){.stats-grid{grid-template-columns:repeat(2,1fr);}}
        .stat { background:var(--white); border:1px solid var(--border); border-radius:10px; padding:1.1rem 1.25rem; }
        .stat-lbl { font-size:10px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px; }
        .stat-val { font-size:26px; font-weight:600; line-height:1; }

        /* ── Trim ── */
        .trim-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        @media(max-width:580px){.trim-grid{grid-template-columns:repeat(2,1fr);}}
        .trim-card { background:var(--bg); border-radius:10px; padding:12px 14px; }
        .tc-name { font-size:10px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:5px; }
        .tc-qty  { font-size:20px; font-weight:600; }
        .tc-unit { font-size:11px; color:var(--muted); }
        .tc-inv  { font-size:11px; color:var(--muted); margin-top:3px; }
        .tc-status { display:inline-block; font-size:9px; font-weight:700; padding:2px 7px; border-radius:4px; margin-top:5px; text-transform:uppercase; letter-spacing:0.04em; }
        .ts-ok      {background:var(--success-bg);color:var(--success-text)}
        .ts-missing {background:var(--danger-bg); color:var(--danger-text)}
        .ts-under   {background:var(--warn-bg);   color:var(--warn-text)}
        .ts-over    {background:var(--warn-bg);   color:var(--warn-text)}

        /* ── Line items ── */
        .tabs { display:flex; gap:3px; background:var(--bg); padding:4px; border-radius:8px; width:fit-content; margin-bottom:1rem; }
        .tab { padding:6px 14px; border-radius:6px; font-size:12px; font-weight:500; cursor:pointer; border:none; background:transparent; color:var(--muted); font-family:inherit; transition:all 0.12s; }
        .tab.active { background:var(--white); color:var(--navy); box-shadow:0 1px 3px rgba(0,0,0,0.08); }
        .col-hdr { display:grid; grid-template-columns:88px 1fr 1fr 1fr 42px 42px; gap:8px; padding:5px 10px; font-size:10px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:3px; }
        .item-row { display:grid; grid-template-columns:88px 1fr 1fr 1fr 42px 42px; gap:8px; align-items:center; padding:8px 10px; border-radius:8px; font-size:12px; margin-bottom:2px; transition:background 0.1s; }
        .item-row:hover { filter:brightness(0.97); }
        @media(max-width:640px){ .col-hdr,.item-row{grid-template-columns:80px 1fr 1fr 36px 36px;} .col-hdr .c-desc,.item-row .c-desc{display:none;} }
        .pill { display:inline-block; font-size:9px; font-weight:700; padding:3px 7px; border-radius:5px; letter-spacing:0.03em; text-align:center; }
        .sku  { font-family:monospace; font-size:11px; }
        .qty-diff { color:var(--danger-text); font-weight:700; }
        .empty { text-align:center; padding:2.5rem; color:var(--muted); font-size:13px; }
        .section-label { font-size:13px; font-weight:600; margin-bottom:.75rem; display:flex; align-items:center; gap:8px; }
        .export-row { display:flex; gap:10px; flex-wrap:wrap; }
        .layout-note { font-size:11px; color:var(--muted); margin-top:10px; }
      `}</style>

      <div className="layout">

        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-top">
            <div className="brand">
              <div className="brand-mark">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L18 6.5V13.5L10 18L2 13.5V6.5L10 2Z" stroke="white" strokeWidth="1.5" fill="none"/>
                  <path d="M10 2V18M2 6.5L18 13.5M18 6.5L2 13.5" stroke="white" strokeWidth="1" opacity="0.4"/>
                </svg>
              </div>
              {navOpen && <div className="brand-text"><div className="brand-name">Forgepoint</div><div className="brand-sub">Built for Highland. Built to scale.</div></div>}
            </div>
          </div>

          <nav className="nav">
            <div className="nav-section">
              {navOpen && <div className="nav-label">Modules</div>}
              {NAV_MODULES.map(m => (
                <div key={m.id} className={`nav-item${m.id==='verify'?' active':''}`} style={!m.active&&m.id!=='verify'?{opacity:0.5}:{}}>
                  <span className="nav-icon">{m.icon}</span>
                  {navOpen && <>
                    <span className="nav-item-label">{m.label}</span>
                    {!m.active && m.id!=='verify' && <span className="nav-soon">Soon</span>}
                  </>}
                </div>
              ))}
            </div>
          </nav>

          <div className="sidebar-bottom">
            <div className="hci-badge">
              <div className="hci-dot" />
              {navOpen && <div className="hci-text">Highland Cabinetry 08</div>}
              <button className="toggle-btn" onClick={() => setNavOpen(o=>!o)}>{navOpen?'◀':'▶'}</button>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="main">
          <div className="topbar">
            <div className="topbar-title">Order Verification</div>
            <div className="topbar-meta">Forgepoint · 8th Ascent AI</div>
          </div>

          <div className="content">

            {/* Upload */}
            <div className="card">
              <div className="card-title">Verify an Order</div>
              <div className="card-sub">Upload your 2020 Design export and QuickBooks invoice — AI does the comparison.</div>

              <div className="upload-grid">
                {[
                  { label:'2020 Design Files', sub:'Drop PDFs or click to browse — multiple OK', icon:'📐', files:designFiles, ref:designRef, set:setDesignFiles },
                  { label:'Sales Estimates / Invoices', sub:'Drop PDFs or click to browse — multiple OK', icon:'🧾', files:invoiceFiles, ref:invoiceRef, set:setInvoiceFiles },
                ].map(({label,sub,icon,files,ref,set},idx) => {
                  const names = files.map(f=>f.name).join(', ')
                  return (
                    <div key={idx}
                      className={`dropzone${files.length?' has':''}`}
                      onClick={()=>ref.current?.click()}
                      onDragOver={e=>{e.preventDefault();e.currentTarget.classList.add('drag')}}
                      onDragLeave={e=>e.currentTarget.classList.remove('drag')}
                      onDrop={e=>{e.preventDefault();e.currentTarget.classList.remove('drag');const fs=Array.from(e.dataTransfer.files).filter(f=>/\.pdf$/i.test(f.name));if(fs.length)set(fs)}}
                    >
                      <div className="dz-icon">{files.length?'✅':icon}</div>
                      <div className="dz-label">{files.length ? `${files.length} file${files.length>1?'s':''} ready` : label}</div>
                      <div className="dz-sub">{files.length ? (names.length>70?names.slice(0,68)+'…':names) : sub}</div>
                      <input ref={ref} type="file" accept=".pdf" multiple style={{display:'none'}} onChange={e=>{const fs=Array.from(e.target.files);if(fs.length)set(fs)}} />
                    </div>
                  )
                })}
              </div>

              <div className="controls">
                <select value={vendor} onChange={e=>setVendor(e.target.value)}>
                  <option value="highland">Highland Cabinetry</option>
                  <option value="kraftmaid">KraftMaid</option>
                  <option value="merillat">Merillat</option>
                  <option value="ultracraft">UltraCraft</option>
                  <option value="waypoint">Waypoint</option>
                </select>
                <button className="btn btn-primary" disabled={!designFiles.length||!invoiceFiles.length||loading} onClick={runVerify}>
                  {loading?'Analyzing...':'Analyze Files'}
                </button>
                <button className="btn btn-ghost" onClick={runDemo} disabled={loading}>
                  Demo — Arkansas Ave #63052
                </button>
              </div>
            </div>

            {/* Loading */}
            {loading && <div className="loading"><div className="spinner"/><p>{loadingMsg}</p></div>}

            {/* Error */}
            {error && <div className="error-box">⚠ {error}</div>}

            {/* Results */}
            {report && !loading && (<>

              <div className="results-hdr">
                <div>
                  <div className="rh-title">{report.meta?.jobAddress||'Verification Complete'}</div>
                  <div className="rh-meta">Invoice #{report.meta?.invoiceNumber||'—'} · S.O. {report.meta?.soNumber||'—'} · {report.items?.length} items checked · {new Date(report.meta?.generatedAt).toLocaleDateString()}</div>
                </div>
                <div className="status-badge" style={{background:oCfg?.bg}}>
                  {oCfg?.icon} {report.summary.overallStatus}
                </div>
              </div>

              {/* Stats */}
              <div className="stats-grid">
                {[
                  { lbl:'Total Checked', val:report.summary.total, color:'var(--navy)' },
                  { lbl:`Matched · ${report.summary.matchRate}%`, val:report.summary.matched, color:'#1A5C35' },
                  { lbl:'Issues Found', val:report.summary.issues, color:report.summary.issues>0?'#842029':'#1A5C35' },
                  { lbl:'Missing Items', val:report.summary.missing, color:report.summary.missing>0?'#842029':'#1A5C35' },
                ].map(s=>(
                  <div className="stat" key={s.lbl}>
                    <div className="stat-lbl">{s.lbl}</div>
                    <div className="stat-val" style={{color:s.color}}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Trim */}
              {trimData?.trimSuggestions?.length>0 && (
                <div className="card">
                  <div className="section-label">📏 Trim Quantity Suggestions</div>
                  <div className="trim-grid">
                    {trimData.trimSuggestions.map((t,i)=>(
                      <div className="trim-card" key={i}>
                        <div className="tc-name">{t.itemType}{t.height?` · ${t.height}`:''}</div>
                        <div className="tc-qty">{t.suggestedQty} <span className="tc-unit">{t.unit}</span></div>
                        {t.invoicedQty!==undefined&&<div className="tc-inv">Invoiced: {t.invoicedQty}</div>}
                        <span className={`tc-status ts-${t.status||'ok'}`}>{(t.status||'ok').toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                  {trimData.layoutNotes&&<div className="layout-note">{trimData.layoutNotes}</div>}
                </div>
              )}

              {/* Line items */}
              <div className="card">
                <div className="section-label">📋 Line Item Comparison</div>
                <div className="tabs">
                  {[{k:'all',l:`All (${report.items?.length})`},{k:'issues',l:`Issues (${report.summary.issues})`},{k:'match',l:`Matched (${report.summary.matched})`}].map(t=>(
                    <button key={t.k} className={`tab${activeTab===t.k?' active':''}`} onClick={()=>setActiveTab(t.k)}>{t.l}</button>
                  ))}
                </div>
                {displayItems.length===0 ? <div className="empty">Nothing in this view.</div> : (<>
                  <div className="col-hdr"><span>Status</span><span>Design SKU</span><span>Invoice SKU</span><span className="c-desc">Description</span><span style={{textAlign:'center'}}>D</span><span style={{textAlign:'center'}}>I</span></div>
                  {displayItems.map((item,i)=>{
                    const cfg=STATUS_CFG[item.status]||STATUS_CFG.extra
                    return(
                      <div key={i} className="item-row" style={{background:cfg.bg+'44'}} title={item.note||''}>
                        <span><span className="pill" style={{background:cfg.bg,color:cfg.color}}>{cfg.label}</span></span>
                        <span className="sku">{item.designSku||'—'}</span>
                        <span className="sku">{item.invoiceSku||'—'}</span>
                        <span className="c-desc" style={{fontSize:11,color:'var(--muted)'}}>{(item.description||'').slice(0,32)}</span>
                        <span style={{textAlign:'center',fontWeight:500}}>{item.designQty||0}</span>
                        <span style={{textAlign:'center',fontWeight:500}} className={item.status==='qty_mismatch'?'qty-diff':''}>{item.invoiceQty||0}</span>
                      </div>
                    )
                  })}
                </>)}
              </div>

              {/* Export */}
              <div className="export-row">
                <button className="btn btn-teal" onClick={exportExcel} disabled={exporting}>
                  {exporting?'Exporting...':'⬇ Export Excel Report'}
                </button>
              </div>

            </>)}
          </div>
        </div>
      </div>
    </>
  )
}
