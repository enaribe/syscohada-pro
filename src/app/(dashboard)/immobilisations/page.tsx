'use client'

import { Calculator, Plus, Trash2 } from 'lucide-react'
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
import { formatDateOHADA, formatFCFA } from '@/lib/utils'
import { useAppStore } from '@/store/app.store'

export default function ImmobilisationsPage() {
  const { exerciceId, exerciceAnnee } = useAppStore()
  const [dialogOpen, setDialogOpen] = useState(false)

  const [designation, setDesignation] = useState('')
  const [compteImmo, setCompteImmo] = useState('')
  const [compteAmort, setCompteAmort] = useState('')
  const [dateAcquisition, setDateAcquisition] = useState('')
  const [valeurOrigine, setValeurOrigine] = useState('')
  const [dureeVie, setDureeVie] = useState('')
  const [methode, setMethode] = useState<'LINEAIRE' | 'DEGRESSIF'>('LINEAIRE')

  const { data: exercices } = trpc.exercices.list.useQuery()
  const currentExercice = exercices?.find((e) => e.id === exerciceId)
  const isCloture = currentExercice?.statut === 'CLOTURE'

  const { data: immobilisations, refetch } = trpc.immobilisations.list.useQuery()
  const utils = trpc.useUtils()

  const createMutation = trpc.immobilisations.create.useMutation({
    onSuccess: () => {
      toast.success('Immobilisation ajoutée')
      refetch()
      utils.immobilisations.list.invalidate()
      resetForm()
      setDialogOpen(false)
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteMutation = trpc.immobilisations.delete.useMutation({
    onSuccess: () => {
      toast.success('Immobilisation supprimée')
      refetch()
    },
    onError: (err) => toast.error(err.message),
  })

  const genererODMutation = trpc.immobilisations.genererOD.useMutation({
    onSuccess: (result) => {
      if (result.created) {
        toast.success(`OD générée : ${result.nbImmos} immobilisations, ${result.nbLignes} lignes`)
      } else {
        toast.info(result.message)
      }
      utils.immobilisations.list.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  function resetForm() {
    setDesignation('')
    setCompteImmo('')
    setCompteAmort('')
    setDateAcquisition('')
    setValeurOrigine('')
    setDureeVie('')
    setMethode('LINEAIRE')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({
      designation,
      compteImmo,
      compteAmort,
      dateAcquisition,
      valeurOrigine: Number(valeurOrigine),
      dureeVie: Number(dureeVie),
      methode,
      exerciceId,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Immobilisations — Exercice {exerciceAnnee}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={isCloture || genererODMutation.isPending}
            onClick={() => genererODMutation.mutate({ exerciceId })}
          >
            <Calculator className="mr-2 size-4" />
            Générer OD dotations
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button disabled={isCloture}>
                  <Plus className="mr-2 size-4" />
                  Ajouter
                </Button>
              }
            />
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nouvelle immobilisation</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Désignation</Label>
                  <Input
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Véhicule de service"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Compte immo</Label>
                    <Input
                      value={compteImmo}
                      onChange={(e) => setCompteImmo(e.target.value)}
                      placeholder="245000"
                      pattern="\d{6}"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Compte amort</Label>
                    <Input
                      value={compteAmort}
                      onChange={(e) => setCompteAmort(e.target.value)}
                      placeholder="284500"
                      pattern="\d{6}"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date d&apos;acquisition</Label>
                    <Input
                      type="date"
                      value={dateAcquisition}
                      onChange={(e) => setDateAcquisition(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valeur d&apos;origine</Label>
                    <Input
                      type="number"
                      value={valeurOrigine}
                      onChange={(e) => setValeurOrigine(e.target.value)}
                      placeholder="5000000"
                      min={1}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Durée de vie (ans)</Label>
                    <Input
                      type="number"
                      value={dureeVie}
                      onChange={(e) => setDureeVie(e.target.value)}
                      placeholder="5"
                      min={1}
                      max={50}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Méthode</Label>
                    <Select
                      value={methode}
                      onValueChange={(val) => setMethode(val as 'LINEAIRE' | 'DEGRESSIF')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LINEAIRE">Linéaire</SelectItem>
                        <SelectItem value="DEGRESSIF">Dégressif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Désignation</TableHead>
              <TableHead>Compte</TableHead>
              <TableHead>Date acquisition</TableHead>
              <TableHead className="text-right">Valeur d&apos;origine</TableHead>
              <TableHead className="text-right">Durée (ans)</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {immobilisations?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Aucune immobilisation enregistrée
                </TableCell>
              </TableRow>
            )}
            {immobilisations?.map((immo) => (
              <TableRow key={immo.id}>
                <TableCell className="font-medium">{immo.designation}</TableCell>
                <TableCell className="font-mono">{immo.compteImmo}</TableCell>
                <TableCell>{formatDateOHADA(new Date(immo.dateAcquisition))}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatFCFA(Number(immo.valeurOrigine))}
                </TableCell>
                <TableCell className="text-right">{immo.dureeVie}</TableCell>
                <TableCell>{immo.methode}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isCloture || deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate({ id: immo.id })}
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
