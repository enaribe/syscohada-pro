import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'
import { AI_MAX_TOKENS, AI_MODEL, anthropic } from '@/server/lib/ai/client'
import { parseEcritureIA, parseOcrResult } from '@/server/lib/ai/parsers'
import { OCR_PROMPT, SYSTEM_PROMPT } from '@/server/lib/ai/prompts'
import { checkRateLimit } from '@/server/lib/ai/rate-limit'
import { createTRPCRouter } from '../context'
import { roleGuard } from '../middleware'

type LigneIA = {
  compte: string
  intitule: string
  debit: number
  credit: number
}

type GenererResult = {
  lignes: LigneIA[]
  explication: string
  fallback?: boolean
}

type OcrResultType =
  | {
      fournisseur: string
      date: string
      numero: string
      montantHT: number
      tva: number
      totalTTC: number
      ecritureProposee: { lignes: LigneIA[] }
    }
  | {
      fallback: true
      message: string
    }

export const iaRouter = createTRPCRouter({
  genererEcriture: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE'])
    .input(
      z.object({
        description: z.string().min(5),
        exerciceId: z.string(),
        date: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<GenererResult> => {
      await checkRateLimit(ctx.user.id, 'ia', 20, 60)

      const exercice = await ctx.rawDb.exercice.findUnique({
        where: { id: input.exerciceId },
      })
      if (!exercice || exercice.tenantId !== ctx.entrepriseId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Exercice introuvable' })
      }
      if (exercice.statut !== 'OUVERT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Exercice clôturé — génération IA impossible',
        })
      }

      const tenant = await ctx.rawDb.tenant.findUnique({
        where: { id: ctx.entrepriseId },
      })
      if (!tenant) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Entreprise introuvable' })
      }

      try {
        const response = await anthropic.messages.create({
          model: AI_MODEL,
          max_tokens: AI_MAX_TOKENS,
          system: SYSTEM_PROMPT({
            raisonSociale: tenant.raisonSociale,
            zone: tenant.zone as 'UEMOA' | 'CEMAC',
            exercice: exercice.annee,
          }),
          messages: [
            {
              role: 'user',
              content: `Génère l'écriture comptable pour : ${input.description}${input.date ? ` en date du ${input.date}` : ''}`,
            },
          ],
        })

        const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
        const parsed = parseEcritureIA(text)

        if (!parsed) {
          return {
            lignes: [],
            explication: 'Impossible de générer une écriture valide. Utilisez le mode manuel.',
            fallback: true,
          }
        }

        return parsed
      } catch (error) {
        const statusCode = (error as { status?: number }).status
        if (statusCode === 529 || statusCode === 503) {
          return {
            lignes: [],
            explication: 'Service IA temporairement indisponible. Mode manuel activé.',
            fallback: true,
          }
        }
        throw error
      }
    }),

  ocrFacture: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE'])
    .input(
      z.object({
        fileBase64: z.string(),
        mimeType: z.string(),
        exerciceId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<OcrResultType> => {
      await checkRateLimit(ctx.user.id, 'ia', 20, 60)

      const exercice = await ctx.rawDb.exercice.findUnique({
        where: { id: input.exerciceId },
      })
      if (!exercice || exercice.statut !== 'OUVERT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Exercice clôturé ou introuvable',
        })
      }

      // Check file size (base64 is ~33% larger than binary)
      const sizeBytes = (input.fileBase64.length * 3) / 4
      if (sizeBytes > 10 * 1024 * 1024) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Fichier trop volumineux (max 10 Mo)',
        })
      }

      try {
        const mediaType = input.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
        const response = await anthropic.messages.create({
          model: AI_MODEL,
          max_tokens: AI_MAX_TOKENS,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mediaType, data: input.fileBase64 },
                },
                { type: 'text', text: OCR_PROMPT },
              ],
            },
          ],
        })

        const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
        const parsed = parseOcrResult(text)

        if (!parsed) {
          return {
            fallback: true,
            message: 'Impossible de lire cette facture. Saisie manuelle requise.',
          }
        }

        return parsed
      } catch {
        return { fallback: true, message: 'Erreur OCR. Saisie manuelle requise.' }
      }
    }),
})
