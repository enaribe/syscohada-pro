import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.REDIS_URL ?? '',
  token: process.env.REDIS_TOKEN ?? '',
})

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get<T>(key)
  return data
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  await redis.set(key, value, { ex: ttlSeconds })
}

export async function delCache(key: string): Promise<void> {
  await redis.del(key)
}

export async function delAllForExercice(tenantId: string, exerciceId: string): Promise<void> {
  const keys = [
    CACHE_KEYS.balance(tenantId, exerciceId),
    CACHE_KEYS.etats(tenantId, exerciceId),
    CACHE_KEYS.kpis(tenantId, exerciceId),
    CACHE_KEYS.liasse(tenantId, exerciceId),
  ]
  await Promise.all(keys.map((k) => delCache(k)))
}

export const CACHE_KEYS = {
  balance: (tenantId: string, exerciceId: string) => `balance:${tenantId}:${exerciceId}`,
  etats: (tenantId: string, exerciceId: string) => `etats:${tenantId}:${exerciceId}`,
  kpis: (tenantId: string, exerciceId: string) => `kpis:${tenantId}:${exerciceId}`,
  liasse: (tenantId: string, exerciceId: string) => `liasse:${tenantId}:${exerciceId}`,
  rateLimit: (userId: string) => `rl:ia:${userId}`,
}

export const CACHE_TTL = {
  balance: 5 * 60,
  etats: 10 * 60,
  kpis: 2 * 60,
  liasse: 30 * 60,
  rateLimit: 60,
}
