'use client'

import { Upload } from 'lucide-react'
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
import { formatDateOHADA, formatFCFA } from '@/lib/utils'
import { useAppStore } from '@/store/app.store'

export default function RapprochementPage() {
  const { exerciceId, exerciceAnnee } = useAppStore()

  const { data: exercices } = trpc.exercices.list.useQuery()
  const currentExercice = exercices?.find((e) => e.id === exerciceId)
  const isCloture = currentExercice?.statut === 'CLOTURE'

  const { data: etat } = trpc.rapprochement.getEtat.useQuery()

  const importMutation = trpc.rapprochement.importReleve.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.imported} lignes importées`)
    },
    onError: (err) => toast.error(err.message),
  })

  function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter((l) => l.trim())
      // Skip header row
      const dataLines = lines.slice(1)
      const lignes = dataLines.map((line) => {
        const parts = line.split(';')
        return {
          date: parts[0]?.trim() ?? '',
          libelle: parts[1]?.trim() ?? '',
          montant: Number(parts[2]?.trim() ?? 0),
          reference: parts[3]?.trim() ?? '',
        }
      })
      importMutation.mutate({ exerciceId, lignes })
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rapprochement bancaire — Exercice {exerciceAnnee}</h1>
        {etat && (
          <Badge variant={etat.ecart === 0 ? 'default' : 'destructive'} className="text-sm">
            Ecart : {formatFCFA(etat.ecart)}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column: Relevé bancaire */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Relevé bancaire</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Solde relevé : {formatFCFA(etat?.soldeReleve ?? 0)}</Badge>
            </div>
          </div>

          {etat?.lignesReleve.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
              <Upload className="mx-auto size-10 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Importez votre relevé bancaire au format CSV
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Format attendu : date;libelle;montant;reference
                </p>
                <label>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    disabled={isCloture}
                    onChange={handleCSVImport}
                  />
                  <Button
                    variant="outline"
                    disabled={isCloture || importMutation.isPending}
                    type="button"
                  >
                    <Upload className="mr-2 size-4" />
                    {importMutation.isPending ? 'Import en cours...' : 'Importer CSV'}
                  </Button>
                </label>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {etat?.lignesReleve.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell>{l.date}</TableCell>
                    <TableCell>{l.libelle}</TableCell>
                    <TableCell
                      className={`text-right font-mono ${l.montant < 0 ? 'text-red-600' : ''}`}
                    >
                      {formatFCFA(l.montant)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Right column: Journal banque */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Journal banque</h2>
            <Badge variant="outline">
              Solde comptable : {formatFCFA(etat?.soldeComptable ?? 0)}
            </Badge>
          </div>

          {etat?.ecrituresBanque.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune écriture bancaire pour cet exercice
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Débit</TableHead>
                    <TableHead className="text-right">Crédit</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {etat?.ecrituresBanque.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{formatDateOHADA(new Date(e.date))}</TableCell>
                      <TableCell>{e.libelle}</TableCell>
                      <TableCell className="text-right font-mono">
                        {e.debit > 0 ? formatFCFA(e.debit) : ''}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {e.credit > 0 ? formatFCFA(e.credit) : ''}
                      </TableCell>
                      <TableCell>
                        <Badge variant={e.rapproche ? 'default' : 'outline'}>
                          {e.rapproche ? 'Rapproché' : 'En attente'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
