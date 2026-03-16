-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EXPERT', 'COMPTABLE', 'AUDITEUR', 'DIRIGEANT', 'COMMISSAIRE');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "Zone" AS ENUM ('UEMOA', 'CEMAC');

-- CreateEnum
CREATE TYPE "Journal" AS ENUM ('ACHAT', 'VENTE', 'BANQUE', 'CAISSE', 'OD', 'AN');

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('MANUEL', 'IA', 'IMPORT', 'RECURRENT');

-- CreateEnum
CREATE TYPE "MethodeAmort" AS ENUM ('LINEAIRE', 'DEGRESSIF');

-- CreateEnum
CREATE TYPE "TypeFlux" AS ENUM ('ENCAISSEMENT', 'DECAISSEMENT');

-- CreateEnum
CREATE TYPE "StatutExercice" AS ENUM ('OUVERT', 'CLOTURE');

-- CreateEnum
CREATE TYPE "Periodicite" AS ENUM ('MENSUELLE', 'BIMESTRIELLE', 'TRIMESTRIELLE', 'SEMESTRIELLE', 'ANNUELLE');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "raisonSociale" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "formeJuridique" TEXT,
    "ninea" TEXT,
    "rccm" TEXT,
    "secteur" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "pays" TEXT NOT NULL DEFAULT 'SN',
    "zone" "Zone" NOT NULL DEFAULT 'UEMOA',
    "plan" "Plan" NOT NULL DEFAULT 'STARTER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercice" (
    "id" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "libelle" TEXT,
    "statut" "StatutExercice" NOT NULL DEFAULT 'OUVERT',
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "archiveJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exercice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COMPTABLE',
    "tenantId" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "token" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "accepte" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ecriture" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "journal" "Journal" NOT NULL,
    "libelle" TEXT NOT NULL,
    "piece" TEXT,
    "tenantId" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "source" "Source" NOT NULL DEFAULT 'MANUEL',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ecriture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneEcriture" (
    "id" TEXT NOT NULL,
    "ecritureId" TEXT NOT NULL,
    "compte" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "debit" DECIMAL(18,2) NOT NULL,
    "credit" DECIMAL(18,2) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "LigneEcriture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Immobilisation" (
    "id" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "compteImmo" TEXT NOT NULL,
    "compteAmort" TEXT NOT NULL,
    "dateAcquisition" TIMESTAMP(3) NOT NULL,
    "valeurOrigine" DECIMAL(18,2) NOT NULL,
    "dureeVie" INTEGER NOT NULL,
    "methode" "MethodeAmort" NOT NULL DEFAULT 'LINEAIRE',
    "dateMiseEnService" TIMESTAMP(3),
    "dateCession" TIMESTAMP(3),
    "valeurCession" DECIMAL(18,2),
    "tenantId" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Immobilisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prevision" (
    "id" TEXT NOT NULL,
    "mois" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "categorie" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "type" "TypeFlux" NOT NULL,
    "montant" DECIMAL(18,2) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeleRecurrent" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "journal" "Journal" NOT NULL,
    "libelle" TEXT NOT NULL,
    "lignesJson" JSONB NOT NULL,
    "periodicite" "Periodicite" NOT NULL,
    "prochaineDate" TIMESTAMP(3) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModeleRecurrent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoriqueRecurrent" (
    "id" TEXT NOT NULL,
    "modeleId" TEXT NOT NULL,
    "dateGen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "HistoriqueRecurrent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "r2Key" TEXT NOT NULL,
    "ecritureId" TEXT,
    "tenantId" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Exercice_tenantId_idx" ON "Exercice"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Exercice_tenantId_annee_key" ON "Exercice"("tenantId", "annee");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_tenantId_idx" ON "Invitation"("tenantId");

-- CreateIndex
CREATE INDEX "Ecriture_tenantId_exerciceId_date_idx" ON "Ecriture"("tenantId", "exerciceId", "date");

-- CreateIndex
CREATE INDEX "Ecriture_tenantId_journal_idx" ON "Ecriture"("tenantId", "journal");

-- CreateIndex
CREATE INDEX "LigneEcriture_tenantId_compte_idx" ON "LigneEcriture"("tenantId", "compte");

-- CreateIndex
CREATE INDEX "Immobilisation_tenantId_exerciceId_idx" ON "Immobilisation"("tenantId", "exerciceId");

-- CreateIndex
CREATE INDEX "Prevision_tenantId_exerciceId_idx" ON "Prevision"("tenantId", "exerciceId");

-- CreateIndex
CREATE INDEX "ModeleRecurrent_tenantId_exerciceId_idx" ON "ModeleRecurrent"("tenantId", "exerciceId");

-- CreateIndex
CREATE INDEX "HistoriqueRecurrent_tenantId_idx" ON "HistoriqueRecurrent"("tenantId");

-- CreateIndex
CREATE INDEX "Document_tenantId_exerciceId_idx" ON "Document"("tenantId", "exerciceId");

-- AddForeignKey
ALTER TABLE "Exercice" ADD CONSTRAINT "Exercice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ecriture" ADD CONSTRAINT "Ecriture_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "Exercice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneEcriture" ADD CONSTRAINT "LigneEcriture_ecritureId_fkey" FOREIGN KEY ("ecritureId") REFERENCES "Ecriture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Immobilisation" ADD CONSTRAINT "Immobilisation_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "Exercice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prevision" ADD CONSTRAINT "Prevision_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "Exercice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeleRecurrent" ADD CONSTRAINT "ModeleRecurrent_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "Exercice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriqueRecurrent" ADD CONSTRAINT "HistoriqueRecurrent_modeleId_fkey" FOREIGN KEY ("modeleId") REFERENCES "ModeleRecurrent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "Exercice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
