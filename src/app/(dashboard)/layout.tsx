'use client'

import { ReadOnlyBanner } from '@/components/shared/exercice-selector'
import { Sidebar } from '@/components/shared/sidebar'
import { Topbar } from '@/components/shared/topbar'
import { trpc } from '@/lib/trpc-client'
import { useAppStore } from '@/store/app.store'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { exerciceId } = useAppStore()
  const { data: exercices } = trpc.exercices.list.useQuery()
  const currentExercice = exercices?.find((e) => e.id === exerciceId)
  const isCloture = currentExercice?.statut === 'CLOTURE'

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        {isCloture && currentExercice && <ReadOnlyBanner annee={currentExercice.annee} />}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  )
}
