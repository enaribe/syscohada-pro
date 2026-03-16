'use client'

import { Badge } from '@/components/ui/badge'
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

const CLASSES: Record<string, string> = {
  '1': 'Ressources durables',
  '2': 'Actif immobilisé',
  '3': 'Stocks',
  '4': 'Tiers',
  '5': 'Trésorerie',
  '6': 'Charges',
  '7': 'Produits',
  '8': 'Comptes spéciaux',
}

export default function BalancePage() {
  const { exerciceAnnee } = useAppStore()
  const { data: balance } = trpc.balance.get.useQuery()

  const totalDebit = balance?.reduce((s, b) => s + b.totalDebit, 0) ?? 0
  const totalCredit = balance?.reduce((s, b) => s + b.totalCredit, 0) ?? 0
  const totalSoldeD = balance?.reduce((s, b) => s + b.soldeDebit, 0) ?? 0
  const totalSoldeC = balance?.reduce((s, b) => s + b.soldeCredit, 0) ?? 0
  const isEquilibre = Math.abs(totalSoldeD - totalSoldeC) <= 0.01

  let currentClass = ''

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Balance de vérification — Exercice {exerciceAnnee}</h1>
        <Badge variant={isEquilibre ? 'default' : 'destructive'} className="text-sm">
          {isEquilibre ? 'Equilibre D = C' : 'Déséquilibre'}
        </Badge>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Compte</TableHead>
              <TableHead>Intitulé</TableHead>
              <TableHead className="text-right">Total Débit</TableHead>
              <TableHead className="text-right">Total Crédit</TableHead>
              <TableHead className="text-right">Solde Débit</TableHead>
              <TableHead className="text-right">Solde Crédit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balance?.map((b) => {
              const classe = b.compte[0] ?? ''
              const showClassHeader = classe !== currentClass
              if (showClassHeader) currentClass = classe

              return showClassHeader ? (
                <>
                  <TableRow key={`class-${classe}`}>
                    <TableCell
                      colSpan={6}
                      className="bg-gray-50 font-semibold text-sm text-gray-600"
                    >
                      Classe {classe} — {CLASSES[classe] ?? ''}
                    </TableCell>
                  </TableRow>
                  <TableRow key={b.compte}>
                    <TableCell className="font-mono">{b.compte}</TableCell>
                    <TableCell>{b.intitule}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatFCFA(b.totalDebit)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatFCFA(b.totalCredit)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {b.soldeDebit > 0 ? formatFCFA(b.soldeDebit) : ''}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {b.soldeCredit > 0 ? formatFCFA(b.soldeCredit) : ''}
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow key={b.compte}>
                  <TableCell className="font-mono">{b.compte}</TableCell>
                  <TableCell>{b.intitule}</TableCell>
                  <TableCell className="text-right font-mono">{formatFCFA(b.totalDebit)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatFCFA(b.totalCredit)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {b.soldeDebit > 0 ? formatFCFA(b.soldeDebit) : ''}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {b.soldeCredit > 0 ? formatFCFA(b.soldeCredit) : ''}
                  </TableCell>
                </TableRow>
              )
            })}

            <TableRow className="bg-gray-100 font-bold">
              <TableCell colSpan={2}>TOTAUX</TableCell>
              <TableCell className="text-right font-mono">{formatFCFA(totalDebit)}</TableCell>
              <TableCell className="text-right font-mono">{formatFCFA(totalCredit)}</TableCell>
              <TableCell className="text-right font-mono">{formatFCFA(totalSoldeD)}</TableCell>
              <TableCell className="text-right font-mono">{formatFCFA(totalSoldeC)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
