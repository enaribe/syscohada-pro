'use client'

import { Badge } from '@/components/ui/badge'
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
import { formatFCFA } from '@/lib/utils'
import { useAppStore } from '@/store/app.store'

const NIVEAU_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'Amiable', color: 'bg-green-100 text-green-800' },
  2: { label: 'Urgent', color: 'bg-orange-100 text-orange-800' },
  3: { label: 'Contentieux', color: 'bg-red-100 text-red-800' },
}

export default function RelancesPage() {
  const { exerciceAnnee } = useAppStore()
  const { data: relances } = trpc.relances.list.useQuery({})

  const totalCreances = relances?.reduce((s, r) => s + r.montant, 0) ?? 0
  const clientsUniques = new Set(relances?.map((r) => r.client)).size

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        Relances clients — Exercice {exerciceAnnee}
      </h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total créances</p>
          <p className="text-xl font-bold font-mono">{formatFCFA(totalCreances)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Nombre de clients</p>
          <p className="text-xl font-bold">{clientsUniques}</p>
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Compte</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-right">Jours de retard</TableHead>
              <TableHead>Niveau</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {relances?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Aucune relance en cours
                </TableCell>
              </TableRow>
            )}
            {relances?.map((r, i) => {
              const config = NIVEAU_CONFIG[r.niveau] ?? NIVEAU_CONFIG[1]
              return (
                <TableRow key={`${r.compte}-${i}`}>
                  <TableCell className="font-medium">{r.client}</TableCell>
                  <TableCell className="font-mono">{r.compte}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatFCFA(r.montant)}
                  </TableCell>
                  <TableCell className="text-right">{r.joursRetard}</TableCell>
                  <TableCell>
                    <Badge className={config?.color ?? ''}>{config?.label ?? ''}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
