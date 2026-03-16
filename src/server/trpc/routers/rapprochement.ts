import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'
import { CACHE_KEYS, delCache } from '@/server/lib/redis'
import { createTRPCRouter } from '../context'
import { exerciceProcedure, roleGuard } from '../middleware'

type LigneReleve = {
  date: string
  libelle: string
  montant: number
  reference: string
}

type RapprochementEtat = {
  lignesReleve: LigneReleve[]
  ecrituresBanque: {
    id: string
    date: Date | string
    libelle: string
    debit: number
    credit: number
    rapproche: boolean
  }[]
  soldeReleve: number
  soldeComptable: number
  ecart: number
}

export const rapprochementRouter = createTRPCRouter({
  importReleve: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE'])
    .input(
      z.object({
        exerciceId: z.string(),
        lignes: z.array(
          z.object({
            date: z.string(),
            libelle: z.string(),
            montant: z.number(),
            reference: z.string().default(''),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const exercice = await ctx.rawDb.exercice.findUnique({ where: { id: input.exerciceId } })
      if (!exercice || exercice.statut !== 'OUVERT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Exercice clôturé' })
      }
      return { imported: input.lignes.length, lignes: input.lignes }
    }),

  getEtat: exerciceProcedure.query(async ({ ctx }): Promise<RapprochementEtat> => {
    const ecritures = await ctx.rawDb.ecriture.findMany({
      where: {
        tenantId: ctx.entrepriseId,
        exerciceId: ctx.exerciceId,
        deletedAt: null,
        lignes: { some: { compte: { startsWith: '52' } } },
      },
      include: { lignes: { where: { compte: { startsWith: '52' } } } },
      orderBy: { date: 'asc' },
    })

    const ecrituresBanque = ecritures.flatMap((e) =>
      e.lignes.map((l) => ({
        id: l.id,
        date: e.date,
        libelle: e.libelle,
        debit: Number(l.debit),
        credit: Number(l.credit),
        rapproche: false,
      })),
    )

    const soldeComptable = ecrituresBanque.reduce((s, e) => s + e.debit - e.credit, 0)

    return {
      lignesReleve: [],
      ecrituresBanque,
      soldeReleve: 0,
      soldeComptable,
      ecart: soldeComptable,
    }
  }),

  genererOD: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE'])
    .input(
      z.object({
        exerciceId: z.string(),
        lignes: z.array(
          z.object({
            libelle: z.string(),
            montant: z.number(),
            sens: z.enum(['debit', 'credit']),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const exercice = await ctx.rawDb.exercice.findUnique({ where: { id: input.exerciceId } })
      if (!exercice || exercice.statut !== 'OUVERT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Exercice clôturé' })
      }

      const ecritureLignes = input.lignes.flatMap((l) => [
        {
          compte: '521000',
          intitule: l.libelle,
          debit: l.sens === 'debit' ? l.montant : 0,
          credit: l.sens === 'credit' ? l.montant : 0,
          tenantId: ctx.entrepriseId,
        },
        {
          compte: '471000',
          intitule: `Régul. ${l.libelle}`,
          debit: l.sens === 'credit' ? l.montant : 0,
          credit: l.sens === 'debit' ? l.montant : 0,
          tenantId: ctx.entrepriseId,
        },
      ])

      await ctx.rawDb.ecriture.create({
        data: {
          date: new Date(),
          journal: 'OD',
          libelle: `Régularisation rapprochement — Exercice ${exercice.annee}`,
          tenantId: ctx.entrepriseId,
          exerciceId: input.exerciceId,
          source: 'IMPORT',
          lignes: { create: ecritureLignes },
        },
      })

      await Promise.all([
        delCache(CACHE_KEYS.balance(ctx.entrepriseId, input.exerciceId)),
        delCache(CACHE_KEYS.kpis(ctx.entrepriseId, input.exerciceId)),
      ])

      return { created: true }
    }),
})
