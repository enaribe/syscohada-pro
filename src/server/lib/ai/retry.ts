export async function withAIRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
): Promise<T | { fallback: true; message: string }> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const statusCode = (error as { status?: number }).status
      if (statusCode === 529 || statusCode === 503) {
        const delay = 2 ** attempt * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  console.error('AI retry exhausted:', lastError)
  return { fallback: true, message: 'Service IA temporairement indisponible. Mode manuel activé.' }
}
