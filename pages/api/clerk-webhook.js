import { Webhook } from 'svix'
import { clerkClient } from '@clerk/nextjs/server'
import { findRepByEmail } from '../../lib/roster'

export const config = { api: { bodyParser: false } }

async function readRaw(req) {
  const chunks = []
  for await (const c of req) chunks.push(c)
  return Buffer.concat(chunks).toString('utf8')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    console.error('CLERK_WEBHOOK_SECRET is not set')
    return res.status(500).json({ error: 'Webhook secret not configured' })
  }

  const body = await readRaw(req)
  const headers = {
    'svix-id':        req.headers['svix-id'],
    'svix-timestamp': req.headers['svix-timestamp'],
    'svix-signature': req.headers['svix-signature'],
  }

  let evt
  try {
    evt = new Webhook(secret).verify(body, headers)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  try {
    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      const user = evt.data
      const primaryEmail =
        user.email_addresses?.find(e => e.id === user.primary_email_address_id)?.email_address
        || user.email_addresses?.[0]?.email_address
        || null

      const rep = findRepByEmail(primaryEmail)
      const existing = user.public_metadata || {}

      if (rep && existing.role !== rep.role) {
        const client = await clerkClient()
        await client.users.updateUserMetadata(user.id, {
          publicMetadata: { ...existing, role: rep.role, fullName: rep.name },
        })
        console.log(`Auto-assigned role '${rep.role}' to ${primaryEmail} (${rep.name})`)
      } else if (!rep) {
        console.log(`No roster match for ${primaryEmail}; default 'sales' role applies`)
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return res.status(500).json({ error: err.message })
  }

  return res.status(200).json({ ok: true })
}
