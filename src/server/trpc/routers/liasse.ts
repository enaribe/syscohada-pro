import { CACHE_KEYS, CACHE_TTL, getCache, setCache } from '@/server/lib/redis'
import { calculerBalance } from '@/server/lib/syscohada/balance'
import { calculerBilan, calculerCR } from '@/server/lib/syscohada/etats-financiers'
import { createTRPCRouter } from '../context'
import { exerciceProcedure } from '../middleware'

type LiasseResult = {
  identification: {
    raisonSociale: string
    formeJuridique: string | null
    ninea: string | null
    rccm: string | null
    adresse: string | null
    ville: string | null
    pays: string
    zone: string
  }
  bilanActif: { reference: string; libelle: string; montant: number }[]
  bilanPassif: { reference: string; libelle: string; montant: number }[]
  cr: { reference: string; libelle: string; montant: number }[]
  resultatNet: number
  etatIE: { libelle: string; montant: number }[]
}

export const liasseRouter = createTRPCRouter({
  get: exerciceProcedure.query(async ({ ctx }): Promise<LiasseResult> => {
    const cacheKey = CACHE_KEYS.liasse(ctx.entrepriseId, ctx.exerciceId)
    const cached = await getCache<LiasseResult>(cacheKey)
    if (cached) return cached

    const tenant = await ctx.rawDb.tenant.findUnique({ where: { id: ctx.entrepriseId } })
    const balance = await calculerBalance(ctx.entrepriseId, ctx.exerciceId)
    const bilan = calculerBilan(balance)
    const cr = calculerCR(balance)

    // État IE - TVA
    const tvaCollectee = balance
      .filter((b) => b.compte.startsWith('443'))
      .reduce((s, b) => s + b.soldeCredit, 0)
    const tvaDeductible = balance
      .filter((b) => b.compte.startsWith('445'))
      .reduce((s, b) => s + b.soldeDebit, 0)

    const result: LiasseResult = {
      identification: {
        raisonSociale: tenant?.raisonSociale ?? '',
        formeJuridique: tenant?.formeJuridique ?? null,
        ninea: tenant?.ninea ?? null,
        rccm: tenant?.rccm ?? null,
        adresse: tenant?.adresse ?? null,
        ville: tenant?.ville ?? null,
        pays: tenant?.pays ?? 'SN',
        zone: tenant?.zone ?? 'UEMOA',
      },
      bilanActif: bilan.actif,
      bilanPassif: bilan.passif,
      cr: [...cr.exploitation, ...cr.financier, ...cr.hao],
      resultatNet: cr.resultatNet,
      etatIE: [
        { libelle: 'TVA collectée', montant: tvaCollectee },
        { libelle: 'TVA déductible', montant: tvaDeductible },
        { libelle: 'TVA nette à payer', montant: tvaCollectee - tvaDeductible },
        { libelle: `Taux TVA ${tenant?.zone === 'CEMAC' ? '19,25%' : '18%'}`, montant: 0 },
      ],
    }

    await setCache(cacheKey, result, CACHE_TTL.liasse)
    return result
  }),

  getIdentification: exerciceProcedure.query(async ({ ctx }) => {
    const tenant = await ctx.rawDb.tenant.findUnique({ where: { id: ctx.entrepriseId } })
    return {
      raisonSociale: tenant?.raisonSociale ?? '',
      formeJuridique: tenant?.formeJuridique ?? null,
      ninea: tenant?.ninea ?? null,
      rccm: tenant?.rccm ?? null,
      adresse: tenant?.adresse ?? null,
      ville: tenant?.ville ?? null,
      pays: tenant?.pays ?? 'SN',
    }
  }),
})
