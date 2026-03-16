import { TRPCError } from '@trpc/server'
import { hashSync } from 'bcryptjs'
import { z } from 'zod/v4'
import { createTRPCRouter } from '../context'
import { roleGuard } from '../middleware'

type UserResult = {
  id: string
  email: string
  nom: string
  prenom: string | null
  role: string
  tenantId: string
  actif: boolean
  createdAt: Date
}

type InvitationResult = {
  id: string
  email: string
  role: string
  token: string
  tenantId: string
  expiresAt: Date
  accepte: boolean
  createdAt: Date
}

export const usersRouter = createTRPCRouter({
  list: roleGuard(['ADMIN']).query(async ({ ctx }): Promise<UserResult[]> => {
    return ctx.rawDb.user.findMany({
      where: { tenantId: ctx.entrepriseId },
      orderBy: { createdAt: 'asc' },
    })
  }),

  updateRole: roleGuard(['ADMIN'])
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(['ADMIN', 'EXPERT', 'COMPTABLE', 'AUDITEUR', 'DIRIGEANT', 'COMMISSAIRE']),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<UserResult> => {
      const user = await ctx.rawDb.user.findFirst({
        where: { id: input.userId, tenantId: ctx.entrepriseId },
      })
      if (!user) throw new TRPCError({ code: 'NOT_FOUND' })

      return ctx.rawDb.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      })
    }),

  toggleActif: roleGuard(['ADMIN'])
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }): Promise<UserResult> => {
      const user = await ctx.rawDb.user.findFirst({
        where: { id: input.userId, tenantId: ctx.entrepriseId },
      })
      if (!user) throw new TRPCError({ code: 'NOT_FOUND' })
      if (user.id === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Vous ne pouvez pas vous désactiver' })
      }

      return ctx.rawDb.user.update({
        where: { id: input.userId },
        data: { actif: !user.actif },
      })
    }),

  invite: roleGuard(['ADMIN'])
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(['EXPERT', 'COMPTABLE', 'AUDITEUR', 'DIRIGEANT', 'COMMISSAIRE']),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<InvitationResult> => {
      const existing = await ctx.rawDb.user.findUnique({ where: { email: input.email } })
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Un utilisateur avec cet email existe déjà',
        })
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      return ctx.rawDb.invitation.create({
        data: {
          email: input.email,
          role: input.role,
          tenantId: ctx.entrepriseId,
          expiresAt,
        },
      })
    }),

  listInvitations: roleGuard(['ADMIN']).query(async ({ ctx }): Promise<InvitationResult[]> => {
    return ctx.rawDb.invitation.findMany({
      where: { tenantId: ctx.entrepriseId, accepte: false },
      orderBy: { createdAt: 'desc' },
    })
  }),

  acceptInvitation: roleGuard([
    'ADMIN',
    'EXPERT',
    'COMPTABLE',
    'AUDITEUR',
    'DIRIGEANT',
    'COMMISSAIRE',
  ])
    .input(
      z.object({
        token: z.string(),
        nom: z.string().min(1),
        prenom: z.string().optional(),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<UserResult> => {
      const invitation = await ctx.rawDb.invitation.findUnique({ where: { token: input.token } })
      if (!invitation || invitation.accepte) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation invalide ou déjà acceptée' })
      }
      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invitation expirée' })
      }

      const user = await ctx.rawDb.user.create({
        data: {
          email: invitation.email,
          nom: input.nom,
          prenom: input.prenom ?? null,
          password: hashSync(input.password, 12),
          role: invitation.role,
          tenantId: invitation.tenantId,
        },
      })

      await ctx.rawDb.invitation.update({
        where: { id: invitation.id },
        data: { accepte: true },
      })

      return user
    }),
})
