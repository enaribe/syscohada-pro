import { initTRPC, TRPCError } from '@trpc/server'
import type { Role } from '@/generated/prisma/enums'
// Context creation options
import { createEntreprisePrisma, prisma } from '@/server/db/prisma'

export type TRPCContext = {
  session: { userId: string; tenantId: string } | null
  user: { id: string; email: string; nom: string; role: Role; tenantId: string } | null
  entrepriseId: string
  exerciceId: string
  role: Role | null
  db: ReturnType<typeof createEntreprisePrisma>
  rawDb: typeof prisma
}

export async function createContext(opts: {
  req: Request
  resHeaders: Headers
}): Promise<TRPCContext> {
  const sessionToken =
    getCookie(opts.req, 'better-auth.session_token') ??
    getCookie(opts.req, '__Secure-better-auth.session_token')

  let session: TRPCContext['session'] = null
  let user: TRPCContext['user'] = null
  let entrepriseId = ''
  let exerciceId = ''

  if (sessionToken) {
    const dbUser = await prisma.user.findFirst({
      where: { id: sessionToken, actif: true },
    })
    if (dbUser) {
      user = {
        id: dbUser.id,
        email: dbUser.email,
        nom: dbUser.nom,
        role: dbUser.role,
        tenantId: dbUser.tenantId,
      }
      session = { userId: dbUser.id, tenantId: dbUser.tenantId }
      entrepriseId = dbUser.tenantId
    }
  }

  const exerciceIdHeader = opts.req.headers.get('x-exercice-id')
  if (exerciceIdHeader) {
    exerciceId = exerciceIdHeader
  } else if (entrepriseId) {
    const exerciceOuvert = await prisma.exercice.findFirst({
      where: { tenantId: entrepriseId, statut: 'OUVERT' },
      orderBy: { annee: 'desc' },
    })
    if (exerciceOuvert) {
      exerciceId = exerciceOuvert.id
    }
  }

  const db = entrepriseId ? createEntreprisePrisma(entrepriseId) : createEntreprisePrisma('')

  return {
    session,
    user,
    entrepriseId,
    exerciceId,
    role: user?.role ?? null,
    db,
    rawDb: prisma,
  }
}

function getCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return undefined
  const cookies = cookieHeader.split(';').map((c) => c.trim())
  const cookie = cookies.find((c) => c.startsWith(`${name}=`))
  return cookie?.split('=')[1]
}

const t = initTRPC.context<TRPCContext>().create()

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory
