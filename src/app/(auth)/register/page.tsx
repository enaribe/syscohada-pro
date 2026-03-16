'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const FORMES_JURIDIQUES = ['SARL', 'SA', 'EURL', 'SAS', 'GIE', 'Autre'] as const
const ZONES = ['UEMOA', 'CEMAC'] as const

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [raisonSociale, setRaisonSociale] = useState('')
  const [formeJuridique, setFormeJuridique] = useState('SARL')
  const [zone, setZone] = useState<'UEMOA' | 'CEMAC'>('UEMOA')
  const [ninea, setNinea] = useState('')

  // Step 2
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const passwordRules = [
    { label: 'Au moins 8 caractères', valid: password.length >= 8 },
    { label: 'Une majuscule', valid: /[A-Z]/.test(password) },
    { label: 'Un chiffre', valid: /\d/.test(password) },
  ]
  const passwordValid = passwordRules.every((r) => r.valid)
  const passwordsMatch = password === confirmPassword && password.length > 0

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    if (raisonSociale.length < 3) {
      setError('La raison sociale doit comporter au moins 3 caractères')
      return
    }
    setError('')
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordValid || !passwordsMatch) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raisonSociale,
          formeJuridique,
          zone,
          ninea: ninea || undefined,
          prenom,
          nom,
          email,
          password,
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { message?: string }
        setError(data.message ?? "Erreur lors de l'inscription")
        return
      }

      router.push('/onboarding')
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">SYSCOHADA Pro</CardTitle>
          <CardDescription>
            {step === 1
              ? 'Étape 1/2 — Votre entreprise'
              : 'Étape 2/2 — Votre compte administrateur'}
          </CardDescription>
          <div className="flex gap-2 justify-center mt-2">
            <div className={`h-1 w-16 rounded ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`h-1 w-16 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <Label htmlFor="raisonSociale">Raison sociale *</Label>
                <Input
                  id="raisonSociale"
                  value={raisonSociale}
                  onChange={(e) => setRaisonSociale(e.target.value)}
                  placeholder="SARL Koffi Import-Export"
                  required
                  minLength={3}
                />
              </div>

              <div>
                <Label htmlFor="formeJuridique">Forme juridique</Label>
                <select
                  id="formeJuridique"
                  value={formeJuridique}
                  onChange={(e) => setFormeJuridique(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {FORMES_JURIDIQUES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="zone">Zone fiscale</Label>
                <select
                  id="zone"
                  value={zone}
                  onChange={(e) => setZone(e.target.value as 'UEMOA' | 'CEMAC')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="ninea">NINEA (optionnel)</Label>
                <Input
                  id="ninea"
                  value={ninea}
                  onChange={(e) => setNinea(e.target.value)}
                  placeholder="Peut être renseigné plus tard"
                />
              </div>

              <Button type="submit" className="w-full">
                Continuer →
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nom">Nom</Label>
                  <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email professionnel</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <ul className="mt-1 space-y-0.5">
                  {passwordRules.map((rule) => (
                    <li
                      key={rule.label}
                      className={`text-xs ${rule.valid ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {rule.valid ? '✓' : '○'} {rule.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-500 mt-1">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  ← Retour
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading || !passwordValid || !passwordsMatch}
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-4">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
