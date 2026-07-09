import type { DraftRow, ThreadsAccountRow } from '../../src/lib/database.types.js'

const MAX_TEXT_LENGTH = 500
const MAX_LINKS = 5
const MAX_IMAGE_SIZE = 8 * 1024 * 1024
const MAX_VIDEO_SIZE = 100 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime']
const LINK_REGEX = /https?:\/\/[^\s)]+/g

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface DraftValidation {
  ok: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

export function validateDraftPublish(draft: DraftRow, account: ThreadsAccountRow): DraftValidation {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  if (!draft.content?.trim()) {
    errors.push({ field: 'content', message: 'Текст публикации не может быть пустым', code: 'EMPTY_CONTENT' })
  } else {
    if (draft.content.length > MAX_TEXT_LENGTH) {
      errors.push({ field: 'content', message: `Текст не должен превышать ${MAX_TEXT_LENGTH} символов (сейчас ${draft.content.length})`, code: 'TEXT_TOO_LONG' })
    }
    const links = draft.content.match(LINK_REGEX)
    if (links && links.length > MAX_LINKS) {
      errors.push({ field: 'content', message: `Допустимо не более ${MAX_LINKS} ссылок (найдено ${links.length})`, code: 'TOO_MANY_LINKS' })
    }
    if (links && links.filter((l) => !l.startsWith('https://threads.net/') && !l.startsWith('https://www.threads.net/')).length > 0) {
      warnings.push({ field: 'content', message: 'Не-Treads ссылки не кликабельны в Threads', code: 'EXTERNAL_LINKS' })
    }
  }

  if (!['approved', 'scheduled'].includes(draft.status)) {
    errors.push({ field: 'status', message: 'Материал не согласован к публикации', code: 'NOT_APPROVED' })
  }

  if (!account) {
    errors.push({ field: 'account', message: 'Аккаунт Threads не выбран или не найден', code: 'NO_ACCOUNT' })
  } else {
    if (account.status === 'expired') {
      errors.push({ field: 'account', message: 'Токен аккаунта истёк. Подключите аккаунт заново.', code: 'TOKEN_EXPIRED' })
    }
    if (account.status === 'error') {
      errors.push({ field: 'account', message: 'Аккаунт Threads в ошибочном состоянии', code: 'ACCOUNT_ERROR' })
    }
    if (account.status === 'pending') {
      warnings.push({ field: 'account', message: 'OAuth-подключение ещё не завершено', code: 'ACCOUNT_PENDING' })
    }
  }

  if (draft.scheduled_at && new Date(draft.scheduled_at).getTime() <= Date.now()) {
    warnings.push({ field: 'scheduled_at', message: 'Дата публикации в прошлом', code: 'SCHEDULE_IN_PAST' })
  }

  return { ok: errors.length === 0, errors, warnings }
}

export function validateMediaForThreads(mimeType: string, sizeBytes: number): ValidationError | null {
  if (mimeType.startsWith('image/')) {
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return { field: 'media', message: `Формат изображения не поддерживается Threads. Допустимы: JPEG, PNG, GIF, WebP`, code: 'UNSUPPORTED_IMAGE' }
    }
    if (sizeBytes > MAX_IMAGE_SIZE) {
      return { field: 'media', message: `Изображение не должно превышать 8 МБ`, code: 'IMAGE_TOO_LARGE' }
    }
  } else if (mimeType.startsWith('video/')) {
    if (!ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      return { field: 'media', message: `Формат видео не поддерживается Threads. Допустимы: MP4, MOV`, code: 'UNSUPPORTED_VIDEO' }
    }
    if (sizeBytes > MAX_VIDEO_SIZE) {
      return { field: 'media', message: `Видео не должно превышать 100 МБ`, code: 'VIDEO_TOO_LARGE' }
    }
  }
  return null
}

export function validateDraftContent(content: string): ValidationError[] {
  const errors: ValidationError[] = []
  if (!content?.trim()) return [{ field: 'content', message: 'Контент не может быть пустым', code: 'EMPTY_CONTENT' }]
  if (content.length > MAX_TEXT_LENGTH) errors.push({ field: 'content', message: `Максимум ${MAX_TEXT_LENGTH} символов`, code: 'TEXT_TOO_LONG' })
  const links = content.match(LINK_REGEX)
  if (links && links.length > MAX_LINKS) errors.push({ field: 'content', message: `Максимум ${MAX_LINKS} ссылок`, code: 'TOO_MANY_LINKS' })
  return errors
}
