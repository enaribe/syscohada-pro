import { betterAuth } from 'better-auth'
import { prisma } from '@/server/db/prisma'

export const auth = betterAuth({
  database: {
    type: 'postgresql',
    url: process.env.DATABASE_URL ?? '',
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
})

export type Session = typeof auth.$Infer.Session
