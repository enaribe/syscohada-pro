'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { rechercheCompte } from '@/server/lib/syscohada/plan-comptable'
import { useAppStore } from '@/store/app.store'

export default function GrandLivrePage() {
  const { exerciceAnnee } = useAppStore()
  const [compte, setCompte] = useState('')
  const [selectedCompte, setSelectedCompte] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [suggestions, setSuggestions] = useState<{ compte: string; intitule: string }[]>([])

  const { data } = trpc.grandLivre.get.useQuery(
    { compte: selectedCompte, dateDebut: dateDebut || undefined, dateFin: dateFin || undefined },
    { enabled: selectedCompte.length === 6 },
  )

  function handleCompteChange(value: string) {
    setCompte(value)
    if (value.length >= 2) {
      setSuggestions(rechercheCompte(value))
    } else {
      setSuggestions([])
    }
  }

  function selectCompte(c: string) {
    setCompte(c)
    setSelectedCompte(c)
    setSuggestions([])
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        Grand Livre — Exercice {exerciceAnnee}
        {data ? ` — Compte ${data.compte}` : ''}
      </h1>

      <div className="flex items-end gap-4 bg-white p-4 rounded-lg border">
        <div className="relative flex-1">
          <Label>Compte</Label>
          <Input
            value={compte}
            onChange={(e) => handleCompteChange(e.target.value)}
            placeholder="Rechercher un compte..."
            className="font-mono"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border rounded shadow-lg mt-1 max-h-48 overflow-y-auto w-full">
              {suggestions.map((s) => (
                <li
                  key={s.compte}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                  onMouseDown={() => selectCompte(s.compte)}
                >
                  <span className="font-mono font-medium">{s.compte}</span>{' '}
                  <span className="text-gray-500">{s.intitule}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <Label>Du</Label>
          <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
        </div>
        <div>
          <Label>Au</Label>
          <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
        </div>
        <Button
          onClick={() => {
            if (compte.length === 6) setSelectedCompte(compte)
          }}
        >
          Afficher
        </Button>
      </div>

      {data && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <div className="p-4 border-b">
            <span className="font-mono font-bold">{data.compte}</span>{' '}
            <span className="text-gray-600">{data.intitule}</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Pièce</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="text-right">Débit</TableHead>
                <TableHead className="text-right">Crédit</TableHead>
                <TableHead className="text-right">Solde progressif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.lignes.map((ligne, idx) => (
                <TableRow key={idx}>
                  <TableCell>{formatDateOHADA(new Date(ligne.date))}</TableCell>
                  <TableCell className="text-xs text-gray-500">{ligne.piece ?? '-'}</TableCell>
                  <TableCell>{ligne.libelle}</TableCell>
                  <TableCell className="text-right font-mono">
                    {ligne.debit > 0 ? formatFCFA(ligne.debit) : ''}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {ligne.credit > 0 ? formatFCFA(ligne.credit) : ''}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono font-medium ${
                      ligne.solde < 0 ? 'text-red-600' : ''
                    }`}
                  >
                    {formatFCFA(ligne.solde)}
                  </TableCell>
                </TableRow>
              ))}
              {data.lignes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    Aucun mouvement pour ce compte
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
