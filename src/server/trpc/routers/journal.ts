import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'
import { CACHE_KEYS, delCache } from '@/server/lib/redis'
import { validerEquilibre } from '@/server/lib/syscohada/validations'
import { createTRPCRouter } from '../context'
import { exerciceProcedure, roleGuard } from '../middleware'

const ligneSchema = z.object({
  compte: z.string().regex(/^\d{6}$/, 'Numéro de compte à 6 chiffres requis'),
  intitule: z.string().min(1),
  debit: z.number().min(0),
  credit: z.number().min(0),
})

type JournalResult = {
  id: string
  date: Date
  journal: string
  libelle: string
  piece: string | null
  tenantId: string
  exerciceId: string
  source: string
  deletedAt: Date | null
  createdAt: Date
  lignes: {
    id: string
    ecritureId: string
    compte: string
    intitule: string
    debit: unknown
    credit: unknown
    tenantId: string
  }[]
}

export const journalRouter = createTRPCRouter({
  list: exerciceProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          journal: z.enum(['ACHAT', 'VENTE', 'BANQUE', 'CAISSE', 'OD', 'AN']).optional(),
          dateDebut: z.string().optional(),
          dateFin: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }): Promise<{ ecritures: JournalResult[]; total: number }> => {
      const page = input?.page ?? 1
      const pageSize = 50
      const where: Record<string, unknown> = {
        tenantId: ctx.entrepriseId,
        exerciceId: ctx.exerciceId,
        deletedAt: null,
      }

      if (input?.journal) where.journal = input.journal
      if (input?.dateDebut || input?.dateFin) {
        const dateFilter: Record<string, Date> = {}
        if (input?.dateDebut) dateFilter.gte = new Date(input.dateDebut)
        if (input?.dateFin) dateFilter.lte = new Date(input.dateFin)
        where.date = dateFilter
      }

      const [ecritures, total] = await Promise.all([
        ctx.rawDb.ecriture.findMany({
          where,
          include: { lignes: true },
          orderBy: { date: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.rawDb.ecriture.count({ where }),
      ])

      return { ecritures, total }
    }),

  getById: exerciceProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<JournalResult | null> => {
      const ecriture = await ctx.rawDb.ecriture.findFirst({
        where: { id: input.id, tenantId: ctx.entrepriseId, deletedAt: null },
        include: { lignes: true },
      })
      return ecriture
    }),

  create: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE'])
    .input(
      z.object({
        date: z.string(),
        journal: z.enum(['ACHAT', 'VENTE', 'BANQUE', 'CAISSE', 'OD', 'AN']),
        libelle: z.string().min(1),
        piece: z.string().optional(),
        exerciceId: z.string(),
        lignes: z.array(ligneSchema).min(2),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<JournalResult> => {
      const exercice = await ctx.rawDb.exercice.findUnique({
        where: { id: input.exerciceId },
      })
      if (!exercice || exercice.tenantId !== ctx.entrepriseId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Exercice introuvable' })
      }
      if (exercice.statut !== 'OUVERT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Exercice clôturé — saisie impossible',
        })
      }

      const { valid, diff } = validerEquilibre(input.lignes)
      if (!valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Écriture déséquilibrée : différence de ${diff.toFixed(2)} FCFA`,
        })
      }

      const ecriture = await ctx.rawDb.ecriture.create({
        data: {
          date: new Date(input.date),
          journal: input.journal,
          libelle: input.libelle,
          piece: input.piece ?? null,
          tenantId: ctx.entrepriseId,
          exerciceId: input.exerciceId,
          source: 'MANUEL',
          lignes: {
            create: input.lignes.map((l) => ({
              compte: l.compte,
              intitule: l.intitule,
              debit: l.debit,
              credit: l.credit,
              tenantId: ctx.entrepriseId,
            })),
          },
        },
        include: { lignes: true },
      })

      await Promise.all([
        delCache(CACHE_KEYS.balance(ctx.entrepriseId, input.exerciceId)),
        delCache(CACHE_KEYS.kpis(ctx.entrepriseId, input.exerciceId)),
      ])

      return ecriture
    }),

  update: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE'])
    .input(
      z.object({
        id: z.string(),
        date: z.string(),
        journal: z.enum(['ACHAT', 'VENTE', 'BANQUE', 'CAISSE', 'OD', 'AN']),
        libelle: z.string().min(1),
        piece: z.string().optional(),
        lignes: z.array(ligneSchema).min(2),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<JournalResult> => {
      const existing = await ctx.rawDb.ecriture.findFirst({
        where: { id: input.id, tenantId: ctx.entrepriseId, deletedAt: null },
        include: { exercice: true },
      })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Écriture introuvable' })
      }
      if (existing.exercice.statut !== 'OUVERT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Exercice clôturé — modification impossible',
        })
      }

      const { valid, diff } = validerEquilibre(input.lignes)
      if (!valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Écriture déséquilibrée : différence de ${diff.toFixed(2)} FCFA`,
        })
      }

      await ctx.rawDb.ligneEcriture.deleteMany({ where: { ecritureId: input.id } })

      const ecriture = await ctx.rawDb.ecriture.update({
        where: { id: input.id },
        data: {
          date: new Date(input.date),
          journal: input.journal,
          libelle: input.libelle,
          piece: input.piece ?? null,
          lignes: {
            create: input.lignes.map((l) => ({
              compte: l.compte,
              intitule: l.intitule,
              debit: l.debit,
              credit: l.credit,
              tenantId: ctx.entrepriseId,
            })),
          },
        },
        include: { lignes: true },
      })

      await Promise.all([
        delCache(CACHE_KEYS.balance(ctx.entrepriseId, existing.exerciceId)),
        delCache(CACHE_KEYS.kpis(ctx.entrepriseId, existing.exerciceId)),
      ])

      return ecriture
    }),

  delete: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE'])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<{ success: boolean }> => {
      const existing = await ctx.rawDb.ecriture.findFirst({
        where: { id: input.id, tenantId: ctx.entrepriseId, deletedAt: null },
        include: { exercice: true },
      })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Écriture introuvable' })
      }
      if (existing.exercice.statut !== 'OUVERT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Exercice clôturé — suppression impossible',
        })
      }

      await ctx.rawDb.ecriture.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      })

      await Promise.all([
        delCache(CACHE_KEYS.balance(ctx.entrepriseId, existing.exerciceId)),
        delCache(CACHE_KEYS.kpis(ctx.entrepriseId, existing.exerciceId)),
      ])

      return { success: true }
    }),
})
