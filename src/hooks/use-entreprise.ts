'use client'

import { useSession } from '@/lib/auth-client'
import { useAppStore } from '@/store/app.store'

export function useEntreprise() {
  const { data: session, isPending } = useSession()
  const { entrepriseId, exerciceId, exerciceAnnee } = useAppStore()

  return {
    user: session?.user ?? null,
    entrepriseId,
    exerciceId,
    exerciceAnnee,
    isPending,
    isAuthenticated: !!session?.user,
  }
}
