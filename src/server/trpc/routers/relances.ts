import { z } from 'zod/v4'
import { prisma } from '@/server/db/prisma'
import { createTRPCRouter } from '../context'
import { exerciceProcedure, roleGuard } from '../middleware'

type Creance = {
  client: string
  compte: string
  montant: number
  joursRetard: number
  niveau: 1 | 2 | 3
}

function detecterCreances(
  ecritures: {
    date: Date
    lignes: { compte: string; intitule: string; debit: unknown; credit: unknown }[]
  }[],
  seuils: { niveau1: number; niveau2: number; niveau3: number },
): Creance[] {
  const clientSoldes = new Map<string, { montant: number; intitule: string; dateMin: Date }>()
  const now = new Date()

  for (const e of ecritures) {
    for (const l of e.lignes) {
      if (!l.compte.startsWith('411')) continue
      const existing = clientSoldes.get(l.compte) ?? {
        montant: 0,
        intitule: l.intitule,
        dateMin: e.date,
      }
      existing.montant += Number(l.debit) - Number(l.credit)
      if (e.date < existing.dateMin) existing.dateMin = e.date
      clientSoldes.set(l.compte, existing)
    }
  }

  const creances: Creance[] = []
  for (const [compte, data] of clientSoldes) {
    if (data.montant <= 0) continue
    const joursRetard = Math.floor((now.getTime() - data.dateMin.getTime()) / (1000 * 60 * 60 * 24))
    let niveau: 1 | 2 | 3 = 1
    if (joursRetard >= seuils.niveau3) niveau = 3
    else if (joursRetard >= seuils.niveau2) niveau = 2

    creances.push({ client: data.intitule, compte, montant: data.montant, joursRetard, niveau })
  }

  return creances.sort((a, b) => b.joursRetard - a.joursRetard)
}

export const relancesRouter = createTRPCRouter({
  list: exerciceProcedure
    .input(
      z
        .object({
          niveau1: z.number().default(30),
          niveau2: z.number().default(60),
          niveau3: z.number().default(90),
        })
        .optional(),
    )
    .query(async ({ ctx, input }): Promise<Creance[]> => {
      const seuils = {
        niveau1: input?.niveau1 ?? 30,
        niveau2: input?.niveau2 ?? 60,
        niveau3: input?.niveau3 ?? 90,
      }

      const ecritures = await prisma.ecriture.findMany({
        where: { tenantId: ctx.entrepriseId, exerciceId: ctx.exerciceId, deletedAt: null },
        include: { lignes: { where: { compte: { startsWith: '411' } } } },
        orderBy: { date: 'asc' },
      })

      return detecterCreances(ecritures, seuils)
    }),

  getConfig: exerciceProcedure.query(async ({ ctx }) => {
    const tenant = await ctx.rawDb.tenant.findUnique({ where: { id: ctx.entrepriseId } })
    return {
      raisonSociale: tenant?.raisonSociale ?? '',
      formeJuridique: tenant?.formeJuridique ?? null,
      adresse: tenant?.adresse ?? null,
      ville: tenant?.ville ?? null,
      ninea: tenant?.ninea ?? null,
    }
  }),
})
