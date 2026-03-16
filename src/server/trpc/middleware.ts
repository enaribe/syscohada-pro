import { TRPCError } from '@trpc/server'
import type { Role } from '@/generated/prisma/enums'
import { publicProcedure } from './context'

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Non authentifié' })
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  })
})

export const exerciceProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.exerciceId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Aucun exercice ouvert — veuillez créer ou sélectionner un exercice',
    })
  }
  return next({
    ctx: {
      ...ctx,
      exerciceId: ctx.exerciceId,
    },
  })
})

export function roleGuard(allowedRoles: Role[]) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    if (!ctx.user || !allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Accès réservé aux rôles : ${allowedRoles.join(', ')}`,
      })
    }
    return next({ ctx })
  })
}
