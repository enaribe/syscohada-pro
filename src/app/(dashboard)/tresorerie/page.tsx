'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const MOIS_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

export default function TresoreriePage() {
  const { exerciceId, exerciceAnnee } = useAppStore()
  const [dialogOpen, setDialogOpen] = useState(false)

  const [mois, setMois] = useState('1')
  const [categorie, setCategorie] = useState('')
  const [libelle, setLibelle] = useState('')
  const [type, setType] = useState<'ENCAISSEMENT' | 'DECAISSEMENT'>('ENCAISSEMENT')
  const [montant, setMontant] = useState('')

  const { data: exercices } = trpc.exercices.list.useQuery()
  const currentExercice = exercices?.find((e) => e.id === exerciceId)
  const isCloture = currentExercice?.statut === 'CLOTURE'

  const { data, refetch } = trpc.tresorerie.getPrevisions.useQuery()
  const { data: categories } = trpc.tresorerie.getCategories.useQuery()

  const addMutation = trpc.tresorerie.addPrevision.useMutation({
    onSuccess: () => {
      toast.success('Prévision ajoutée')
      refetch()
      resetForm()
      setDialogOpen(false)
    },
    onError: (err) => toast.error(err.message),
  })

  function resetForm() {
    setMois('1')
    setCategorie('')
    setLibelle('')
    setType('ENCAISSEMENT')
    setMontant('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addMutation.mutate({
      mois: Number(mois),
      annee: exerciceAnnee,
      categorie,
      libelle,
      type,
      montant: Number(montant),
      exerciceId,
    })
  }

  // Aggregate previsions by month
  const moisData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const prevsMois = data?.previsions.filter((p) => p.mois === m) ?? []
    const encaissements = prevsMois
      .filter((p) => p.type === 'ENCAISSEMENT')
      .reduce((s, p) => s + Number(p.montant), 0)
    const decaissements = prevsMois
      .filter((p) => p.type === 'DECAISSEMENT')
      .reduce((s, p) => s + Number(p.montant), 0)
    const solde = encaissements - decaissements
    return { mois: m, encaissements, decaissements, solde }
  })

  // Compute cumulative balance
  let soldeCumule = 0
  const moisDataWithCumul = moisData.map((m) => {
    soldeCumule += m.solde
    return { ...m, soldeCumule }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trésorerie prévisionnelle — Exercice {exerciceAnnee}</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button disabled={isCloture}>
                <Plus className="mr-2 size-4" />
                Ajouter une prévision
              </Button>
            }
          />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouvelle prévision</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mois</Label>
                  <Select
                    value={mois}
                    onValueChange={(val) => {
                      if (val) setMois(val)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOIS_LABELS.map((label, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={type}
                    onValueChange={(val) => setType(val as 'ENCAISSEMENT' | 'DECAISSEMENT')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENCAISSEMENT">Encaissement</SelectItem>
                      <SelectItem value="DECAISSEMENT">Décaissement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={categorie}
                  onValueChange={(val) => {
                    if (val) setCategorie(val)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Libellé</Label>
                <Input
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                  placeholder="Ventes du mois"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Montant</Label>
                <Input
                  type="number"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="1000000"
                  min={1}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mois</TableHead>
              <TableHead className="text-right">Encaissements</TableHead>
              <TableHead className="text-right">Décaissements</TableHead>
              <TableHead className="text-right">Solde mensuel</TableHead>
              <TableHead className="text-right">Solde cumulé</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {moisDataWithCumul.map((m) => (
              <TableRow key={m.mois}>
                <TableCell className="font-medium">{MOIS_LABELS[m.mois - 1]}</TableCell>
                <TableCell className="text-right font-mono">
                  {m.encaissements > 0 ? formatFCFA(m.encaissements) : '—'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {m.decaissements > 0 ? formatFCFA(m.decaissements) : '—'}
                </TableCell>
                <TableCell className={`text-right font-mono ${m.solde < 0 ? 'text-red-600' : ''}`}>
                  {formatFCFA(m.solde)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono font-semibold ${m.soldeCumule < 0 ? 'text-red-600' : ''}`}
                >
                  {formatFCFA(m.soldeCumule)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-gray-100 font-bold">
              <TableCell>TOTAL</TableCell>
              <TableCell className="text-right font-mono">
                {formatFCFA(moisData.reduce((s, m) => s + m.encaissements, 0))}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatFCFA(moisData.reduce((s, m) => s + m.decaissements, 0))}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatFCFA(moisData.reduce((s, m) => s + m.solde, 0))}
              </TableCell>
              <TableCell
                className={`text-right font-mono font-semibold ${soldeCumule < 0 ? 'text-red-600' : ''}`}
              >
                {formatFCFA(soldeCumule)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
