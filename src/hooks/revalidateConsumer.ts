import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  Payload,
} from 'payload'

import type { Post } from '@/payload-types'

type RevalidateBody = {
  slug: string
  operation: 'create' | 'update' | 'delete'
  status: 'draft' | 'published'
  previousSlug?: string
}

const notifyConsumer = (payload: Payload, body: RevalidateBody): void => {
  const url = process.env.CONSUMER_URL
  const secret = process.env.CMS_REVALIDATE_SECRET
  if (!url || !secret) {
    payload.logger.warn('Revalidate skipped: CONSUMER_URL or CMS_REVALIDATE_SECRET unset')
    return
  }
  void fetch(`${url}/api/cms-revalidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Revalidate-Secret': secret,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(3000),
  }).then(
    (res) => {
      if (!res.ok) payload.logger.warn(`Revalidate ${body.slug}: ${res.status}`)
    },
    (err: Error) => payload.logger.warn(`Revalidate ${body.slug} failed: ${err.message}`),
  )
}

export const revalidatePostChange: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (req.context?.disableRevalidate) return doc
  const status = doc._status === 'published' ? 'published' : 'draft'
  const prevStatus = previousDoc?._status === 'published' ? 'published' : 'draft'
  if (status !== 'published' && prevStatus !== 'published') return doc
  notifyConsumer(req.payload, {
    slug: doc.slug ?? '',
    operation,
    status,
    previousSlug:
      previousDoc?.slug && previousDoc.slug !== doc.slug ? previousDoc.slug : undefined,
  })
  return doc
}

export const revalidatePostDelete: CollectionAfterDeleteHook<Post> = ({ doc, req }) => {
  if (req.context?.disableRevalidate) return doc
  if (doc._status !== 'published') return doc
  notifyConsumer(req.payload, {
    slug: doc.slug ?? '',
    operation: 'delete',
    status: 'published',
  })
  return doc
}
