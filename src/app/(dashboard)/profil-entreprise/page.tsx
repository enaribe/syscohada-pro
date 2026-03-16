'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/lib/trpc-client'

export default function ProfilEntreprisePage() {
  const { data: entreprise, isLoading } = trpc.entreprise.get.useQuery()
  const utils = trpc.useUtils()

  const [raisonSociale, setRaisonSociale] = useState('')
  const [formeJuridique, setFormeJuridique] = useState('')
  const [ninea, setNinea] = useState('')
  const [rccm, setRccm] = useState('')
  const [secteur, setSecteur] = useState('')
  const [adresse, setAdresse] = useState('')
  const [ville, setVille] = useState('')
  const [pays, setPays] = useState('')

  useEffect(() => {
    if (entreprise) {
      setRaisonSociale(entreprise.raisonSociale ?? '')
      setFormeJuridique(entreprise.formeJuridique ?? '')
      setNinea(entreprise.ninea ?? '')
      setRccm(entreprise.rccm ?? '')
      setSecteur(entreprise.secteur ?? '')
      setAdresse(entreprise.adresse ?? '')
      setVille(entreprise.ville ?? '')
      setPays(entreprise.pays ?? '')
    }
  }, [entreprise])

  const updateMutation = trpc.entreprise.update.useMutation({
    onSuccess: () => {
      toast.success('Profil entreprise mis à jour')
      utils.entreprise.get.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateMutation.mutate({
      raisonSociale,
      formeJuridique,
      ninea,
      rccm,
      secteur,
      adresse,
      ville,
      pays,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Chargement...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Profil entreprise</h1>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Raison sociale</Label>
            <Input
              value={raisonSociale}
              onChange={(e) => setRaisonSociale(e.target.value)}
              placeholder="Ma Société SARL"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Forme juridique</Label>
              <Input
                value={formeJuridique}
                onChange={(e) => setFormeJuridique(e.target.value)}
                placeholder="SARL"
              />
            </div>
            <div className="space-y-2">
              <Label>NINEA</Label>
              <Input
                value={ninea}
                onChange={(e) => setNinea(e.target.value)}
                placeholder="123456789"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>RCCM</Label>
              <Input
                value={rccm}
                onChange={(e) => setRccm(e.target.value)}
                placeholder="SN-DKR-2024-B-1234"
              />
            </div>
            <div className="space-y-2">
              <Label>Secteur</Label>
              <Input
                value={secteur}
                onChange={(e) => setSecteur(e.target.value)}
                placeholder="Commerce"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="123 Rue Exemple"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                placeholder="Dakar"
              />
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Input
                value={pays}
                onChange={(e) => setPays(e.target.value)}
                placeholder="Sénégal"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
