import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'
import { delAllForExercice } from '@/server/lib/redis'
import { calculerBalance } from '@/server/lib/syscohada/balance'
import { calculerCR } from '@/server/lib/syscohada/etats-financiers'
import { createTRPCRouter } from '../context'
import { roleGuard } from '../middleware'

type VerificationResult = {
  equilibre: boolean
  totalDebit: number
  totalCredit: number
  resultat: number
  nbEcritures: number
  avertissements: string[]
}

export const clotureRouter = createTRPCRouter({
  verifier: roleGuard(['ADMIN', 'EXPERT'])
    .input(z.object({ exerciceId: z.string() }))
    .query(async ({ ctx, input }): Promise<VerificationResult> => {
      const exercice = await ctx.rawDb.exercice.findUnique({ where: { id: input.exerciceId } })
      if (!exercice || exercice.tenantId !== ctx.entrepriseId) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      if (exercice.statut !== 'OUVERT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Exercice déjà clôturé' })
      }

      const balance = await calculerBalance(ctx.entrepriseId, input.exerciceId)
      const cr = calculerCR(balance)
      const totalDebit = balance.reduce((s, b) => s + b.totalDebit, 0)
      const totalCredit = balance.reduce((s, b) => s + b.totalCredit, 0)
      const equilibre = Math.abs(totalDebit - totalCredit) <= 0.01

      const nbEcritures = await ctx.rawDb.ecriture.count({
        where: { tenantId: ctx.entrepriseId, exerciceId: input.exerciceId, deletedAt: null },
      })

      const avertissements: string[] = []
      if (!equilibre) avertissements.push("La balance n'est pas équilibrée")
      if (nbEcritures === 0) avertissements.push('Aucune écriture saisie')
      if (cr.resultatNet < 0) avertissements.push(`Résultat déficitaire : ${cr.resultatNet} FCFA`)

      return {
        equilibre,
        totalDebit,
        totalCredit,
        resultat: cr.resultatNet,
        nbEcritures,
        avertissements,
      }
    }),

  executer: roleGuard(['ADMIN', 'EXPERT'])
    .input(
      z.object({
        exerciceId: z.string(),
        affectation: z.object({
          reserves: z.number().min(0),
          report: z.number().min(0),
          dividendes: z.number().min(0),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const exercice = await ctx.rawDb.exercice.findUnique({ where: { id: input.exerciceId } })
      if (!exercice || exercice.tenantId !== ctx.entrepriseId) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      if (exercice.statut !== 'OUVERT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Exercice déjà clôturé' })
      }

      const balance = await calculerBalance(ctx.entrepriseId, input.exerciceId)
      const cr = calculerCR(balance)

      await ctx.rawDb.$transaction(async (tx) => {
        // 1. Archive balance dans exercice.archiveJson
        await tx.exercice.update({
          where: { id: input.exerciceId },
          data: { archiveJson: { balance, resultatNet: cr.resultatNet } },
        })

        // 2. OD affectation résultat
        const affLignes: {
          compte: string
          intitule: string
          debit: number
          credit: number
          tenantId: string
        }[] = []
        if (cr.resultatNet >= 0) {
          affLignes.push({
            compte: '131000',
            intitule: 'Résultat bénéficiaire',
            debit: cr.resultatNet,
            credit: 0,
            tenantId: ctx.entrepriseId,
          })
          if (input.affectation.reserves > 0)
            affLignes.push({
              compte: '111000',
              intitule: 'Réserve légale',
              debit: 0,
              credit: input.affectation.reserves,
              tenantId: ctx.entrepriseId,
            })
          if (input.affectation.dividendes > 0)
            affLignes.push({
              compte: '465000',
              intitule: 'Dividendes à payer',
              debit: 0,
              credit: input.affectation.dividendes,
              tenantId: ctx.entrepriseId,
            })
          if (input.affectation.report > 0)
            affLignes.push({
              compte: '120000',
              intitule: 'Report à nouveau',
              debit: 0,
              credit: input.affectation.report,
              tenantId: ctx.entrepriseId,
            })
        } else {
          affLignes.push(
            {
              compte: '139000',
              intitule: 'Résultat déficitaire',
              debit: 0,
              credit: Math.abs(cr.resultatNet),
              tenantId: ctx.entrepriseId,
            },
            {
              compte: '129000',
              intitule: 'Report à nouveau débiteur',
              debit: Math.abs(cr.resultatNet),
              credit: 0,
              tenantId: ctx.entrepriseId,
            },
          )
        }

        if (affLignes.length > 0) {
          await tx.ecriture.create({
            data: {
              date: new Date(`${exercice.annee}-12-31`),
              journal: 'OD',
              libelle: `Affectation du résultat — Exercice ${exercice.annee}`,
              tenantId: ctx.entrepriseId,
              exerciceId: input.exerciceId,
              source: 'IMPORT',
              lignes: { create: affLignes },
            },
          })
        }

        // 3. Écriture À-Nouveau (soldes classes 1-5)
        const anLignes: {
          compte: string
          intitule: string
          debit: number
          credit: number
          tenantId: string
        }[] = []
        for (const b of balance) {
          const classe = b.compte[0]
          if (classe && Number(classe) >= 1 && Number(classe) <= 5) {
            if (b.soldeDebit > 0) {
              anLignes.push({
                compte: b.compte,
                intitule: b.intitule,
                debit: b.soldeDebit,
                credit: 0,
                tenantId: ctx.entrepriseId,
              })
            } else if (b.soldeCredit > 0) {
              anLignes.push({
                compte: b.compte,
                intitule: b.intitule,
                debit: 0,
                credit: b.soldeCredit,
                tenantId: ctx.entrepriseId,
              })
            }
          }
        }

        // 4. Statut CLOTURE
        await tx.exercice.update({
          where: { id: input.exerciceId },
          data: { statut: 'CLOTURE' },
        })
      })

      // 5. Invalidation cache
      await delAllForExercice(ctx.entrepriseId, input.exerciceId)

      return { success: true, annee: exercice.annee }
    }),

  getArchives: roleGuard(['ADMIN', 'EXPERT']).query(async ({ ctx }) => {
    return ctx.rawDb.exercice.findMany({
      where: { tenantId: ctx.entrepriseId, statut: 'CLOTURE' },
      orderBy: { annee: 'desc' },
      select: { id: true, annee: true, statut: true, archiveJson: true },
    })
  }),
})
