'use client'

import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/server/trpc/router'
import { useAppStore } from '@/store/app.store'

export const trpc = createTRPCReact<AppRouter>()

export function getTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        headers() {
          const { exerciceId } = useAppStore.getState()
          return {
            'x-exercice-id': exerciceId,
          }
        },
      }),
    ],
  })
}
