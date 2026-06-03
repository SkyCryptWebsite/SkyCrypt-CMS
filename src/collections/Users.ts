import type { CollectionConfig, FieldAccess, TextFieldSingleValidation } from 'payload'

import { authenticated } from '@/access/authenticated'
import { firstUserOrAuthenticated } from '@/access/firstUserOrAuthenticated'

const readEmail: FieldAccess = ({ req: { user } }) => Boolean(user)

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email'],
  },
  auth: {
    useAPIKey: true,
  },
  access: {
    read: () => true,
    create: firstUserOrAuthenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'displayName',
      type: 'text',
      label: 'Display name',
      admin: {
        description:
          'Public-facing name shown on /newsroom (typically the Minecraft username). Falls back to `name` when empty.',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      access: { read: readEmail },
    },
    {
      name: 'mcUuid',
      type: 'text',
      label: 'Minecraft UUID',
      admin: {
        description:
          'Optional. Drives the Minecraft head avatar on /newsroom. 32-hex with or without dashes.',
      },
      validate: ((value) => {
        if (!value) return true
        const n = String(value).replace(/-/g, '').toLowerCase()
        return (
          /^[0-9a-f]{32}$/.test(n) ||
          'Must be a valid Minecraft UUID (32 hex chars, with or without dashes)'
        )
      }) as TextFieldSingleValidation,
    },
  ],
}
