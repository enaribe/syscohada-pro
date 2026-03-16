import { TRPCError } from '@trpc/server'
import { redis } from '@/server/lib/redis'

export async function checkRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowSecs: number,
): Promise<void> {
  const key = `rl:${action}:${userId}`
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, windowSecs)
  }

  if (current > limit) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Limite atteinte : ${limit} requêtes par ${windowSecs}s. Réessayez dans un instant.`,
    })
  }
}
