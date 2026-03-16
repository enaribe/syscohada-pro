import { CACHE_KEYS, CACHE_TTL, getCache, setCache } from '@/server/lib/redis'
import { calculerBalance } from '@/server/lib/syscohada/balance'
import {
  calculerBilan,
  calculerCR,
  calculerRatios,
  calculerTAFIRE,
} from '@/server/lib/syscohada/etats-financiers'
import { createTRPCRouter } from '../context'
import { exerciceProcedure } from '../middleware'

type EtatsResult = {
  bilan: ReturnType<typeof calculerBilan>
  cr: ReturnType<typeof calculerCR>
  tafire: ReturnType<typeof calculerTAFIRE>
  ratios: ReturnType<typeof calculerRatios>
}

export const etatsRouter = createTRPCRouter({
  get: exerciceProcedure.query(async ({ ctx }): Promise<EtatsResult> => {
    const cacheKey = CACHE_KEYS.etats(ctx.entrepriseId, ctx.exerciceId)
    const cached = await getCache<EtatsResult>(cacheKey)
    if (cached) return cached

    const balance = await calculerBalance(ctx.entrepriseId, ctx.exerciceId)
    const bilan = calculerBilan(balance)
    const cr = calculerCR(balance)
    const tafire = calculerTAFIRE(balance)
    const ratios = calculerRatios(bilan, cr)

    const result = { bilan, cr, tafire, ratios }
    await setCache(cacheKey, result, CACHE_TTL.etats)
    return result
  }),

  comparatif: exerciceProcedure.query(
    async ({
      ctx,
    }): Promise<{
      n: EtatsResult
      n1: EtatsResult | null
    }> => {
      const balance = await calculerBalance(ctx.entrepriseId, ctx.exerciceId)
      const bilan = calculerBilan(balance)
      const cr = calculerCR(balance)
      const tafire = calculerTAFIRE(balance)
      const ratios = calculerRatios(bilan, cr)
      const n = { bilan, cr, tafire, ratios }

      // N-1 from archiveJson of previous exercice
      const exercice = await ctx.rawDb.exercice.findUnique({ where: { id: ctx.exerciceId } })
      if (!exercice) return { n, n1: null }

      const prevExercice = await ctx.rawDb.exercice.findFirst({
        where: { tenantId: ctx.entrepriseId, annee: exercice.annee - 1, statut: 'CLOTURE' },
      })

      if (!prevExercice?.archiveJson) return { n, n1: null }

      const archived = prevExercice.archiveJson as { balance?: unknown[] }
      if (!archived.balance) return { n, n1: null }

      const prevBalance = archived.balance as {
        compte: string
        intitule: string
        totalDebit: number
        totalCredit: number
        soldeDebit: number
        soldeCredit: number
      }[]
      const prevBilan = calculerBilan(prevBalance)
      const prevCR = calculerCR(prevBalance)
      const prevTafire = calculerTAFIRE(prevBalance)
      const prevRatios = calculerRatios(prevBilan, prevCR)

      return { n, n1: { bilan: prevBilan, cr: prevCR, tafire: prevTafire, ratios: prevRatios } }
    },
  ),
})
