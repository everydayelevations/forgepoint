// Highland Cabinetry CO sales team roster.
// Source of truth for rep name normalization and email lookup.
// Update this list when teammates join / leave.

export const ROSTER = [
  { name:'David Foster',         email:'david@highlandcabinetryco.com',     role:'manager', initials:['DF'] },
  { name:'Chase Rousseau',       email:'chase@highlandcabinetryco.com',     role:'manager', initials:['CR'] },
  { name:'Melanie Nguyen',       email:'mel@highlandcabinetryco.com',       role:'sales',   initials:['MN'] },
  { name:'Andreina Aguayo',      email:'andreina@highlandcabinetryco.com',  role:'sales',   initials:['AA'] },
  { name:'Beth Yackel',          email:'beth@highlandcabinetryco.com',      role:'sales',   initials:['BY'] },
  { name:'Nicholas Truss',       email:'nicholas@highlandcabinetryco.com',  role:'sales',   initials:['NT'] },
  { name:'Sarah Thompson',       email:'sarah@highlandcabinetryco.com',     role:'sales',   initials:['ST'] },
  { name:'Jordan Mitchell',      email:'jordan@highlandcabinetryco.com',    role:'sales',   initials:['JM'] },
  { name:'Reyna Abad-Thompson',  email:'reyna@highlandcabinetryco.com',     role:'sales',   initials:['RAT','RA'] },
  { name:'Stephen Armijo',       email:'stephen@highlandcabinetryco.com',   role:'sales',   initials:['SA'] },
  { name:'Tyler Sylvester',      email:'tylers@highlandcabinetryco.com',    role:'sales',   initials:['TS'] },
]

const norm = (s) => (s || '').toString().trim().toUpperCase().replace(/[.\s,_/\\-]+/g, '')

export function resolveRep(raw) {
  if (!raw) return null
  const n = norm(raw)
  if (!n) return null

  for (const rep of ROSTER) {
    for (const init of rep.initials) {
      if (norm(init) === n) return rep
    }
  }

  const lower = raw.toString().toLowerCase()
  for (const rep of ROSTER) {
    if (rep.name.toLowerCase() === lower) return rep
  }

  for (const rep of ROSTER) {
    const parts = rep.name.toLowerCase().split(/\s+/).filter(p => p.length > 1)
    if (parts.length && parts.every(p => lower.includes(p))) return rep
  }

  for (const rep of ROSTER) {
    const [first, ...rest] = rep.name.split(/\s+/)
    const last = rest[rest.length - 1] || ''
    const compact = (first[0] + last).toLowerCase()
    if (norm(compact) === n) return rep
  }

  return null
}
