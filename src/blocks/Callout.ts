import type { Block } from 'payload'

export const CalloutBlock: Block = {
  slug: 'callout',
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'info',
      options: ['info', 'warning', 'danger', 'success'],
    },
    { name: 'title', type: 'text' },
    { name: 'body', type: 'richText', required: true },
  ],
}
