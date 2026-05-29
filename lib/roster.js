// Highland Cabinetry CO sales team roster.
// Source of truth for rep identity, role-based access, and email lookup.
// Update this list when teammates join / leave / change titles.
//
// role: 'manager' (sees Reports) or 'sales' (Order Verification only)
// title: human-readable title for UI display; can differ from role
// initials: how the name appears on PDFs so we can map "DF" → David Foster

export const ROSTER = [
  // salesPerson=false: present in the org and in Clerk, but never runs sales orders,
  // so the rep resolver skips them entirely. A stray match on their name/initials
  // would be a data error, not an attribution.
  { name:'Jason Fricka',         email:'jfricka2284@gmail.com',             role:'manager', title:'HR / AI Architect',        initials:[],         salesPerson:false },
  { name:'David Foster',         email:'david@highlandcabinetryco.com',     role:'manager', title:'VP Sales and Operations',  initials:[],         salesPerson:false },
  { name:'Chase Rousseau',       email:'chase@highlandcabinetryco.com',     role:'manager', title:'Manager',                  initials:[],         salesPerson:false },
  { name:'Melanie Nguyen',       email:'mel@highlandcabinetryco.com',       role:'sales',   title:'Sales',                    initials:['MN'],     salesPerson:true  },
  { name:'Andreina Aguayo',      email:'andreina@highlandcabinetryco.com',  role:'sales',   title:'Sales',                    initials:['AA'],     salesPerson:true  },
  { name:'Beth Yackel',          email:'beth@highlandcabinetryco.com',      role:'sales',   title:'Sales',                    initials:['BY'],     salesPerson:true  },
  { name:'Nicholas Truss',       email:'nicholas@highlandcabinetryco.com',  role:'sales',   title:'Sales',                    initials:['NT'],     salesPerson:true  },
  { name:'Sarah Thompson',       email:'sarah@highlandcabinetryco.com',     role:'sales',   title:'Sales',                    initials:['ST'],     salesPerson:true  },
  { name:'Jordan Mitchell',      email:'jordan@highlandcabinetryco.com',    role:'sales',   title:'Sales',                    initials:['JM'],     salesPerson:true  },
  { name:'Reyna Abad-Thompson',  email:'reyna@highlandcabinetryco.com',     role:'sales',   title:'Sales',                    initials:['RAT','RA'], salesPerson:true },
  { name:'Stephen Armijo',       email:'stephen@highlandcabinetryco.com',   role:'sales',   title:'Sales',                    initials:['SA'],     salesPerson:true  },
  { name:'Tyler Sylvester',      email:'tylers@highlandcabinetryco.com',    role:'sales',   title:'Sales',                    initials:['TS'],     salesPerson:true  },
]

const norm = (s) => (s || '').toString().trim().toUpperCase().replace(/[.\s,_/\\-]+/g, '')

export function findRepByEmail(email) {
  if (!email) return null
  const normalized = email.toString().trim().toLowerCase()
  return ROSTER.find(r => r.email.toLowerCase() === normalized) || null
}

export function resolveRep(raw) {
  if (!raw) return null
  const n = norm(raw)
  if (!n) return null

  const sellers = ROSTER.filter(r => r.salesPerson !== false)

  for (const rep of sellers) {
    for (const init of rep.initials) {
      if (norm(init) === n) return rep
    }
  }

  const lower = raw.toString().toLowerCase()
  for (const rep of sellers) {
    if (rep.name.toLowerCase() === lower) return rep
  }

  for (const rep of sellers) {
    const parts = rep.name.toLowerCase().split(/\s+/).filter(p => p.length > 1)
    if (parts.length && parts.every(p => lower.includes(p))) return rep
  }

  for (const rep of sellers) {
    const [first, ...rest] = rep.name.split(/\s+/)
    const last = rest[rest.length - 1] || ''
    const compact = (first[0] + last).toLowerCase()
    if (norm(compact) === n) return rep
  }

  return null
}
