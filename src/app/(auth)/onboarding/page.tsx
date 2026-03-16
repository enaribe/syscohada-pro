'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Bienvenue sur SYSCOHADA Pro !</CardTitle>
          <p className="text-gray-500 mt-2">
            Votre entreprise est créée et votre exercice comptable est ouvert.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">Que souhaitez-vous faire en premier ?</p>

          <div className="grid gap-3">
            <Link href="/journal">
              <Button variant="outline" className="w-full">
                Saisir ma première écriture
              </Button>
            </Link>
            <Link href="/profil-entreprise">
              <Button variant="outline" className="w-full">
                Configurer mon profil entreprise
              </Button>
            </Link>
            <Link href="/utilisateurs">
              <Button variant="outline" className="w-full">
                Inviter un collègue
              </Button>
            </Link>
          </div>

          <Link href="/dashboard">
            <Button className="w-full mt-4">Commencer →</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
