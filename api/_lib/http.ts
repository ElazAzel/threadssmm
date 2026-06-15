export interface ApiRequest {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
  query?: Record<string, string | string[] | undefined>
}

export interface ApiResponse {
  setHeader(name: string, value: string): void
  status(code: number): ApiResponse
  json(body: unknown): void
  redirect(status: number, url: string): void
}

export function getBearerToken(request: ApiRequest) {
  const value = request.headers.authorization
  const header = Array.isArray(value) ? value[0] : value
  return header?.startsWith('Bearer ') ? header.slice(7) : null
}
