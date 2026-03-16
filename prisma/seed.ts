import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { hashSync } from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' })
const prisma = new PrismaClient({ adapter })

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'sarl-demo-import-export' },
    update: {},
    create: {
      raisonSociale: 'SARL Démo Import-Export',
      slug: 'sarl-demo-import-export',
      formeJuridique: 'SARL',
      ninea: '12345678A',
      zone: 'UEMOA',
      plan: 'STARTER',
      pays: 'SN',
      ville: 'Dakar',
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      nom: 'Admin',
      prenom: 'Démo',
      password: hashSync('password123', 12),
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  })

  await prisma.exercice.upsert({
    where: { tenantId_annee: { tenantId: tenant.id, annee: 2026 } },
    update: {},
    create: {
      annee: 2026,
      libelle: 'Exercice 2026',
      statut: 'OUVERT',
      dateDebut: new Date('2026-01-01'),
      dateFin: new Date('2026-12-31'),
      tenantId: tenant.id,
    },
  })

  console.log('Seed completed: SARL Démo Import-Export + admin@demo.com + Exercice 2026')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
