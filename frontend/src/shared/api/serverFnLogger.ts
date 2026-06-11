import { apiLogger } from './apiLogger'

export async function callServerFn<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const [method, ...pathParts] = label.split(' ')
  const path = pathParts.join(' ') || label
  const resolvedMethod = method || 'RPC'

  apiLogger.logRequest(resolvedMethod, path)
  const start = performance.now()

  try {
    const result = await fn()
    const duration = Math.round(performance.now() - start)
    apiLogger.logResponse(resolvedMethod, path, 200, result, duration)
    return result
  } catch (error: any) {
    const duration = Math.round(performance.now() - start)
    apiLogger.logResponse(resolvedMethod, path, error?.status || 500, error?.message, duration)
    throw error
  }
}
