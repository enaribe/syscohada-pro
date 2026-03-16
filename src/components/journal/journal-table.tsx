'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateOHADA, formatFCFA } from '@/lib/utils'

type Ligne = {
  id: string
  compte: string
  intitule: string
  debit?: unknown
  credit?: unknown
}

type Ecriture = {
  id: string
  date: Date | string
  journal: string
  libelle: string
  piece: string | null
  source: string
  lignes: Ligne[]
}

const JOURNAL_COLORS: Record<string, string> = {
  ACHAT: 'bg-orange-100 text-orange-700',
  VENTE: 'bg-green-100 text-green-700',
  BANQUE: 'bg-blue-100 text-blue-700',
  CAISSE: 'bg-yellow-100 text-yellow-700',
  OD: 'bg-purple-100 text-purple-700',
  AN: 'bg-gray-100 text-gray-700',
}

export function JournalTable({
  ecritures,
  isCloture,
  onEdit,
  onDelete,
}: {
  ecritures: Ecriture[]
  isCloture: boolean
  onEdit: (ecriture: Ecriture) => void
  onDelete: (id: string) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Journal</TableHead>
          <TableHead>Pièce</TableHead>
          <TableHead>Libellé</TableHead>
          <TableHead>Compte</TableHead>
          <TableHead className="text-right">Débit</TableHead>
          <TableHead className="text-right">Crédit</TableHead>
          <TableHead>Source</TableHead>
          {!isCloture && <TableHead className="w-20">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {ecritures.map((ecriture) =>
          ecriture.lignes.map((ligne, idx) => (
            <TableRow key={ligne.id}>
              {idx === 0 ? (
                <>
                  <TableCell rowSpan={ecriture.lignes.length}>
                    {formatDateOHADA(new Date(ecriture.date))}
                  </TableCell>
                  <TableCell rowSpan={ecriture.lignes.length}>
                    <Badge variant="outline" className={JOURNAL_COLORS[ecriture.journal] ?? ''}>
                      {ecriture.journal}
                    </Badge>
                  </TableCell>
                  <TableCell rowSpan={ecriture.lignes.length} className="text-xs text-gray-500">
                    {ecriture.piece ?? '-'}
                  </TableCell>
                  <TableCell rowSpan={ecriture.lignes.length}>{ecriture.libelle}</TableCell>
                </>
              ) : null}
              <TableCell className="font-mono text-sm">{ligne.compte}</TableCell>
              <TableCell className="text-right font-mono">
                {Number(ligne.debit) > 0 ? formatFCFA(Number(ligne.debit)) : ''}
              </TableCell>
              <TableCell className="text-right font-mono">
                {Number(ligne.credit) > 0 ? formatFCFA(Number(ligne.credit)) : ''}
              </TableCell>
              {idx === 0 ? (
                <>
                  <TableCell rowSpan={ecriture.lignes.length}>
                    <Badge variant="secondary" className="text-xs">
                      {ecriture.source}
                    </Badge>
                  </TableCell>
                  {!isCloture && (
                    <TableCell rowSpan={ecriture.lignes.length}>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(ecriture)}
                          className="h-7 w-7"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(ecriture.id)}
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </>
              ) : null}
            </TableRow>
          )),
        )}
        {ecritures.length === 0 && (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-gray-500 py-8">
              Aucune écriture pour cet exercice
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
