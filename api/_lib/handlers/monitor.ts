import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { XMLParser } from 'fast-xml-parser'
import type { ApiRequest, ApiResponse } from '../http.js'
import { enforceRateLimit, RateLimitError, requireUser } from '../supabaseServer.js'

interface RssBody {
  workspaceId: string
  url: string
}

function isBody(value: unknown): value is RssBody {
  if (!value || typeof value !== 'object') return false
  const body = value as Partial<RssBody>
  return typeof body.workspaceId === 'string' && typeof body.url === 'string'
}

function privateIp(address: string) {
  if (!isIP(address)) return true
  if (address.includes(':')) return address === '::1' || address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:')
  const parts = address.split('.').map(Number)
  return parts[0] === 10 || parts[0] === 127 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168)
}

async function validateUrl(raw: string) {
  const url = new URL(raw)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('INVALID_URL')
  if (url.username || url.password || url.hostname === 'localhost' || url.hostname.endsWith('.local')) throw new Error('INVALID_URL')
  const addresses = await lookup(url.hostname, { all: true })
  if (!addresses.length || addresses.some((item) => privateIp(item.address))) throw new Error('INVALID_URL')
  return url
}

async function fetchFeed(raw: string, redirects = 0): Promise<{ url: URL; xml: string }> {
  if (redirects > 3) throw new Error('TOO_MANY_REDIRECTS')
  const url = await validateUrl(raw)
  const result = await fetch(url, { redirect: 'manual', headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' }, signal: AbortSignal.timeout(10_000) })
  if (result.status >= 300 && result.status < 400) {
    const location = result.headers.get('location')
    if (!location) throw new Error('INVALID_REDIRECT')
    return fetchFeed(new URL(location, url).toString(), redirects + 1)
  }
  if (!result.ok) throw new Error('FEED_UNAVAILABLE')
  const contentLength = Number(result.headers.get('content-length') || 0)
  if (contentLength > 1_000_000) throw new Error('FEED_TOO_LARGE')
  const xml = await result.text()
  if (xml.length > 1_000_000) throw new Error('FEED_TOO_LARGE')
  if (/<!DOCTYPE/i.test(xml)) throw new Error('INVALID_FEED')
  return { url, xml }
}

function array<T>(value: T | T[] | undefined): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value]
}

function text(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && '#text' in value) return text((value as { '#text': unknown })['#text'])
  return ''
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST') return response.status(405).json({ error: 'Метод не поддерживается' })
  if (!isBody(request.body)) return response.status(400).json({ error: 'Укажите корректный RSS URL' })
  const body = request.body

  try {
    const { user, admin } = await requireUser(request)
    const { data: membership } = await admin.from('workspace_members').select('role').eq('workspace_id', body.workspaceId).eq('user_id', user.id).maybeSingle()
    if (!membership) return response.status(403).json({ error: 'Нет доступа к рабочему пространству' })
    await enforceRateLimit(admin, 'monitor.rss', user.id, 10, 600)

    const feed = await fetchFeed(body.url)
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', trimValues: true })
    const document = parser.parse(feed.xml) as Record<string, unknown>
    const rss = document.rss as { channel?: Record<string, unknown> } | undefined
    const atom = document.feed as Record<string, unknown> | undefined
    const channel = rss?.channel
    const feedTitle = text(channel?.title ?? atom?.title) || feed.url.hostname
    const rawItems = channel ? array(channel.item) : array(atom?.entry)

    const { data: source, error: sourceError } = await admin.from('monitor_sources').upsert({ workspace_id: body.workspaceId, type: 'rss', name: feedTitle, value: feed.url.toString(), active: true, last_checked_at: new Date().toISOString(), last_error: null }, { onConflict: 'workspace_id,type,value' }).select('*').single()
    if (sourceError) throw sourceError

    const items = rawItems.slice(0, 30).map((raw) => {
      const item = raw as Record<string, unknown>
      const linkValue = item.link
      const link = typeof linkValue === 'object' && linkValue ? text((linkValue as Record<string, unknown>)['@_href']) : text(linkValue)
      const parsedItemUrl = link ? new URL(link, feed.url) : feed.url
      const itemUrl = ['http:', 'https:'].includes(parsedItemUrl.protocol) ? parsedItemUrl.toString() : feed.url.toString()
      const publishedValue = text(item.pubDate ?? item.published ?? item.updated)
      const publishedTimestamp = Date.parse(publishedValue)
      return {
        workspace_id: body.workspaceId,
        source_id: source.id,
        external_id: text(item.guid ?? item.id) || itemUrl,
        url: itemUrl,
        author: text(item.author ?? item.creator ?? item['dc:creator']),
        title: text(item.title) || 'Материал без заголовка',
        summary: text(item.description ?? item.summary ?? item.content).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000),
        published_at: Number.isNaN(publishedTimestamp) ? null : new Date(publishedTimestamp).toISOString(),
        relevance_score: 50,
        urgency: 'normal' as const,
        sentiment: 'neutral' as const,
        recommendation: 'post' as const,
      }
    })
    if (items.length) {
      const { error: itemError } = await admin.from('monitor_items').upsert(items, { onConflict: 'workspace_id,url', ignoreDuplicates: false })
      if (itemError) throw itemError
    }
    response.status(200).json({ imported: items.length, source: feedTitle })
  } catch (error) {
    const code = error instanceof Error ? error.message : ''
    if (error instanceof RateLimitError) {
      response.setHeader('Retry-After', String(error.retryAfter))
      response.status(429).json({ error: `Слишком много запросов. Повторите через ${error.retryAfter} сек.` })
    } else if (code === 'UNAUTHORIZED') response.status(401).json({ error: 'Войдите в аккаунт заново' })
    else if (['INVALID_URL', 'TOO_MANY_REDIRECTS', 'INVALID_REDIRECT'].includes(code)) response.status(400).json({ error: 'Этот RSS URL небезопасен или некорректен' })
    else response.status(502).json({ error: 'Не удалось прочитать RSS-ленту' })
  }
}
