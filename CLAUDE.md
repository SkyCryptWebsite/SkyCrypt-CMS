# SkyCrypt-CMS

Payload CMS v3 instance powering newsroom posts and announcements for SkyCrypt
(https://sky.shiiyu.moe — a Hypixel SkyBlock profile viewer built with SvelteKit).
This CMS is headless: the admin UI lives here, content is served via REST,
the SvelteKit app at sky.shiiyu.moe consumes it.

This project uses the Payload CMS skill at `.claude/skills/payload/`.
Start with `.claude/skills/payload/SKILL.md` for a quick reference, then see
`.claude/skills/payload/reference/` for detailed docs.

## Architecture

- This service: cms.shiiyu.moe (admin: /admin, REST: /api/\*)
- Consumer: sky.shiiyu.moe (SvelteKit, separate repo: SkyCrypt-Frontend)
  Fetches server-side via Payload REST.
- Database: Postgres (separate database from the consumer's auth DB)
- Template: started from `blank` (NOT `website` — we don't ship a Next.js frontend)
- Media: local volume mounted at `/app/media`

## Why Payload (over Directus/Strapi/Keystone)

- Best-in-class Lexical block editor
- TypeScript-first, code-first schema
- MIT, mature, active
- Next.js coupling is contained — consumer never sees it

## Contract the SvelteKit consumer relies on

**DO NOT change these field names/shapes without coordinating with the consumer repo.**

Posts collection (`slug: "posts"`) — fields consumer reads:

- `id: string`
- `title: string`
- `slug: string` (unique, indexed — used in URLs)
- `excerpt: string` (≤280 chars, optional — used for list view + OG description)
- `heroImage: upload→media | null` (consumer expects `{ url, alt, width, height, sizes }` after `depth=1+`)
- `body: Block[]` with `blockType` ∈ `"image" | "code" | "callout" | "embed" | "richText"`
- `publishedAt: date` (ISO)
- `_status: "draft" | "published"` (auto-injected by Payload via `versions.drafts: true`)
- `author: relationship→users` (populates to `{ id, name }` — `email` is field-access-gated for anonymous readers)
- `createdAt`, `updatedAt`

Block shapes:

- `image`: { media: rel→media, caption?, alt? }
- `code`: { language: select(ts|js|go|bash|json|sql|svelte), code: textarea }
- `callout`: { variant: select(info|warning|danger|success), title?, body: richText }
- `embed`: { url, provider: select(youtube|twitter|discord|generic) }
- `richText`: plain Lexical rich-text block (optional, paragraphs between blocks) — `{ content: richText }`

## REST shapes (Payload default — don't override)

- List: `GET /api/posts?where[_status][equals]=published&sort=-publishedAt&depth=1`
  returns `{ docs: Post[], totalPages, page, totalDocs }`
- Detail: `GET /api/posts?where[slug][equals]={slug}&limit=1&depth=2`
- Drafts: `?draft=true&depth=2` with `Authorization: users API-Key <key>`

Anonymous reads are filtered to `_status: 'published'` by collection-level access — the explicit `where[_status]` filter in the URL is belt-and-suspenders, not a requirement.

## CORS / CSRF

`payload.config.ts` allows `https://sky.shiiyu.moe` (production) and `http://localhost:5173` (SvelteKit dev). Needed for browser-side preview fetches.

## Draft preview

Payload admin "Preview" button opens:
`${CONSUMER_URL}/newsroom/{slug}?preview=1&token=${CMS_PREVIEW_TOKEN}`

The consumer validates the token, then re-fetches with `?draft=true`. Token is shared via env (`CMS_PREVIEW_TOKEN` here, same value on the consumer).

## Revalidation webhook

Posts `afterChange` + `afterDelete` hooks POST to `${CONSUMER_URL}/api/cms-revalidate` with header `X-Revalidate-Secret: ${CMS_REVALIDATE_SECRET}` and JSON body:

```
{ slug, operation: 'create'|'update'|'delete', status: 'draft'|'published', previousSlug?: string }
```

- Fire-and-forget on the CMS side with a 3s `AbortSignal.timeout`; failures are logged but never block admin save UX.
- Skipped when the post is a never-published draft (saves on drafts that have never been live emit nothing).
- Skipped when `req.context.disableRevalidate` is set (seed scripts, migrations).
- `previousSlug` is only set on rename so the consumer can bust both cache keys.

Consumer-side: `src/routes/api/cms-revalidate/+server.ts` validates the secret (constant-time compare), busts an in-memory map cache (`src/lib/shared/api/cms-cache.ts`) by key (`post:<slug>` and `list:*`), and returns `{ busted: [...] }`.

Cloudflare cache purge API is the natural next iteration (true edge invalidation) — not in scope here.

## Don't

- Don't rename fields above without coordinating
- Don't add a public-facing Next.js frontend — headless only
- Don't expose admin or write-endpoints publicly
- Don't import `@payloadcms/richtext-lexical/react` into the consumer (would bring React into SvelteKit)
- Don't declare `_status` as a field — Payload auto-injects it from `versions.drafts: true`

## Related repo

SvelteKit consumer + integration plan:
`~/Projects/SkyCrypt/SkyCrypt-Frontend`
Plan file: `~/.claude/plans/i-wanna-add-payload-snug-wind.md`
