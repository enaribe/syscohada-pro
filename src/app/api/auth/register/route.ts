import { hashSync } from 'bcryptjs'
import { NextResponse } from 'next/server'
import type { Zone } from '@/generated/prisma/enums'
import { generateSlug } from '@/lib/utils'
import { prisma } from '@/server/db/prisma'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      raisonSociale: string
      formeJuridique: string
      zone: Zone
      ninea?: string
      prenom: string
      nom: string
      email: string
      password: string
    }

    const { raisonSociale, formeJuridique, zone, ninea, prenom, nom, email, password } = body

    if (!raisonSociale || raisonSociale.length < 3) {
      return NextResponse.json(
        { message: 'La raison sociale doit comporter au moins 3 caractères' },
        { status: 400 },
      )
    }

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { message: 'Email et mot de passe requis (8 caractères minimum)' },
        { status: 400 },
      )
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ message: 'Un compte existe déjà avec cet email' }, { status: 409 })
    }

    const slug = generateSlug(raisonSociale)
    const existingTenant = await prisma.tenant.findUnique({ where: { slug } })
    if (existingTenant) {
      return NextResponse.json(
        { message: 'Une entreprise avec un nom similaire existe déjà' },
        { status: 409 },
      )
    }

    const currentYear = new Date().getFullYear()
    const hashedPassword = hashSync(password, 12)

    const tenant = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          raisonSociale,
          slug,
          formeJuridique,
          zone,
          ninea: ninea ?? null,
        },
      })

      const newUser = await tx.user.create({
        data: {
          email,
          nom,
          prenom,
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: newTenant.id,
        },
      })

      await tx.exercice.create({
        data: {
          annee: currentYear,
          libelle: `Exercice ${currentYear}`,
          statut: 'OUVERT',
          dateDebut: new Date(`${currentYear}-01-01`),
          dateFin: new Date(`${currentYear}-12-31`),
          tenantId: newTenant.id,
        },
      })

      return { tenant: newTenant, user: newUser }
    })

    const response = NextResponse.json(
      { message: 'Inscription réussie', tenantId: tenant.tenant.id, slug: tenant.tenant.slug },
      { status: 201 },
    )

    response.cookies.set('better-auth.session_token', tenant.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
