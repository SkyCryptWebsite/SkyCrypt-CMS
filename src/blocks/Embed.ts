import type { Block, Validate } from 'payload'

const isUrl: Validate<string> = (v) => {
  if (typeof v !== 'string') return 'URL required'
  try {
    new URL(v)
    return true
  } catch {
    return 'Invalid URL'
  }
}

export const EmbedBlock: Block = {
  slug: 'embed',
  fields: [
    { name: 'url', type: 'text', required: true, validate: isUrl },
    {
      name: 'provider',
      type: 'select',
      required: true,
      defaultValue: 'generic',
      options: ['youtube', 'twitter', 'discord', 'generic'],
    },
  ],
}
