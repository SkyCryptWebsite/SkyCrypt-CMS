import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { publicReadPublished } from '@/access/publicReadPublished'
import { blocks } from '@/blocks'
import { formatSlug } from '@/hooks/formatSlug'
import { revalidatePostChange, revalidatePostDelete } from '@/hooks/revalidateConsumer'
import { setAuthorOnCreate } from '@/hooks/setAuthorOnCreate'
import { getPrimaryConsumerUrl } from '@/utilities/consumers'

const previewUrl = (data: { slug?: string | null } | undefined) =>
  `${getPrimaryConsumerUrl() ?? ''}/newsroom/${data?.slug}?preview=1&token=${process.env.CMS_PREVIEW_TOKEN}`

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', '_status', 'publishedAt'],
    livePreview: { url: ({ data }) => previewUrl(data) },
    preview: (data) => previewUrl(data),
  },
  access: {
    read: publicReadPublished,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    drafts: { autosave: true, schedulePublish: true },
    maxPerDoc: 50,
  },
  timestamps: true,
  hooks: {
    beforeValidate: [setAuthorOnCreate],
    afterChange: [revalidatePostChange],
    afterDelete: [revalidatePostDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
      hooks: { beforeValidate: [formatSlug] },
    },
    { name: 'excerpt', type: 'textarea', maxLength: 280 },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'news',
      options: [
        { label: 'Announcement', value: 'announcement' },
        { label: 'News', value: 'news' },
        { label: 'Update', value: 'update' },
        { label: 'Changelog', value: 'changelog' },
        { label: 'Guide', value: 'guide' },
        { label: 'Event', value: 'event' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      admin: { description: 'Optional free-form tags. Press Enter after each.' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Pin to top of /newsroom regardless of publishedAt.',
      },
    },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'body', type: 'blocks', blocks },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { position: 'sidebar' },
    },
  ],
}
