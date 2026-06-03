const normalize = (url: string): string => url.trim().replace(/\/+$/, '')

/**
 * Frontend "consumer" origins that read from this CMS (e.g. production
 * `sky.shiiyu.moe` and the `cupcake.shiiyu.moe` beta), configured via the
 * comma-separated `CONSUMER_URLS` env var. Trailing slashes are stripped and
 * blank entries dropped.
 */
export const getConsumerUrls = (): string[] =>
  (process.env.CONSUMER_URLS ?? '')
    .split(',')
    .map(normalize)
    .filter(Boolean)

/**
 * The consumer used for admin preview links, set explicitly via
 * `PRIMARY_CONSUMER_URL` (should be one of `CONSUMER_URLS`). Falls back to the
 * first consumer when unset.
 */
export const getPrimaryConsumerUrl = (): string | undefined => {
  const primary = process.env.PRIMARY_CONSUMER_URL
  return (primary && normalize(primary)) || getConsumerUrls()[0]
}
