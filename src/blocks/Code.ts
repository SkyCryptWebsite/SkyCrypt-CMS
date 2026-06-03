import type { Block } from 'payload'

export const CodeBlock: Block = {
  slug: 'code',
  fields: [
    {
      name: 'language',
      type: 'select',
      required: true,
      defaultValue: 'ts',
      options: ['ts', 'js', 'go', 'bash', 'json', 'sql', 'svelte'],
    },
    { name: 'code', type: 'textarea', required: true },
  ],
}
