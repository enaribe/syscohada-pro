import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'
import { CACHE_KEYS, delCache } from '@/server/lib/redis'
import { calcAmortissement } from '@/server/lib/syscohada/amortissements'
import { createTRPCRouter } from '../context'
import { exerciceProcedure, roleGuard } from '../middleware'

type ImmoResult = {
  id: string
  designation: string
  compteImmo: string
  compteAmort: string
  dateAcquisition: Date
  valeurOrigine: unknown
  dureeVie: number
  methode: string
  dateMiseEnService: Date | null
  dateCession: Date | null
  valeurCession: unknown
  tenantId: string
  exerciceId: string
  createdAt: Date
}

export const immobilisationsRouter = createTRPCRouter({
  list: exerciceProcedure.query(async ({ ctx }): Promise<ImmoResult[]> => {
    return ctx.rawDb.immobilisation.findMany({
      where: { tenantId: ctx.entrepriseId, exerciceId: ctx.exerciceId },
      orderBy: { dateAcquisition: 'asc' },
    })
  }),

  create: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE'])
    .input(
      z.object({
        designation: z.string().min(1),
        compteImmo: z.string().regex(/^\d{6}$/),
        compteAmort: z.string().regex(/^\d{6}$/),
        dateAcquisition: z.string(),
        valeurOrigine: z.number().positive(),
        dureeVie: z.number().int().min(1).max(50),
        methode: z.enum(['LINEAIRE', 'DEGRESSIF']),
        exerciceId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<ImmoResult> => {
      const exercice = await ctx.rawDb.exercice.findUnique({ where: { id: input.exerciceId } })
      if (!exercice || exercice.statut !== 'OUVERT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Exercice clôturé' })
      }

      return ctx.rawDb.immobilisation.create({
        data: {
          designation: input.designation,
          compteImmo: input.compteImmo,
          compteAmort: input.compteAmort,
          dateAcquisition: new Date(input.dateAcquisition),
          valeurOrigine: input.valeurOrigine,
          dureeVie: input.dureeVie,
          methode: input.methode,
          tenantId: ctx.entrepriseId,
          exerciceId: input.exerciceId,
        },
      })
    }),

  delete: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE'])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<{ success: boolean }> => {
      const immo = await ctx.rawDb.immobilisation.findFirst({
        where: { id: input.id, tenantId: ctx.entrepriseId },
        include: { exercice: true },
      })
      if (!immo) throw new TRPCError({ code: 'NOT_FOUND' })
      if (immo.exercice.statut !== 'OUVERT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Exercice clôturé' })
      }
      await ctx.rawDb.immobilisation.delete({ where: { id: input.id } })
      return { success: true }
    }),

  getTableauAmort: exerciceProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const immo = await ctx.rawDb.immobilisation.findFirst({
        where: { id: input.id, tenantId: ctx.entrepriseId },
      })
      if (!immo) throw new TRPCError({ code: 'NOT_FOUND' })

      const tableau = calcAmortissement(
        Number(immo.valeurOrigine),
        immo.dureeVie,
        immo.methode as 'LINEAIRE' | 'DEGRESSIF',
      )
      return { immobilisation: immo, tableau }
    }),

  genererOD: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE'])
    .input(z.object({ exerciceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const exercice = await ctx.rawDb.exercice.findUnique({ where: { id: input.exerciceId } })
      if (!exercice || exercice.statut !== 'OUVERT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Exercice clôturé' })
      }

      const immos = await ctx.rawDb.immobilisation.findMany({
        where: { tenantId: ctx.entrepriseId, exerciceId: input.exerciceId },
      })

      const lignes: { compte: string; intitule: string; debit: number; credit: number }[] = []

      for (const immo of immos) {
        const tableau = calcAmortissement(
          Number(immo.valeurOrigine),
          immo.dureeVie,
          immo.methode as 'LINEAIRE' | 'DEGRESSIF',
        )
        const annuiteAnneeCourante = tableau[0]
        if (!annuiteAnneeCourante) continue

        lignes.push(
          {
            compte: '681000',
            intitule: `DAP ${immo.designation}`,
            debit: annuiteAnneeCourante.annuite,
            credit: 0,
          },
          {
            compte: immo.compteAmort,
            intitule: `Amort. ${immo.designation}`,
            debit: 0,
            credit: annuiteAnneeCourante.annuite,
          },
        )
      }

      if (lignes.length === 0) {
        return { created: false, message: 'Aucune immobilisation à amortir' }
      }

      await ctx.rawDb.ecriture.create({
        data: {
          date: new Date(),
          journal: 'OD',
          libelle: `Dotations aux amortissements — Exercice ${exercice.annee}`,
          tenantId: ctx.entrepriseId,
          exerciceId: input.exerciceId,
          source: 'IMPORT',
          lignes: { create: lignes.map((l) => ({ ...l, tenantId: ctx.entrepriseId })) },
        },
      })

      await Promise.all([
        delCache(CACHE_KEYS.balance(ctx.entrepriseId, input.exerciceId)),
        delCache(CACHE_KEYS.kpis(ctx.entrepriseId, input.exerciceId)),
      ])

      return { created: true, nbImmos: immos.length, nbLignes: lignes.length }
    }),
})
