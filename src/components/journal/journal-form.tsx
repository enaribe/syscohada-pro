'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatFCFA } from '@/lib/utils'
import { rechercheCompte } from '@/server/lib/syscohada/plan-comptable'

type LigneForm = {
  compte: string
  intitule: string
  debit: number
  credit: number
}

const JOURNALS = ['ACHAT', 'VENTE', 'BANQUE', 'CAISSE', 'OD', 'AN'] as const

export function JournalForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  exerciceId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    date: string
    journal: string
    libelle: string
    piece?: string
    exerciceId: string
    lignes: LigneForm[]
  }) => void
  initialData?:
    | {
        date: string
        journal: string
        libelle: string
        piece?: string | undefined
        lignes: LigneForm[]
      }
    | undefined
  exerciceId: string
}) {
  const [date, setDate] = useState(initialData?.date ?? new Date().toISOString().split('T')[0]!)
  const [journal, setJournal] = useState(initialData?.journal ?? 'VENTE')
  const [libelle, setLibelle] = useState(initialData?.libelle ?? '')
  const [piece, setPiece] = useState(initialData?.piece ?? '')
  const [lignes, setLignes] = useState<LigneForm[]>(
    initialData?.lignes ?? [
      { compte: '', intitule: '', debit: 0, credit: 0 },
      { compte: '', intitule: '', debit: 0, credit: 0 },
    ],
  )
  const [suggestions, setSuggestions] = useState<{ compte: string; intitule: string }[]>([])
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number | null>(null)

  const totalDebit = lignes.reduce((sum, l) => sum + l.debit, 0)
  const totalCredit = lignes.reduce((sum, l) => sum + l.credit, 0)
  const isEquilibre = Math.abs(totalDebit - totalCredit) <= 0.01
  const canSubmit = isEquilibre && libelle.length > 0 && lignes.every((l) => l.compte.length === 6)

  function updateLigne(index: number, field: keyof LigneForm, value: string | number) {
    setLignes((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)))
  }

  function handleCompteChange(index: number, value: string) {
    updateLigne(index, 'compte', value)
    if (value.length >= 2) {
      const results = rechercheCompte(value)
      setSuggestions(results)
      setActiveSuggestionIdx(index)
    } else {
      setSuggestions([])
      setActiveSuggestionIdx(null)
    }
  }

  function selectSuggestion(index: number, suggestion: { compte: string; intitule: string }) {
    updateLigne(index, 'compte', suggestion.compte)
    updateLigne(index, 'intitule', suggestion.intitule)
    setSuggestions([])
    setActiveSuggestionIdx(null)
  }

  function addLigne() {
    setLignes((prev) => [...prev, { compte: '', intitule: '', debit: 0, credit: 0 }])
  }

  function removeLigne(index: number) {
    if (lignes.length <= 2) return
    setLignes((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      date,
      journal,
      libelle,
      piece: piece || '',
      exerciceId,
      lignes,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Modifier l'écriture" : 'Nouvelle écriture'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="journal">Journal</Label>
              <select
                id="journal"
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {JOURNALS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="libelle">Libellé</Label>
              <Input
                id="libelle"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
                placeholder="Description de l'opération"
                required
              />
            </div>
            <div>
              <Label htmlFor="piece">Pièce</Label>
              <Input
                id="piece"
                value={piece}
                onChange={(e) => setPiece(e.target.value)}
                placeholder="FA-001"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Compte</th>
                  <th className="px-3 py-2 text-left">Intitulé</th>
                  <th className="px-3 py-2 text-right">Débit</th>
                  <th className="px-3 py-2 text-right">Crédit</th>
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-1 relative">
                      <Input
                        value={ligne.compte}
                        onChange={(e) => handleCompteChange(idx, e.target.value)}
                        placeholder="601000"
                        className="font-mono h-8"
                        maxLength={6}
                      />
                      {activeSuggestionIdx === idx && suggestions.length > 0 && (
                        <ul className="absolute z-10 bg-white border rounded shadow-lg mt-1 max-h-40 overflow-y-auto w-64">
                          {suggestions.slice(0, 8).map((s) => (
                            <li
                              key={s.compte}
                              className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer text-xs"
                              onMouseDown={() => selectSuggestion(idx, s)}
                            >
                              <span className="font-mono font-medium">{s.compte}</span>{' '}
                              <span className="text-gray-500">{s.intitule}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-3 py-1">
                      <Input
                        value={ligne.intitule}
                        onChange={(e) => updateLigne(idx, 'intitule', e.target.value)}
                        placeholder="Intitulé du compte"
                        className="h-8"
                      />
                    </td>
                    <td className="px-3 py-1">
                      <Input
                        type="number"
                        value={ligne.debit || ''}
                        onChange={(e) => updateLigne(idx, 'debit', Number(e.target.value))}
                        className="text-right font-mono h-8"
                        min={0}
                      />
                    </td>
                    <td className="px-3 py-1">
                      <Input
                        type="number"
                        value={ligne.credit || ''}
                        onChange={(e) => updateLigne(idx, 'credit', Number(e.target.value))}
                        className="text-right font-mono h-8"
                        min={0}
                      />
                    </td>
                    <td className="px-3 py-1">
                      {lignes.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLigne(idx)}
                          className="h-7 w-7 text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-medium">
                <tr>
                  <td colSpan={2} className="px-3 py-2">
                    <Button type="button" variant="ghost" size="sm" onClick={addLigne}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une ligne
                    </Button>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{formatFCFA(totalDebit)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatFCFA(totalCredit)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <div
              className={`text-sm font-medium px-3 py-1.5 rounded ${
                isEquilibre ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {isEquilibre
                ? '&#x2713; Équilibre D = C'
                : `Différence : ${formatFCFA(Math.abs(totalDebit - totalCredit))}`}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {initialData ? 'Modifier' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
