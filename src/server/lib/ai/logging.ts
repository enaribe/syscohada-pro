export function logAICall(params: {
  userId: string
  tenantId: string
  exerciceId: string
  action: string
  tokensUsed?: number
  latencyMs: number
  success: boolean
}) {
  console.log(
    `[AI] ${params.action} | tenant=${params.tenantId} | exercice=${params.exerciceId} | user=${params.userId} | ${params.latencyMs}ms | ${params.success ? 'OK' : 'FAIL'}${params.tokensUsed ? ` | ${params.tokensUsed} tokens` : ''}`,
  )
}
