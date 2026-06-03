import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { openapi, scalar } from 'payload-oapi'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,
  cors: [process.env.CONSUMER_URL, 'http://localhost:5173'].filter((origin): origin is string =>
    Boolean(origin),
  ),
  csrf: [process.env.CONSUMER_URL].filter((origin): origin is string => Boolean(origin)),
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Posts],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    openapi({
      metadata: {
        title: 'SkyCrypt Payload API',
        description: 'API documentation for the Payload CMS application used by SkyCrypt.',
        version: '1.0.0',
      },
      openapiVersion: '3.1',
    }),
    scalar({}),
  ],
})
