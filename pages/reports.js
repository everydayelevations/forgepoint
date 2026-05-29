import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useUser, UserButton } from '@clerk/nextjs'
import { getAuth, clerkClient } from '@clerk/nextjs/server'
import { getRoleFromUser } from '../lib/auth'

export async function getServerSideProps(ctx) {
  const { userId } = getAuth(ctx.req)
  if (!userId) return { redirect: { destination: '/sign-in', permanent: false } }
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  if (getRoleFromUser(user) !== 'manager') {
    return { redirect: { destination: '/', permanent: false } }
  }
  return { props: {} }
}

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
  box:      <g><path d="M3 7 12 3l9 4-9 4-9-4Z" /><path d="M3 7v10l9 4 9-4V7" /><path d="M12 11v10" /></g>,
  truck:    <g><path d="M14 17V5H2v12" /><path d="M14 9h5l3 3v5h-8" /><circle cx="6.5" cy="17.5" r="1.6" /><circle cx="17.5" cy="17.5" r="1.6" /></g>,
  layers:   <g><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></g>,
  users:    <g><path d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 19v-2a4 4 0 0 0-3-3.9" /></g>,
  chart:    <g><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" /><rect x="13" y="7" width="3" height="10" /></g>,
  close:    <g><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></g>,
  chev:     <polyline points="6 9 12 15 18 9" />,
}

const SPEC_STATUS = {
  match:'match', handed_merge:'match',
  qty_mismatch:'flag', substitution:'flag', extra:'flag',
  missing:'miss',
}

const RANGES = [
  { key:'all',  label:'All time',     days:null },
  { key:'90d',  label:'Last 90 days', days:90   },
  { key:'30d',  label:'Last 30 days', days:30   },
  { key:'7d',   label:'Last 7 days',  days:7    },
]

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

function OverallPill({ status }) {
  const cfg = status === 'APPROVED'
    ? { c: CL.match, bg:'rgba(94,122,75,0.13)', label:'APPROVED' }
    : status === 'HOLD'
      ? { c: CL.miss,  bg:'rgba(166,57,31,0.12)', label:'ON HOLD' }
      : { c: CL.flag, bg:'rgba(191,85,39,0.13)', label:'IN REVIEW' }
  return (
    <span style={{ fontFamily:CL.ui, fontWeight:700, fontSize:11, color:cfg.c, background:cfg.bg,
      padding:'3px 8px', borderRadius:999, whiteSpace:'nowrap', letterSpacing:'0.02em' }}>{cfg.label}</span>
  )
}

const CARD = {
  background: CL.paper, border:`1px solid ${CL.sand}`, borderRadius:14,
  boxShadow:'0 1px 0 rgba(255,255,255,0.6) inset, 0 6px 18px rgba(74,48,25,0.05)',
}

function NavItem({ icon, label, href, active }) {
  const inner = (
    <div style={{
      display:'flex', alignItems:'center', gap:11, padding:'9px 11px', borderRadius:9,
      cursor: active ? 'default' : 'pointer',
      background: active ? 'rgba(191,85,39,0.16)' : 'transparent',
      color: active ? CL.paper : 'rgba(242,231,210,0.62)',
      fontFamily:CL.ui, fontWeight: active ? 700 : 500, fontSize:13.5,
      borderLeft: active ? `2px solid ${CL.ember}` : '2px solid transparent',
      paddingLeft: active ? 11 : 13,
    }}>
      <Icon d={icon} size={17} color={active ? CL.emberSoft : 'rgba(242,231,210,0.5)'} stroke={1.9} />
      <span style={{ whiteSpace:'nowrap' }}>{label}</span>
    </div>
  )
  if (!href) return (
    <div style={{ ...inner.props.style, opacity:0.55 }}>
      <Icon d={icon} size={17} color={'rgba(242,231,210,0.5)'} stroke={1.9} />
      <span style={{ whiteSpace:'nowrap' }}>{label}</span>
      <span style={{ marginLeft:'auto', fontFamily:CL.mono, fontSize:9, color:'rgba(242,231,210,0.45)',
        border:'1px solid rgba(242,231,210,0.18)', borderRadius:4, padding:'1px 5px', letterSpacing:'0.04em' }}>SOON</span>
    </div>
  )
  return <Link href={href} style={{ textDecoration:'none' }}>{inner}</Link>
}

function Sidebar({ active }) {
  const { user } = useUser()
  const role = user?.publicMetadata?.role || 'sales'
  const isManager = role === 'manager'
  return (
    <aside style={{ width:244, flex:'0 0 244px', background:CL.espresso, display:'flex', flexDirection:'column', padding:'22px 16px 18px', position:'sticky', top:0, height:'100vh' }}>
      <Link href="/" style={{ textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'4px 6px 22px' }}>
        <img src="/clavex-key/animated-honey.svg" width={72} height={72} alt="Clavex" style={{ display:'block' }} />
        <span style={{ fontFamily:CL.display, fontWeight:700, fontSize:15, color:CL.paper, letterSpacing:'-0.01em' }}>Clavex</span>
      </Link>

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
        <NavItem icon={ICN.check}  label="Order Verification" href="/"        active={active === 'verify'} />
        {isManager && <NavItem icon={ICN.chart} label="Reports" href="/reports" active={active === 'reports'} />}
        <NavItem icon={ICN.truck}  label="Delivery Scheduling" />
        <NavItem icon={ICN.box}    label="Inventory" />
        <NavItem icon={ICN.users}  label="Vendors" />
      </div>

      <div style={{ marginTop:'auto', display:'flex', alignItems:'center', gap:10, padding:'12px 8px 0',
        borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        <UserButton appearance={{ elements: { avatarBox: { width:34, height:34 } } }} />
        <div style={{ lineHeight:1.2, minWidth:0, flex:1 }}>
          <div style={{ fontFamily:CL.ui, fontWeight:600, fontSize:13, color:CL.paper, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.primaryEmailAddress?.emailAddress : 'Highland Cabinetry'}
          </div>
          <div style={{ fontFamily:CL.ui, fontSize:11.5, color:'rgba(242,231,210,0.5)' }}>
            {user?.publicMetadata?.title || (isManager ? 'Manager' : 'Sales')} · Highland Cabinetry CO
          </div>
        </div>
      </div>
    </aside>
  )
}

function fmtDate(iso) {
  if (!iso) return '–'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })
}

function fmtRate(n) {
  if (n === null || n === undefined) return '–'
  return `${Number(n).toFixed(1)}%`
}

function rateColor(rate) {
  const r = Number(rate)
  if (r === 0) return CL.match
  if (r < 10) return CL.honey
  if (r < 25) return CL.flag
  return CL.miss
}

export default function Reports() {
  const [range, setRange]       = useState('30d')
  const [salesRep, setSalesRep] = useState('')
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [drillId, setDrillId]   = useState(null)

  useEffect(() => {
    const since = (() => {
      const r = RANGES.find(x => x.key === range)
      if (!r?.days) return null
      const d = new Date(); d.setDate(d.getDate() - r.days); return d.toISOString()
    })()
    const params = new URLSearchParams()
    if (salesRep) params.set('salesRep', salesRep)
    if (since)    params.set('since',    since)
    setLoading(true); setError(null)
    fetch(`/api/reports?${params.toString()}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [range, salesRep])

  const lb     = data?.leaderboard || []
  const recent = data?.recent      || []
  const dbDisabled = data && data.enabled === false

  return (
    <>
      <Head>
        <title>Clavex · Reports</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@400;500;600;700&family=Hanken+Grotesk:wght@400;500;600;700;800&family=Spline+Sans+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ display:'flex', minHeight:'100vh', background:CL.sand }}>
        <Sidebar active="reports" />

        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
          <div style={{ padding:'20px 30px 18px', borderBottom:`1px solid ${CL.sand}`, background:CL.paper }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, fontFamily:CL.ui, fontSize:12.5, color:CL.iron, marginBottom:5 }}>
                  <span>Platform</span><span style={{ color:CL.ironLt }}>/</span>
                  <span style={{ color:CL.walnut, fontWeight:600 }}>Reports</span>
                </div>
                <h1 style={{ margin:0, fontFamily:CL.display, fontWeight:700, fontSize:27, color:CL.ink, letterSpacing:'-0.01em' }}>Sales rep performance</h1>
                <div style={{ fontFamily:CL.ui, fontSize:13.5, color:CL.iron, marginTop:6 }}>
                  Issue rate by rep across verified orders. Click a row to drill in.
                </div>
              </div>
              <div style={{ display:'flex', gap:10, paddingTop:4, flex:'0 0 auto' }}>
                <select value={salesRep} onChange={e=>setSalesRep(e.target.value)} style={selectStyle()}>
                  <option value="">All sales reps</option>
                  {(data?.reps || []).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={range} onChange={e=>setRange(e.target.value)} style={selectStyle()}>
                  {RANGES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ flex:1, overflow:'auto', padding:'22px 30px 30px', background:'linear-gradient(180deg,#FBF5EA,#F6EEDD)' }}>

            {dbDisabled && (
              <div style={{ ...CARD, padding:'18px 22px', marginBottom:18, borderColor:CL.honey, background:'rgba(192,144,78,0.08)' }}>
                <div style={{ fontFamily:CL.ui, fontWeight:700, fontSize:14, color:CL.walnut, marginBottom:4 }}>Database not configured</div>
                <div style={{ fontFamily:CL.ui, fontSize:13, color:CL.iron, lineHeight:1.5 }}>
                  Reports needs Neon Postgres. Go to Vercel → Storage → Create Database → Neon, connect it to this project, then redeploy.
                </div>
              </div>
            )}

            {loading && !data && (
              <div style={{ ...CARD, padding:'42px', textAlign:'center', fontFamily:CL.ui, fontSize:13, color:CL.iron }}>Loading reports…</div>
            )}

            {error && (
              <div style={{ background:'rgba(166,57,31,0.08)', border:`1px solid ${CL.miss}`, borderRadius:11, padding:'13px 16px', color:CL.miss, fontFamily:CL.ui, fontSize:13.5, marginBottom:18 }}>
                ⚠ {error}
              </div>
            )}

            {!loading && !dbDisabled && lb.length === 0 && recent.length === 0 && (
              <div style={{ ...CARD, padding:'42px', textAlign:'center', fontFamily:CL.ui, fontSize:14, color:CL.iron }}>
                No verifications in this range yet. Run an order verification and come back.
              </div>
            )}

            {lb.length > 0 && (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:10, margin:'2px 2px 12px' }}>
                  <h2 style={{ margin:0, fontFamily:CL.ui, fontWeight:700, fontSize:16, color:CL.ink }}>Leaderboard</h2>
                  <span style={{ fontFamily:CL.ui, fontSize:12.5, color:CL.iron }}>· highest issue rate first</span>
                </div>
                <Leaderboard rows={lb} />
              </>
            )}

            {recent.length > 0 && (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:10, margin:'24px 2px 12px' }}>
                  <h2 style={{ margin:0, fontFamily:CL.ui, fontWeight:700, fontSize:16, color:CL.ink }}>Recent verifications</h2>
                  <span style={{ fontFamily:CL.ui, fontSize:12.5, color:CL.iron }}>· {recent.length} shown</span>
                </div>
                <RecentTable rows={recent} onOpen={setDrillId} />
              </>
            )}
          </div>
        </div>
      </div>

      {drillId !== null && <Drawer id={drillId} onClose={() => setDrillId(null)} />}
    </>
  )
}

function selectStyle() {
  return {
    height:40, padding:'0 12px', borderRadius:9, border:`1px solid ${CL.sand}`,
    background:CL.paper, color:CL.walnut, fontFamily:CL.ui, fontWeight:600, fontSize:13.5, cursor:'pointer',
  }
}

function Leaderboard({ rows }) {
  const grid = '2fr 0.7fr 0.9fr 0.9fr 0.9fr 1fr'
  return (
    <div style={{ ...CARD, overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:grid, gap:14, padding:'13px 18px',
        background:CL.cream, borderBottom:`1px solid ${CL.sand}`,
        fontFamily:CL.ui, fontWeight:700, fontSize:10.5, color:CL.iron, letterSpacing:'0.07em', textTransform:'uppercase' }}>
        <div>Sales rep</div>
        <div style={{ textAlign:'right' }}>Orders</div>
        <div style={{ textAlign:'right' }}>Lines</div>
        <div style={{ textAlign:'right' }}>Avg issues/order</div>
        <div style={{ textAlign:'right' }}>Missing items</div>
        <div style={{ textAlign:'right' }}>Issue rate</div>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:grid, gap:14, padding:'13px 18px', alignItems:'center',
          borderBottom: i < rows.length - 1 ? `1px solid ${CL.sand}` : 'none' }}>
          <div style={{ fontFamily:CL.ui, fontSize:13.5, fontWeight:600, color: r.sales_rep === '(Unattributed)' ? CL.ironLt : CL.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.sales_rep}</div>
          <div style={{ fontFamily:CL.mono, fontSize:13, textAlign:'right', color:CL.ink }}>{r.orders}</div>
          <div style={{ fontFamily:CL.mono, fontSize:13, textAlign:'right', color:CL.iron }}>{r.total_lines}</div>
          <div style={{ fontFamily:CL.mono, fontSize:13, textAlign:'right', color:CL.ink }}>{r.avg_issues}</div>
          <div style={{ fontFamily:CL.mono, fontSize:13, textAlign:'right', fontWeight: r.total_missing > 0 ? 700 : 400, color: r.total_missing > 0 ? CL.miss : CL.ironLt }}>{r.total_missing}</div>
          <div style={{ fontFamily:CL.mono, fontSize:13.5, textAlign:'right', fontWeight:700, color: rateColor(r.issue_rate) }}>{fmtRate(r.issue_rate)}</div>
        </div>
      ))}
    </div>
  )
}

function RecentTable({ rows, onOpen }) {
  const grid = '100px 1.5fr 1.2fr 0.9fr 0.6fr 0.6fr 0.7fr 1fr'
  return (
    <div style={{ ...CARD, overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:grid, gap:14, padding:'13px 18px',
        background:CL.cream, borderBottom:`1px solid ${CL.sand}`,
        fontFamily:CL.ui, fontWeight:700, fontSize:10.5, color:CL.iron, letterSpacing:'0.07em', textTransform:'uppercase' }}>
        <div>Date</div><div>Job</div><div>Rep</div><div>Vendor</div>
        <div style={{ textAlign:'right' }}>Lines</div>
        <div style={{ textAlign:'right' }}>Issues</div>
        <div style={{ textAlign:'right' }}>Missing</div>
        <div>Status</div>
      </div>
      {rows.map((r, i) => (
        <div key={r.id} onClick={() => onOpen(r.id)}
          style={{ display:'grid', gridTemplateColumns:grid, gap:14, padding:'13px 18px', alignItems:'center', cursor:'pointer',
            borderBottom: i < rows.length - 1 ? `1px solid ${CL.sand}` : 'none', transition:'background .1s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(191,85,39,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <div style={{ fontFamily:CL.mono, fontSize:12.5, color:CL.iron }}>{fmtDate(r.created_at)}</div>
          <div style={{ fontFamily:CL.ui, fontSize:13, color:CL.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.job_address || '–'}</div>
          <div style={{ fontFamily:CL.ui, fontSize:13, color: r.sales_rep ? CL.walnut : CL.ironLt, fontWeight: r.sales_rep ? 600 : 400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.sales_rep || '(Unattributed)'}</div>
          <div style={{ fontFamily:CL.ui, fontSize:13, color:CL.iron, textTransform:'capitalize' }}>{r.vendor}</div>
          <div style={{ fontFamily:CL.mono, fontSize:13, textAlign:'right', color:CL.ink }}>{r.total_lines}</div>
          <div style={{ fontFamily:CL.mono, fontSize:13, textAlign:'right', fontWeight: r.issues > 0 ? 700 : 400, color: r.issues > 0 ? CL.flag : CL.ironLt }}>{r.issues}</div>
          <div style={{ fontFamily:CL.mono, fontSize:13, textAlign:'right', fontWeight: r.missing > 0 ? 700 : 400, color: r.missing > 0 ? CL.miss : CL.ironLt }}>{r.missing}</div>
          <div><OverallPill status={r.overall_status} /></div>
        </div>
      ))}
    </div>
  )
}

function Drawer({ id, onClose }) {
  const [v, setV]           = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    setLoading(true); setError(null)
    fetch(`/api/verifications/${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setV(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const items = v?.report?.items || []
  const reviewCount = (v?.issues ?? 0) - (v?.missing ?? 0)

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(36,26,18,0.45)', zIndex:50,
      display:'flex', justifyContent:'flex-end', backdropFilter:'blur(2px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:'min(820px, 92vw)', height:'100vh', background:CL.paper, overflow:'auto',
        boxShadow:'-12px 0 40px rgba(36,26,18,0.25)',
      }}>
        <div style={{ position:'sticky', top:0, background:CL.paper, borderBottom:`1px solid ${CL.sand}`, padding:'18px 24px', display:'flex', alignItems:'center', gap:12, zIndex:1 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:CL.ui, fontSize:12, color:CL.iron, marginBottom:3 }}>Verification #{id} · {v?.created_at ? fmtDate(v.created_at) : ''}</div>
            <div style={{ fontFamily:CL.display, fontSize:20, fontWeight:700, color:CL.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v?.job_address || 'Verification'}</div>
          </div>
          {v?.overall_status && <OverallPill status={v.overall_status} />}
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', padding:6, color:CL.iron }}>
            <Icon d={ICN.close} size={20} color={CL.iron} stroke={2} />
          </button>
        </div>

        <div style={{ padding:'18px 24px' }}>
          {loading && <div style={{ fontFamily:CL.ui, fontSize:13, color:CL.iron, padding:'30px 0', textAlign:'center' }}>Loading…</div>}
          {error && <div style={{ color:CL.miss, fontFamily:CL.ui, fontSize:13 }}>⚠ {error}</div>}

          {v && !loading && (
            <>
              <div style={{ display:'flex', flexWrap:'wrap', gap:18, fontFamily:CL.ui, fontSize:13, color:CL.iron, marginBottom:18 }}>
                {v.sales_rep && <span>Rep: <strong style={{ color:CL.walnut }}>{v.sales_rep}</strong></span>}
                <span>Vendor: <strong style={{ color:CL.walnut, textTransform:'capitalize' }}>{v.vendor}</strong></span>
                {v.invoice_number && <span>Invoice: <strong style={{ color:CL.walnut, fontFamily:CL.mono }}>{v.invoice_number}</strong></span>}
                {v.so_number && <span>SO: <strong style={{ color:CL.walnut, fontFamily:CL.mono }}>{v.so_number}</strong></span>}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:18 }}>
                <Stat label="Total lines"  value={v.total_lines} color={CL.ink}   />
                <Stat label="Matched"      value={v.matched}     color={CL.match} />
                <Stat label="Needs review" value={reviewCount}   color={CL.flag}  />
                <Stat label="Missing"      value={v.missing}     color={CL.miss}  />
              </div>

              <h3 style={{ fontFamily:CL.ui, fontWeight:700, fontSize:14, color:CL.ink, marginBottom:10 }}>Line items</h3>
              <ItemsTable items={items} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ background:CL.cream, border:`1px solid ${CL.sand}`, borderRadius:11, padding:'11px 13px' }}>
      <div style={{ fontFamily:CL.ui, fontSize:11, fontWeight:600, color:CL.iron, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
      <div style={{ fontFamily:CL.display, fontSize:22, fontWeight:700, color, marginTop:4, lineHeight:1 }}>{value ?? 0}</div>
    </div>
  )
}

function ItemsTable({ items }) {
  const sorted = [...items].sort((a, b) => {
    const order = { miss:0, flag:1, match:2 }
    return (order[SPEC_STATUS[a.status]] ?? 9) - (order[SPEC_STATUS[b.status]] ?? 9)
  })
  const grid = '1fr 1.8fr 1fr 0.5fr 0.5fr 1fr'
  return (
    <div style={{ border:`1px solid ${CL.sand}`, borderRadius:11, overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:grid, gap:10, padding:'10px 14px', background:CL.cream,
        fontFamily:CL.ui, fontWeight:700, fontSize:10, color:CL.iron, letterSpacing:'0.07em', textTransform:'uppercase' }}>
        <div>Design</div><div>Description</div><div>Invoice</div>
        <div style={{ textAlign:'center' }}>D</div><div style={{ textAlign:'center' }}>I</div><div>Status</div>
      </div>
      {sorted.length === 0 && (
        <div style={{ padding:'18px', textAlign:'center', fontFamily:CL.ui, fontSize:12.5, color:CL.iron }}>No items.</div>
      )}
      {sorted.map((r, i) => {
        const status = SPEC_STATUS[r.status] || 'flag'
        return (
          <div key={i} style={{ display:'grid', gridTemplateColumns:grid, gap:10, padding:'10px 14px', alignItems:'center',
            borderTop:`1px solid ${CL.sand}`, fontSize:12 }}>
            <div style={{ fontFamily:CL.mono, color:CL.ink, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.designSku || '–'}</div>
            <div style={{ fontFamily:CL.ui, color:CL.walnut, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.description || '–'}</div>
            <div style={{ fontFamily:CL.mono, color: r.invoiceSku ? CL.oak : CL.ironLt, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.invoiceSku || '–'}</div>
            <div style={{ fontFamily:CL.mono, textAlign:'center', color:CL.ink }}>{r.designQty ?? 0}</div>
            <div style={{ fontFamily:CL.mono, textAlign:'center', color: status === 'miss' ? CL.ironLt : CL.ink }}>{r.invoiceQty ?? 0}</div>
            <div><StatusChip s={status} /></div>
          </div>
        )
      })}
    </div>
  )
}
