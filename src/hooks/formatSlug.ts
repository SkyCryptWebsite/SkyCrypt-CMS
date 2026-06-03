import type { FieldHook } from 'payload'

import { slugify } from '@/utilities/slugify'

export const formatSlug: FieldHook = ({ value, originalDoc, data }) => {
  if (typeof value === 'string' && value.length) return slugify(value)
  const fallback = data?.title ?? originalDoc?.title
  return typeof fallback === 'string' ? slugify(fallback) : value
}
