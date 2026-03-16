import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'
import { CACHE_KEYS, delCache } from '@/server/lib/redis'
import { createTRPCRouter } from '../context'
import { exerciceProcedure, roleGuard } from '../middleware'

export function calcProchaineDate(courante: Date, periodicite: string): Date {
  const next = new Date(courante)
  switch (periodicite) {
    case 'MENSUELLE':
      next.setMonth(next.getMonth() + 1)
      break
    case 'BIMESTRIELLE':
      next.setMonth(next.getMonth() + 2)
      break
    case 'TRIMESTRIELLE':
      next.setMonth(next.getMonth() + 3)
      break
    case 'SEMESTRIELLE':
      next.setMonth(next.getMonth() + 6)
      break
    case 'ANNUELLE':
      next.setFullYear(next.getFullYear() + 1)
      break
  }
  return next
}

const MODELES_PREDEFS = [
  {
    nom: 'Loyer',
    journal: 'OD',
    libelle: 'Loyer mensuel',
    lignes: [
      { compte: '622000', intitule: 'Loyer', debit: 0, credit: 0 },
      { compte: '521000', intitule: 'Banque', debit: 0, credit: 0 },
    ],
  },
  {
    nom: 'Salaires',
    journal: 'OD',
    libelle: 'Salaires du mois',
    lignes: [
      { compte: '661000', intitule: 'Salaires', debit: 0, credit: 0 },
      { compte: '421000', intitule: 'Personnel', debit: 0, credit: 0 },
    ],
  },
  {
    nom: 'Charges sociales',
    journal: 'OD',
    libelle: 'Charges sociales',
    lignes: [
      { compte: '664000', intitule: 'Charges sociales', debit: 0, credit: 0 },
      { compte: '431000', intitule: 'Sécu sociale', debit: 0, credit: 0 },
    ],
  },
  {
    nom: 'Électricité',
    journal: 'OD',
    libelle: 'Facture électricité',
    lignes: [
      { compte: '605000', intitule: 'Électricité', debit: 0, credit: 0 },
      { compte: '401000', intitule: 'Fournisseur', debit: 0, credit: 0 },
    ],
  },
  {
    nom: 'Assurance',
    journal: 'OD',
    libelle: 'Prime assurance',
    lignes: [
      { compte: '625000', intitule: 'Assurance', debit: 0, credit: 0 },
      { compte: '401000', intitule: 'Fournisseur', debit: 0, credit: 0 },
    ],
  },
  {
    nom: 'Emprunt',
    journal: 'OD',
    libelle: 'Remboursement emprunt',
    lignes: [
      { compte: '164000', intitule: 'Emprunt', debit: 0, credit: 0 },
      { compte: '521000', intitule: 'Banque', debit: 0, credit: 0 },
    ],
  },
]

type ModeleResult = {
  id: string
  nom: string
  journal: string
  libelle: string
  lignesJson: unknown
  periodicite: string
  prochaineDate: Date
  actif: boolean
  tenantId: string
  exerciceId: string
  createdAt: Date
}

export const recurrentesRouter = createTRPCRouter({
  list: exerciceProcedure.query(async ({ ctx }): Promise<ModeleResult[]> => {
    return ctx.rawDb.modeleRecurrent.findMany({
      where: { tenantId: ctx.entrepriseId, exerciceId: ctx.exerciceId },
      orderBy: { prochaineDate: 'asc' },
    })
  }),

  create: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE'])
    .input(
      z.object({
        nom: z.string().min(1),
        journal: z.enum(['ACHAT', 'VENTE', 'BANQUE', 'CAISSE', 'OD', 'AN']),
        libelle: z.string().min(1),
        lignesJson: z.array(
          z.object({
            compte: z.string().regex(/^\d{6}$/),
            intitule: z.string(),
            debit: z.number().min(0),
            credit: z.number().min(0),
          }),
        ),
        periodicite: z.enum([
          'MENSUELLE',
          'BIMESTRIELLE',
          'TRIMESTRIELLE',
          'SEMESTRIELLE',
          'ANNUELLE',
        ]),
        prochaineDate: z.string(),
        exerciceId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<ModeleResult> => {
      const exercice = await ctx.rawDb.exercice.findUnique({ where: { id: input.exerciceId } })
      if (!exercice || exercice.statut !== 'OUVERT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Exercice clôturé' })
      }

      const totalD = input.lignesJson.reduce((s, l) => s + l.debit, 0)
      const totalC = input.lignesJson.reduce((s, l) => s + l.credit, 0)
      if (Math.abs(totalD - totalC) > 0.01) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Écriture modèle déséquilibrée' })
      }

      return ctx.rawDb.modeleRecurrent.create({
        data: {
          nom: input.nom,
          journal: input.journal,
          libelle: input.libelle,
          lignesJson: input.lignesJson,
          periodicite: input.periodicite,
          prochaineDate: new Date(input.prochaineDate),
          tenantId: ctx.entrepriseId,
          exerciceId: input.exerciceId,
        },
      })
    }),

  generer: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE'])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const modele = await ctx.rawDb.modeleRecurrent.findFirst({
        where: { id: input.id, tenantId: ctx.entrepriseId, actif: true },
        include: { exercice: true },
      })
      if (!modele) throw new TRPCError({ code: 'NOT_FOUND' })
      if (modele.exercice.statut !== 'OUVERT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Exercice clôturé' })
      }

      const lignes = modele.lignesJson as {
        compte: string
        intitule: string
        debit: number
        credit: number
      }[]

      await ctx.rawDb.ecriture.create({
        data: {
          date: modele.prochaineDate,
          journal: modele.journal as 'ACHAT' | 'VENTE' | 'BANQUE' | 'CAISSE' | 'OD' | 'AN',
          libelle: modele.libelle,
          tenantId: ctx.entrepriseId,
          exerciceId: modele.exerciceId,
          source: 'RECURRENT',
          lignes: { create: lignes.map((l) => ({ ...l, tenantId: ctx.entrepriseId })) },
        },
      })

      await ctx.rawDb.historiqueRecurrent.create({
        data: { modeleId: modele.id, tenantId: ctx.entrepriseId },
      })

      const prochaineDate = calcProchaineDate(modele.prochaineDate, modele.periodicite)
      await ctx.rawDb.modeleRecurrent.update({
        where: { id: modele.id },
        data: { prochaineDate },
      })

      await Promise.all([
        delCache(CACHE_KEYS.balance(ctx.entrepriseId, modele.exerciceId)),
        delCache(CACHE_KEYS.kpis(ctx.entrepriseId, modele.exerciceId)),
      ])

      return { success: true, prochaineDate }
    }),

  getEcheancesAVenir: exerciceProcedure.query(async ({ ctx }): Promise<ModeleResult[]> => {
    const dans7j = new Date()
    dans7j.setDate(dans7j.getDate() + 7)

    return ctx.rawDb.modeleRecurrent.findMany({
      where: {
        tenantId: ctx.entrepriseId,
        exerciceId: ctx.exerciceId,
        actif: true,
        prochaineDate: { lte: dans7j },
      },
      orderBy: { prochaineDate: 'asc' },
    })
  }),

  getModelesPredefs: exerciceProcedure.query(() => MODELES_PREDEFS),
})
