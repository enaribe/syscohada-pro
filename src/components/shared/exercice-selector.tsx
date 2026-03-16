'use client'

import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc-client'
import { useAppStore } from '@/store/app.store'

export function ExerciceSelector() {
  const { exerciceId, setExercice } = useAppStore()
  const { data: exercices } = trpc.exercices.list.useQuery()

  if (!exercices?.length) return null

  return (
    <select
      value={exerciceId}
      onChange={(e) => {
        const selected = exercices.find((ex) => ex.id === e.target.value)
        if (selected) {
          setExercice(selected.id, selected.annee)
        }
      }}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white"
    >
      {exercices.map((ex) => (
        <option key={ex.id} value={ex.id}>
          Exercice {ex.annee} {ex.statut === 'OUVERT' ? '● Ouvert' : '✓ Clôturé'}
        </option>
      ))}
    </select>
  )
}

export function ReadOnlyBanner({ annee }: { annee: number }) {
  return (
    <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 text-center text-sm text-orange-700">
      Exercice {annee} clôturé — Consultation uniquement
    </div>
  )
}
