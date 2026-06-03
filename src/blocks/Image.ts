import type { Block } from 'payload'

export const ImageBlock: Block = {
  slug: 'image',
  fields: [
    { name: 'media', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
    { name: 'alt', type: 'text' },
  ],
}
