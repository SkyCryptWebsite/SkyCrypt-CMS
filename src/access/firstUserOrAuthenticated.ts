import type { Access } from 'payload'

export const firstUserOrAuthenticated: Access = async ({ req }) => {
  if (req.user) return true
  const { totalDocs } = await req.payload.count({ collection: 'users' })
  return totalDocs === 0
}
