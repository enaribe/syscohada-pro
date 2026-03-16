'use client'

import { Search, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { trpc } from '@/lib/trpc-client'
import { formatDateOHADA } from '@/lib/utils'
import { useAppStore } from '@/store/app.store'

function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`
}

export default function CoffreFortPage() {
  const { exerciceId, exerciceAnnee } = useAppStore()
  const [filtre, setFiltre] = useState('')

  const { data: exercices } = trpc.exercices.list.useQuery()
  const currentExercice = exercices?.find((e) => e.id === exerciceId)
  const isCloture = currentExercice?.statut === 'CLOTURE'

  const { data: documents, refetch } = trpc.coffre.list.useQuery(
    filtre ? { filtre } : {}
  )

  const deleteMutation = trpc.coffre.delete.useMutation({
    onSuccess: () => {
      toast.success('Document supprimé')
      refetch()
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        Coffre-fort — Exercice {exerciceAnnee}
      </h1>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
        <Upload className="mx-auto size-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          PDF, images, Excel — max 10 Mo
        </p>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Taille</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Aucun document dans le coffre-fort
                </TableCell>
              </TableRow>
            )}
            {documents?.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.nom}</TableCell>
                <TableCell className="text-muted-foreground">{doc.type}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatTaille(doc.taille)}
                </TableCell>
                <TableCell>
                  {formatDateOHADA(new Date(doc.createdAt))}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isCloture || deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate({ id: doc.id })}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
