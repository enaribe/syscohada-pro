import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'
import { createTRPCRouter } from '../context'
import { exerciceProcedure, roleGuard } from '../middleware'

const CATEGORIES = [
  'Ventes encaissées',
  'Prestations encaissées',
  'Subventions reçues',
  'Emprunts reçus',
  'Autres encaissements',
  'Achats décaissés',
  'Salaires et charges',
  'Loyers et charges locatives',
  'Impôts et taxes',
  'Remboursements emprunts',
  'Autres décaissements',
] as const

type PrevisionResult = {
  id: string
  mois: number
  annee: number
  categorie: string
  libelle: string
  type: string
  montant: unknown
  tenantId: string
  exerciceId: string
  createdAt: Date
}

export const tresorerieRouter = createTRPCRouter({
  getPrevisions: exerciceProcedure
    .input(
      z
        .object({
          horizon: z.enum(['3', '6', '9', '12']).default('12'),
        })
        .optional(),
    )
    .query(
      async ({
        ctx,
      }): Promise<{
        previsions: PrevisionResult[]
        realise: { mois: number; solde: number }[]
      }> => {
        const previsions = await ctx.rawDb.prevision.findMany({
          where: { tenantId: ctx.entrepriseId, exerciceId: ctx.exerciceId },
          orderBy: [{ annee: 'asc' }, { mois: 'asc' }],
        })

        // Réalisé depuis comptes 521/571
        const ecritures = await ctx.rawDb.ecriture.findMany({
          where: { tenantId: ctx.entrepriseId, exerciceId: ctx.exerciceId, deletedAt: null },
          include: { lignes: { where: { compte: { startsWith: '52' } } } },
        })

        const realiseMap = new Map<number, number>()
        for (const e of ecritures) {
          const mois = new Date(e.date).getMonth() + 1
          for (const l of e.lignes) {
            const current = realiseMap.get(mois) ?? 0
            realiseMap.set(mois, current + Number(l.debit) - Number(l.credit))
          }
        }

        const realise = Array.from(realiseMap.entries())
          .map(([mois, solde]) => ({ mois, solde }))
          .sort((a, b) => a.mois - b.mois)

        return { previsions, realise }
      },
    ),

  addPrevision: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE'])
    .input(
      z.object({
        mois: z.number().int().min(1).max(12),
        annee: z.number().int(),
        categorie: z.string(),
        libelle: z.string().min(1),
        type: z.enum(['ENCAISSEMENT', 'DECAISSEMENT']),
        montant: z.number().positive(),
        exerciceId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<PrevisionResult> => {
      const exercice = await ctx.rawDb.exercice.findUnique({ where: { id: input.exerciceId } })
      if (!exercice || exercice.statut !== 'OUVERT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Exercice clôturé' })
      }

      return ctx.rawDb.prevision.create({
        data: {
          mois: input.mois,
          annee: input.annee,
          categorie: input.categorie,
          libelle: input.libelle,
          type: input.type,
          montant: input.montant,
          tenantId: ctx.entrepriseId,
          exerciceId: input.exerciceId,
        },
      })
    }),

  deletePrevision: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE'])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<{ success: boolean }> => {
      const prev = await ctx.rawDb.prevision.findFirst({
        where: { id: input.id, tenantId: ctx.entrepriseId },
        include: { exercice: true },
      })
      if (!prev) throw new TRPCError({ code: 'NOT_FOUND' })
      if (prev.exercice.statut !== 'OUVERT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Exercice clôturé' })
      }
      await ctx.rawDb.prevision.delete({ where: { id: input.id } })
      return { success: true }
    }),

  getCategories: exerciceProcedure.query((): string[] => {
    return [...CATEGORIES]
  }),
})
