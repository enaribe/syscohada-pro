import { prisma } from '@/server/db/prisma'
import { AI_MODEL, anthropic } from '@/server/lib/ai/client'
import { SYSTEM_PROMPT } from '@/server/lib/ai/prompts'
import { calculerBalance } from '@/server/lib/syscohada/balance'
import { calculerKPIs } from '@/server/lib/syscohada/kpis'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message: string
      historique: { role: 'user' | 'assistant'; content: string }[]
      tenantId: string
      exerciceId: string
    }

    const { message, historique, tenantId, exerciceId } = body

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    const exercice = await prisma.exercice.findUnique({ where: { id: exerciceId } })
    if (!tenant || !exercice) {
      return new Response('Entreprise ou exercice introuvable', { status: 404 })
    }

    // Build context
    const kpis = await calculerKPIs(tenantId, exerciceId)
    const balance = await calculerBalance(tenantId, exerciceId)
    const top10Balance = balance.slice(0, 10)

    const recentEcritures = await prisma.ecriture.findMany({
      where: { tenantId, exerciceId, deletedAt: null },
      include: { lignes: true },
      orderBy: { date: 'desc' },
      take: 5,
    })

    const contextStr = `=== ${tenant.raisonSociale} — Exercice ${exercice.annee} ===
KPIs: CA=${kpis.chiffreAffaires} | Charges=${kpis.charges} | Résultat=${kpis.resultat} | Tréso=${kpis.tresorerie}
Créances=${kpis.creances} | Dettes=${kpis.dettes} | TVA nette=${kpis.tvaNette}
Balance résumée (10 principaux): ${top10Balance.map((b) => `${b.compte}:${b.intitule}(D:${b.totalDebit}/C:${b.totalCredit})`).join(', ')}
5 dernières écritures: ${recentEcritures.map((e) => `${e.date.toISOString().split('T')[0]}|${e.journal}|${e.libelle}`).join('; ')}`

    const systemPrompt = `${SYSTEM_PROMPT({
      raisonSociale: tenant.raisonSociale,
      zone: tenant.zone as 'UEMOA' | 'CEMAC',
      exercice: exercice.annee,
    })}

CONTEXTE COMPTABLE ACTUEL :
${contextStr}

Tu peux répondre en texte libre (pas uniquement en JSON). Sois précis et utile.`

    const messages = [
      ...historique.slice(-10).map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const stream = await anthropic.messages.stream({
      model: AI_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`),
            )
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat error:', error)
    return new Response('Erreur interne', { status: 500 })
  }
}
