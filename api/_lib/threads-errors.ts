const ERROR_MAP: Record<string, { message: string; retryable: boolean; httpStatus: number }> = {
  DRAFT_NOT_FOUND: { message: 'Черновик не найден', retryable: false, httpStatus: 404 },
  DRAFT_NOT_APPROVED: { message: 'Сначала согласуйте материал', retryable: false, httpStatus: 400 },
  ACCOUNT_NOT_SELECTED: { message: 'Выберите Threads-аккаунт', retryable: false, httpStatus: 400 },
  THREADS_ACCOUNT_NOT_CONNECTED: { message: 'Подключите официальный Threads OAuth', retryable: false, httpStatus: 400 },
  THREADS_TEXT_LIMIT: { message: 'Текст должен быть от 1 до 500 символов', retryable: false, httpStatus: 400 },
  THREADS_TOKEN_NOT_FOUND: { message: 'Токен Threads не найден', retryable: false, httpStatus: 400 },
  THREADS_TOKEN_EXPIRED: { message: 'Токен Threads истёк, подключите аккаунт заново', retryable: false, httpStatus: 400 },
  THREADS_CONTAINER_FAILED: { message: 'Threads не принял медиа-контейнер', retryable: true, httpStatus: 502 },
  THREADS_PUBLISH_FAILED: { message: 'Threads отклонил публикацию', retryable: true, httpStatus: 502 },
  THREADS_CRYPTO_NOT_CONFIGURED: { message: 'Шифрование токенов не настроено', retryable: false, httpStatus: 503 },
  THREADS_API_ERROR: { message: 'Ошибка API Threads', retryable: true, httpStatus: 502 },
  RATE_LIMITED: { message: 'Слишком много запросов. Повторите позже.', retryable: true, httpStatus: 429 },
  UNAUTHORIZED: { message: 'Войдите в аккаунт заново', retryable: false, httpStatus: 401 },
  SUPABASE_SERVER_NOT_CONFIGURED: { message: 'Серверная часть Supabase не настроена', retryable: false, httpStatus: 503 },
  INVALID_OAUTH_STATE: { message: 'Недействительная OAuth-сессия', retryable: false, httpStatus: 400 },
  INVALID_ENCRYPTED_TOKEN: { message: 'Повреждённый зашифрованный токен', retryable: false, httpStatus: 400 },
  POST_NOT_SCHEDULED: { message: 'Публикация не имеет даты', retryable: false, httpStatus: 400 },
  ALREADY_PUBLISHED: { message: 'Публикация уже опубликована', retryable: false, httpStatus: 400 },
  MEDIA_TOO_LARGE: { message: 'Файл превышает лимит Threads', retryable: false, httpStatus: 400 },
  MEDIA_UNSUPPORTED: { message: 'Неподдерживаемый формат файла', retryable: false, httpStatus: 400 },
  TOO_MANY_LINKS: { message: 'В одном сообщении допустимо не более 5 ссылок', retryable: false, httpStatus: 400 },
  THREAD_TOO_LONG: { message: 'Цепочка Threads не может содержать более 25 постов', retryable: false, httpStatus: 400 },
  UNKNOWN: { message: 'Неизвестная ошибка', retryable: false, httpStatus: 500 },
}

export class ThreadsError extends Error {
  code: string
  retryable: boolean
  httpStatus: number

  constructor(code: string, details?: string) {
    const def = ERROR_MAP[code] ?? ERROR_MAP.UNKNOWN
    super(details ? `${def.message}: ${details}` : def.message)
    this.code = code
    this.retryable = def.retryable
    this.httpStatus = def.httpStatus
  }
}

export function getPublicError(code: string): string {
  return ERROR_MAP[code]?.message ?? ERROR_MAP.UNKNOWN.message
}

export function threadsErrorResponse(error: unknown, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  const code = error instanceof Error ? error.message : 'UNKNOWN'
  if (error instanceof ThreadsError) {
    if (error.httpStatus === 429) response.status(429).json({ error: error.message, retryable: true, retryAfter: 60 })
    else response.status(error.httpStatus).json({ error: error.message, code: error.code, retryable: error.retryable })
  } else if (code === 'RATE_LIMITED') response.status(429).json({ error: ERROR_MAP.RATE_LIMITED.message, retryable: true, retryAfter: 60 })
  else response.status(ERROR_MAP[code]?.httpStatus ?? 500).json({ error: getPublicError(code), code, retryable: ERROR_MAP[code]?.retryable ?? false })
}

export function threadsErrorResponseRaw(code: string, response: { status: (n: number) => { json: (b: unknown) => void } }) {
  const def = ERROR_MAP[code] ?? ERROR_MAP.UNKNOWN
  response.status(def.httpStatus).json({ error: def.message, code, retryable: def.retryable })
}
