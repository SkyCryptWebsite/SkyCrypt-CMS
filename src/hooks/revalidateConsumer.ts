import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  Payload,
} from 'payload'

import type { Post } from '@/payload-types'
import { getConsumerUrls } from '@/utilities/consumers'

type RevalidateBody = {
  slug: string
  operation: 'create' | 'update' | 'delete'
  status: 'draft' | 'published'
  previousSlug?: string
}

const notifyConsumers = (payload: Payload, body: RevalidateBody): void => {
  const urls = getConsumerUrls()
  const secret = process.env.CMS_REVALIDATE_SECRET
  if (!urls.length || !secret) {
    payload.logger.warn('Revalidate skipped: CONSUMER_URLS or CMS_REVALIDATE_SECRET unset')
    return
  }
  for (const url of urls) {
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
        if (!res.ok) payload.logger.warn(`Revalidate ${body.slug} -> ${url}: ${res.status}`)
      },
      (err: Error) =>
        payload.logger.warn(`Revalidate ${body.slug} -> ${url} failed: ${err.message}`),
    )
  }
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
  notifyConsumers(req.payload, {
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
  notifyConsumers(req.payload, {
    slug: doc.slug ?? '',
    operation: 'delete',
    status: 'published',
  })
  return doc
}
