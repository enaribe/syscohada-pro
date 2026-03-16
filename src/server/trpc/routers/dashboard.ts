import { CACHE_KEYS, CACHE_TTL, getCache, setCache } from '@/server/lib/redis'
import type { ChartData } from '@/server/lib/syscohada/kpis'
import { calculerCharts, calculerKPIs } from '@/server/lib/syscohada/kpis'
import type { TKpis } from '@/types/syscohada'
import { createTRPCRouter } from '../context'
import { exerciceProcedure } from '../middleware'

export const dashboardRouter = createTRPCRouter({
  get: exerciceProcedure.query(async ({ ctx }): Promise<TKpis> => {
    const cacheKey = CACHE_KEYS.kpis(ctx.entrepriseId, ctx.exerciceId)
    const cached = await getCache<TKpis>(cacheKey)
    if (cached) return cached

    const kpis = await calculerKPIs(ctx.entrepriseId, ctx.exerciceId)
    await setCache(cacheKey, kpis, CACHE_TTL.kpis)
    return kpis
  }),

  getCharts: exerciceProcedure.query(async ({ ctx }): Promise<ChartData> => {
    const cacheKey = `charts:${ctx.entrepriseId}:${ctx.exerciceId}`
    const cached = await getCache<ChartData>(cacheKey)
    if (cached) return cached

    const charts = await calculerCharts(ctx.entrepriseId, ctx.exerciceId)
    await setCache(cacheKey, charts, 5 * 60)
    return charts
  }),
})
