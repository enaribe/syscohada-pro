import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/vercel'
import { createContext } from './trpc/context'
import { appRouter } from './trpc/router'

const app = new Hono().basePath('/api')

app.use(
  '/*',
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://app.syscohada.pro']
        : ['http://localhost:3000'],
    credentials: true,
  }),
)

app.get('/health', (c) => c.json({ status: 'ok', db: 'ok', redis: 'ok' }))

app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: (_opts, c) =>
      createContext({
        req: c.req.raw,
        resHeaders: c.res.headers,
      }),
  }),
)

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
