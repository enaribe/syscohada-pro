'use client'

import { AlertTriangle, Play } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

export default function RecurrentesPage() {
  const { exerciceId, exerciceAnnee } = useAppStore()

  const { data: exercices } = trpc.exercices.list.useQuery()
  const currentExercice = exercices?.find((e) => e.id === exerciceId)
  const isCloture = currentExercice?.statut === 'CLOTURE'

  const { data: modeles, refetch } = trpc.recurrentes.list.useQuery()
  const { data: echeances } = trpc.recurrentes.getEcheancesAVenir.useQuery()
  const utils = trpc.useUtils()

  const genererMutation = trpc.recurrentes.generer.useMutation({
    onSuccess: () => {
      toast.success('Écriture générée avec succès')
      refetch()
      utils.recurrentes.getEcheancesAVenir.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Écritures récurrentes — Exercice {exerciceAnnee}</h1>
      </div>

      {/* Alert banner for upcoming echeances */}
      {echeances && echeances.length > 0 && (
        <Card className="border-orange-300 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-orange-800">
                {echeances.length} échéance{echeances.length > 1 ? 's' : ''} à venir dans les 7
                prochains jours
              </p>
              <ul className="mt-1 space-y-1">
                {echeances.map((ech) => (
                  <li key={ech.id} className="text-sm text-orange-700">
                    <span className="font-medium">{ech.nom}</span>
                    {' — '}
                    {formatDateOHADA(new Date(ech.prochaineDate))}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Périodicité</TableHead>
              <TableHead>Prochaine date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modeles?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Aucune écriture récurrente configurée
                </TableCell>
              </TableRow>
            )}
            {modeles?.map((modele) => (
              <TableRow key={modele.id}>
                <TableCell className="font-medium">{modele.nom}</TableCell>
                <TableCell>{modele.periodicite}</TableCell>
                <TableCell>{formatDateOHADA(new Date(modele.prochaineDate))}</TableCell>
                <TableCell>
                  <Badge variant={modele.actif ? 'default' : 'outline'}>
                    {modele.actif ? 'Actif' : 'Inactif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isCloture || !modele.actif || genererMutation.isPending}
                    onClick={() => genererMutation.mutate({ id: modele.id })}
                  >
                    <Play className="mr-1 size-3" />
                    Générer
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
