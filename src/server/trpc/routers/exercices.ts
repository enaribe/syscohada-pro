import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'
import { createTRPCRouter } from '../context'
import { protectedProcedure, roleGuard } from '../middleware'

type ExerciceResult = {
  id: string
  annee: number
  libelle: string | null
  statut: string
  dateDebut: Date
  dateFin: Date
  tenantId: string
  archiveJson: unknown
  createdAt: Date
}

export const exercicesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }): Promise<ExerciceResult[]> => {
    const exercices = await ctx.rawDb.exercice.findMany({
      where: { tenantId: ctx.entrepriseId },
      orderBy: { annee: 'desc' },
    })
    return exercices
  }),

  getActif: protectedProcedure.query(async ({ ctx }): Promise<ExerciceResult | null> => {
    const exercice = await ctx.rawDb.exercice.findFirst({
      where: { tenantId: ctx.entrepriseId, statut: 'OUVERT' },
      orderBy: { annee: 'desc' },
    })
    return exercice
  }),

  create: roleGuard(['ADMIN', 'EXPERT'])
    .input(z.object({ annee: z.number().int().min(2000).max(2100) }))
    .mutation(async ({ ctx, input }): Promise<ExerciceResult> => {
      const existing = await ctx.rawDb.exercice.findFirst({
        where: { tenantId: ctx.entrepriseId, statut: 'OUVERT' },
      })
      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Un exercice ouvert existe déjà (${existing.annee}). Clôturez-le avant d'en créer un nouveau.`,
        })
      }

      const duplicate = await ctx.rawDb.exercice.findUnique({
        where: { tenantId_annee: { tenantId: ctx.entrepriseId, annee: input.annee } },
      })
      if (duplicate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `L'exercice ${input.annee} existe déjà.`,
        })
      }

      const exercice = await ctx.rawDb.exercice.create({
        data: {
          annee: input.annee,
          libelle: `Exercice ${input.annee}`,
          statut: 'OUVERT',
          dateDebut: new Date(`${input.annee}-01-01`),
          dateFin: new Date(`${input.annee}-12-31`),
          tenantId: ctx.entrepriseId,
        },
      })

      return exercice
    }),
})
