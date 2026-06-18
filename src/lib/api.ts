export class ApiRequestError extends Error {
  status: number
  retryAfter: number | null

  constructor(message: string, status: number, retryAfter: number | null = null) {
    super(message)
    this.status = status
    this.retryAfter = retryAfter
  }
}

export async function authenticatedJson<T>(
  getAccessToken: () => Promise<string | null>,
  url: string,
  body: unknown,
): Promise<T> {
  const token = await getAccessToken()
  if (!token) throw new ApiRequestError('Сессия истекла. Войдите в аккаунт заново.', 401)

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiRequestError('Нет связи с сервером. Проверьте интернет и повторите.', 0)
  }

  const payload = await response.json().catch(() => null) as (T & { error?: string }) | null
  if (!response.ok) {
    const retryHeader = response.headers.get('Retry-After')
    const retryAfter = retryHeader ? Number.parseInt(retryHeader, 10) : null
    throw new ApiRequestError(payload?.error || `Сервер вернул ошибку ${response.status}`, response.status, Number.isFinite(retryAfter) ? retryAfter : null)
  }
  if (!payload) throw new ApiRequestError('Сервер вернул пустой ответ', 502)
  return payload
}
