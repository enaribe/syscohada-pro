import { CACHE_KEYS, CACHE_TTL, getCache, setCache } from '@/server/lib/redis'
import { calculerBalance } from '@/server/lib/syscohada/balance'
import type { TBalance } from '@/types/syscohada'
import { createTRPCRouter } from '../context'
import { exerciceProcedure } from '../middleware'

export const balanceRouter = createTRPCRouter({
  get: exerciceProcedure.query(async ({ ctx }): Promise<TBalance[]> => {
    const cacheKey = CACHE_KEYS.balance(ctx.entrepriseId, ctx.exerciceId)
    const cached = await getCache<TBalance[]>(cacheKey)
    if (cached) return cached

    const balance = await calculerBalance(ctx.entrepriseId, ctx.exerciceId)
    await setCache(cacheKey, balance, CACHE_TTL.balance)
    return balance
  }),
})
