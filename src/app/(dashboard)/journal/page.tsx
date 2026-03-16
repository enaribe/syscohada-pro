'use client'

import { Bot, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { JournalForm } from '@/components/journal/journal-form'
import { JournalIAForm } from '@/components/journal/journal-ia-form'
import { JournalTable } from '@/components/journal/journal-table'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc-client'
import { useAppStore } from '@/store/app.store'

const JOURNALS = [
  { value: '', label: 'Tous les journaux' },
  { value: 'ACHAT', label: 'Achats' },
  { value: 'VENTE', label: 'Ventes' },
  { value: 'BANQUE', label: 'Banque' },
  { value: 'CAISSE', label: 'Caisse' },
  { value: 'OD', label: 'Opérations Diverses' },
  { value: 'AN', label: 'À Nouveau' },
]

export default function JournalPage() {
  const { exerciceId, exerciceAnnee } = useAppStore()
  const [formOpen, setFormOpen] = useState(false)
  const [showIA, setShowIA] = useState(false)
  const [iaLignes, setIaLignes] = useState<
    { compte: string; intitule: string; debit: number; credit: number }[]
  >([])
  const [filterJournal, setFilterJournal] = useState('')
  const [page, setPage] = useState(1)

  const { data: exercices } = trpc.exercices.list.useQuery()
  const currentExercice = exercices?.find((e) => e.id === exerciceId)
  const isCloture = currentExercice?.statut === 'CLOTURE'

  const { data, refetch } = trpc.journal.list.useQuery({
    page,
    journal: filterJournal
      ? (filterJournal as 'ACHAT' | 'VENTE' | 'BANQUE' | 'CAISSE' | 'OD' | 'AN')
      : undefined,
  })

  const createMutation = trpc.journal.create.useMutation({
    onSuccess: () => {
      toast.success('Écriture enregistrée')
      refetch()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const deleteMutation = trpc.journal.delete.useMutation({
    onSuccess: () => {
      toast.success('Écriture supprimée')
      refetch()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Journal — Exercice {exerciceAnnee}</h1>
        {!isCloture && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowIA(!showIA)}>
              <Bot className="h-4 w-4 mr-2" /> {showIA ? 'Masquer IA' : 'Mode IA'}
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nouvelle écriture
            </Button>
          </div>
        )}
      </div>

      {showIA && !isCloture && (
        <JournalIAForm
          exerciceId={exerciceId}
          onResult={(lignes) => {
            setIaLignes(lignes)
            setFormOpen(true)
            setShowIA(false)
          }}
        />
      )}

      <div className="flex items-center gap-4">
        <select
          value={filterJournal}
          onChange={(e) => {
            setFilterJournal(e.target.value)
            setPage(1)
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {JOURNALS.map((j) => (
            <option key={j.value} value={j.value}>
              {j.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          {data?.total ?? 0} écriture{(data?.total ?? 0) > 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-white rounded-lg border">
        <JournalTable
          ecritures={data?.ecritures ?? []}
          isCloture={isCloture}
          onEdit={() => {
            /* TODO: edit modal */
          }}
          onDelete={(id) => {
            if (confirm('Supprimer cette écriture ?')) {
              deleteMutation.mutate({ id })
            }
          }}
        />
      </div>

      {data && data.total > 50 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Précédent
          </Button>
          <span className="text-sm self-center">
            Page {page} / {Math.ceil(data.total / 50)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(data.total / 50)}
          >
            Suivant
          </Button>
        </div>
      )}

      <JournalForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setIaLignes([])
        }}
        exerciceId={exerciceId}
        initialData={
          iaLignes.length > 0
            ? {
                date: new Date().toISOString().split('T')[0]!,
                journal: 'OD',
                libelle: 'Écriture générée par IA',
                lignes: iaLignes,
              }
            : undefined
        }
        onSubmit={(formData) => {
          createMutation.mutate({
            ...formData,
            journal: formData.journal as 'ACHAT' | 'VENTE' | 'BANQUE' | 'CAISSE' | 'OD' | 'AN',
          })
        }}
      />
    </div>
  )
}
