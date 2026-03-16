import { NextResponse } from 'next/server'
import { compareSync } from 'bcryptjs'
import { prisma } from '@/server/db/prisma'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email: string; password: string }
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ message: 'Email et mot de passe requis' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.actif) {
      return NextResponse.json({ message: 'Email ou mot de passe incorrect' }, { status: 401 })
    }

    const valid = compareSync(password, user.password)
    if (!valid) {
      return NextResponse.json({ message: 'Email ou mot de passe incorrect' }, { status: 401 })
    }

    const response = NextResponse.json({
      message: 'Connexion réussie',
      user: { id: user.id, email: user.email, nom: user.nom, role: user.role, tenantId: user.tenantId },
    })

    response.cookies.set('better-auth.session_token', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ message: 'Erreur interne' }, { status: 500 })
  }
}
