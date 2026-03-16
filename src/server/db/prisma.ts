import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

const connectionString = process.env.DATABASE_URL ?? ''

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export function createEntreprisePrisma(tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({
          args,
          query,
        }: {
          args: { where?: Record<string, unknown> }
          query: (args: unknown) => Promise<unknown>
        }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async findFirst({
          args,
          query,
        }: {
          args: { where?: Record<string, unknown> }
          query: (args: unknown) => Promise<unknown>
        }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async create({
          args,
          query,
        }: {
          args: { data: Record<string, unknown> }
          query: (args: unknown) => Promise<unknown>
        }) {
          args.data = { ...args.data, tenantId }
          return query(args)
        },
        async update({
          args,
          query,
        }: {
          args: { where: Record<string, unknown> }
          query: (args: unknown) => Promise<unknown>
        }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async delete({
          args,
          query,
        }: {
          args: { where: Record<string, unknown> }
          query: (args: unknown) => Promise<unknown>
        }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        },
      },
    },
  })
}
