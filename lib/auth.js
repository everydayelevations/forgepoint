import { getAuth, clerkClient } from '@clerk/nextjs/server'

export function getRoleFromUser(user) {
  return user?.publicMetadata?.role || 'sales'
}

export async function requireAuth(req, allowedRoles) {
  const { userId } = getAuth(req)
  if (!userId) return { ok: false, status: 401, error: 'Not signed in' }
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const role = getRoleFromUser(user)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return { ok: false, status: 403, error: 'Insufficient permissions' }
  }
  return { ok: true, userId, role, user }
}
