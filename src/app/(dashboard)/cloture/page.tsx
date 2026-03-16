'use client'

import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/lib/trpc-client'
import { formatFCFA } from '@/lib/utils'
import { useAppStore } from '@/store/app.store'

export default function CloturePage() {
  const router = useRouter()
  const { exerciceId, exerciceAnnee } = useAppStore()
  const [step, setStep] = useState(1)
  const [reserves, setReserves] = useState(0)
  const [dividendes, setDividendes] = useState(0)
  const [report, setReport] = useState(0)
  const [confirmed, setConfirmed] = useState(false)

  const { data: verification } = trpc.cloture.verifier.useQuery(
    { exerciceId },
    { enabled: !!exerciceId },
  )

  const executerMutation = trpc.cloture.executer.useMutation({
    onSuccess: (data) => {
      toast.success(`Exercice ${data.annee} clôturé avec succès`)
      router.push('/exercices')
    },
    onError: (err) => toast.error(err.message),
  })

  const resultat = verification?.resultat ?? 0

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Clôture — Exercice {exerciceAnnee}</h1>

      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 1 — Vérification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {verification?.equilibre ? (
                <CheckCircle className="text-green-500 h-5 w-5" />
              ) : (
                <XCircle className="text-red-500 h-5 w-5" />
              )}
              <span>Balance {verification?.equilibre ? 'équilibrée' : 'déséquilibrée'}</span>
            </div>
            <div className="text-sm text-gray-600">
              <p>{verification?.nbEcritures ?? 0} écritures</p>
              <p>Total Débit : {formatFCFA(verification?.totalDebit ?? 0)}</p>
              <p>Total Crédit : {formatFCFA(verification?.totalCredit ?? 0)}</p>
            </div>
            {verification?.avertissements.map((a) => (
              <div key={a} className="flex items-center gap-2 text-orange-600 text-sm">
                <AlertTriangle className="h-4 w-4" /> {a}
              </div>
            ))}
            <Button onClick={() => setStep(2)} disabled={!verification?.equilibre}>
              Suivant
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 2 — Résultat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`text-center p-6 rounded-lg ${resultat >= 0 ? 'bg-green-50' : 'bg-red-50'}`}
            >
              <p className="text-sm text-gray-500 mb-2">Résultat de l'exercice</p>
              <p
                className={`text-3xl font-bold ${resultat >= 0 ? 'text-green-700' : 'text-red-700'}`}
              >
                {formatFCFA(resultat)}
              </p>
              <Badge variant={resultat >= 0 ? 'default' : 'destructive'} className="mt-2">
                {resultat >= 0 ? 'Bénéfice' : 'Perte'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Précédent
              </Button>
              <Button
                onClick={() => {
                  if (resultat < 0) {
                    setReport(Math.abs(resultat))
                  }
                  setStep(3)
                }}
              >
                Suivant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 3 — Affectation du résultat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resultat >= 0 ? (
              <>
                <div>
                  <Label>Réserve légale</Label>
                  <Input
                    type="number"
                    value={reserves}
                    onChange={(e) => setReserves(Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div>
                  <Label>Dividendes</Label>
                  <Input
                    type="number"
                    value={dividendes}
                    onChange={(e) => setDividendes(Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div>
                  <Label>Report à nouveau</Label>
                  <Input
                    type="number"
                    value={report}
                    onChange={(e) => setReport(Number(e.target.value))}
                    min={0}
                  />
                </div>
                <p
                  className={`text-sm ${Math.abs(reserves + dividendes + report - resultat) <= 0.01 ? 'text-green-600' : 'text-red-600'}`}
                >
                  Total affecté : {formatFCFA(reserves + dividendes + report)} /{' '}
                  {formatFCFA(resultat)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600">
                Résultat déficitaire : reporté automatiquement à nouveau
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Précédent
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={
                  resultat >= 0 && Math.abs(reserves + dividendes + report - resultat) > 0.01
                }
              >
                Suivant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 4 — Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-300 p-4 rounded text-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="font-bold text-red-700">ACTION IRRÉVERSIBLE</p>
              <p className="text-sm text-red-600 mt-1">La clôture ne peut pas être annulée</p>
            </div>
            <div className="text-sm space-y-1">
              <p>Résultat : {formatFCFA(resultat)}</p>
              {resultat >= 0 && (
                <p>
                  Réserves : {formatFCFA(reserves)} | Dividendes : {formatFCFA(dividendes)} | Report
                  : {formatFCFA(report)}
                </p>
              )}
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span className="text-sm">
                Je confirme vouloir clôturer l'exercice {exerciceAnnee}
              </span>
            </label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                Précédent
              </Button>
              <Button onClick={() => setStep(5)} disabled={!confirmed}>
                Clôturer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 5 — Exécution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <Button
              size="lg"
              onClick={() =>
                executerMutation.mutate({
                  exerciceId,
                  affectation: { reserves, report, dividendes },
                })
              }
              disabled={executerMutation.isPending}
            >
              {executerMutation.isPending ? 'Clôture en cours...' : 'Confirmer la clôture'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
