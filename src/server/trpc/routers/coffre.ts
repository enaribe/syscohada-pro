import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'
import { deleteFile, generateR2Key, getDownloadUrl, getUploadUrl } from '@/server/lib/r2'
import { createTRPCRouter } from '../context'
import { exerciceProcedure, roleGuard } from '../middleware'

type DocumentResult = {
  id: string
  nom: string
  type: string
  taille: number
  r2Key: string
  ecritureId: string | null
  tenantId: string
  exerciceId: string
  createdAt: Date
}

export const coffreRouter = createTRPCRouter({
  list: exerciceProcedure
    .input(z.object({ filtre: z.string().optional() }).optional())
    .query(async ({ ctx, input }): Promise<DocumentResult[]> => {
      const where: Record<string, unknown> = {
        tenantId: ctx.entrepriseId,
        exerciceId: ctx.exerciceId,
      }
      if (input?.filtre) {
        where.nom = { contains: input.filtre, mode: 'insensitive' }
      }
      return ctx.rawDb.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })
    }),

  getUploadUrl: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE'])
    .input(
      z.object({
        filename: z.string().min(1),
        contentType: z.string().min(1),
        taille: z.number().positive(),
        exerciceId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const exercice = await ctx.rawDb.exercice.findUnique({ where: { id: input.exerciceId } })
      if (!exercice || exercice.statut !== 'OUVERT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Exercice clôturé' })
      }

      const r2Key = generateR2Key(ctx.entrepriseId, input.exerciceId, input.filename)
      const uploadUrl = await getUploadUrl(r2Key, input.contentType)

      return { uploadUrl, r2Key }
    }),

  confirmerUpload: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE'])
    .input(
      z.object({
        nom: z.string().min(1),
        type: z.string(),
        taille: z.number(),
        r2Key: z.string(),
        exerciceId: z.string(),
        ecritureId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<DocumentResult> => {
      return ctx.rawDb.document.create({
        data: {
          nom: input.nom,
          type: input.type,
          taille: input.taille,
          r2Key: input.r2Key,
          ecritureId: input.ecritureId ?? null,
          tenantId: ctx.entrepriseId,
          exerciceId: input.exerciceId,
        },
      })
    }),

  getDownloadUrl: exerciceProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.rawDb.document.findFirst({
        where: { id: input.id, tenantId: ctx.entrepriseId },
      })
      if (!doc) throw new TRPCError({ code: 'NOT_FOUND' })
      const url = await getDownloadUrl(doc.r2Key)
      return { url, nom: doc.nom }
    }),

  delete: roleGuard(['ADMIN', 'EXPERT'])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<{ success: boolean }> => {
      const doc = await ctx.rawDb.document.findFirst({
        where: { id: input.id, tenantId: ctx.entrepriseId },
      })
      if (!doc) throw new TRPCError({ code: 'NOT_FOUND' })
      await deleteFile(doc.r2Key)
      await ctx.rawDb.document.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
