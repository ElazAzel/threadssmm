import { createServer } from 'node:http'
import { readFile, realpath, stat } from 'node:fs/promises'
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const defaultDist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')
const modelPattern = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,199}$/
const cloudName = (name) => typeof name === 'string' && /(?:^|[/:._-])cloud(?:$|[/:._-])/i.test(name)
const remoteDescriptor = (data) => !!data && typeof data === 'object' && Object.entries(data).some(([key, value]) => (/^(?:remote[_-]?(?:host|model)|cloud)$/i.test(key) && value !== '' && value !== null && value !== false) || (['name', 'model', 'parent_model'].includes(key) && cloudName(value)) || (typeof value === 'object' && remoteDescriptor(value)))
const localDescriptor = (data) => !remoteDescriptor(data) && data?.details?.format === 'gguf' && typeof data?.model_info?.['general.architecture'] === 'string' && data.model_info['general.architecture'].length > 0
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8' }
const fail = (status, message) => Object.assign(new Error(message), { status })
const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)) }
const contained = (root, path) => { const rel = relative(root, path); return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel)) }
const localHost = (value) => /^(localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/.test(value || '')

async function boundedJson(response, limit) {
  if (!response.ok) throw fail(502, 'Локальная модель вернула ошибку.')
  const reader = response.body?.getReader()
  if (!reader) throw fail(502, 'Пустой ответ локальной модели.')
  const chunks = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > limit) throw fail(502, 'Ответ локальной модели слишком большой.')
      chunks.push(Buffer.from(value))
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } finally { await reader.cancel().catch(() => {}) }
}

export function createLocalServer({ fetchImpl = globalThis.fetch, distDir = defaultDist, timeoutMs = 90000 } = {}) {
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
    try {
      if (!localHost(req.headers.host)) throw fail(403, 'Разрешён только локальный адрес.')
      if (req.headers['sec-fetch-site'] === 'cross-site') throw fail(403, 'Межсайтовый запрос запрещён.')
      const path = decodeURIComponent((req.url || '/').split('?')[0])
      if (!path.startsWith('/') || path.includes('\\') || path.includes('\0') || path.split('/').includes('..')) throw fail(400, 'Недопустимый путь.')
      if (path === '/local/health' && req.method === 'GET') {
        try {
          const response = await fetchImpl('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(Math.min(timeoutMs, 5000)), redirect: 'error' })
          const data = await boundedJson(response, 1024 * 1024)
          if (!Array.isArray(data.models)) throw new Error('Invalid models')
          const models = data.models.filter((item) => !remoteDescriptor(item)).map((item) => item?.name).filter((name) => typeof name === 'string' && modelPattern.test(name) && !name.includes('..'))
          return json(res, 200, { available: true, models })
        } catch { return json(res, 200, { available: false, models: [], error: 'Ollama недоступна. Запустите её локально.' }) }
      }
      if (path === '/local/generate' && req.method === 'POST') {
        if (req.headers.origin !== `http://${req.headers.host}`) throw fail(403, 'Требуется запрос с этой локальной страницы.')
        if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type'] || '')) throw fail(415, 'Требуется application/json.')
        if (Number(req.headers['content-length']) > 65536) throw fail(413, 'Запрос слишком большой.')
        const chunks = []
        let bytes = 0
        for await (const chunk of req.iterator({ destroyOnReturn: false })) {
          bytes += chunk.length
          if (bytes > 65536) { req.resume(); throw fail(413, 'Запрос слишком большой.') }
          chunks.push(chunk)
        }
        let data
        try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw fail(400, 'Некорректный JSON.') }
        if (!data || typeof data.model !== 'string' || !modelPattern.test(data.model) || data.model.includes('..') || typeof data.prompt !== 'string' || !data.prompt.trim() || data.prompt.length > 32000) throw fail(400, 'Укажите модель и запрос до 32 000 символов.')
        if (cloudName(data.model)) throw fail(400, 'Облачные модели запрещены. Выберите локальную GGUF-модель.')
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        const disconnect = () => { if (!res.writableEnded) controller.abort() }
        res.on('close', disconnect)
        try {
          const inspection = await fetchImpl('http://127.0.0.1:11434/api/show', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: data.model, verbose: false }), signal: controller.signal, redirect: 'error' })
          const descriptor = await boundedJson(inspection, 1024 * 1024)
          if (!localDescriptor(descriptor)) throw fail(400, 'Локальность модели не подтверждена. Разрешены только локальные GGUF-модели без удалённых подключений.')
          const response = await fetchImpl('http://127.0.0.1:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: data.model, prompt: data.prompt, stream: false, options: { temperature: 0.7, num_predict: 1200 } }), signal: controller.signal, redirect: 'error' })
          const output = await boundedJson(response, 1024 * 1024)
          if (typeof output.response !== 'string' || output.response.length > 100000) throw fail(502, 'Некорректный или слишком большой ответ модели.')
          return json(res, 200, { text: output.response })
        } catch (error) {
          throw fail(controller.signal.aborted ? 504 : error.status || 502, controller.signal.aborted ? 'Время ожидания модели истекло.' : error.status ? error.message : 'Не удалось получить ответ Ollama.')
        } finally { clearTimeout(timeout); res.off('close', disconnect) }
      }
      if (path.startsWith('/local/')) throw fail(404, 'Маршрут не найден.')
      if (!['GET', 'HEAD'].includes(req.method)) throw fail(405, 'Метод не поддерживается.')
      if (path === '/') { res.writeHead(302, { Location: '/assistant' }); return res.end() }
      const root = await realpath(distDir)
      let file = resolve(root, `.${path}`)
      if (!contained(root, file)) throw fail(403, 'Доступ запрещён.')
      try {
        file = await realpath(file)
        if (!contained(root, file)) throw fail(403, 'Доступ запрещён.')
        if (!(await stat(file)).isFile()) throw fail(404, 'Файл не найден.')
      } catch (error) {
        if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error
        if (extname(path)) throw fail(404, 'Файл не найден.')
        file = await realpath(resolve(root, 'index.html'))
        if (!contained(root, file)) throw fail(403, 'Доступ запрещён.')
      }
      const content = await readFile(file)
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
      res.end(req.method === 'HEAD' ? undefined : content)
    } catch (error) { if (!res.destroyed) json(res, error.status || (error instanceof URIError ? 400 : 500), { error: error.status ? error.message : 'Не удалось обработать локальный запрос.' }) }
  })
  const listen = server.listen.bind(server)
  server.listen = (...args) => {
    const first = args[0]
    if (typeof first === 'object' && first !== null) {
      if (first.host !== undefined && first.host !== '127.0.0.1') throw new Error('Only 127.0.0.1 binding is allowed')
      if (first.path || first.fd !== undefined) throw new Error('Only TCP loopback binding is allowed')
      return listen({ ...first, host: '127.0.0.1' }, ...args.slice(1))
    }
    if (typeof first !== 'number') throw new Error('A numeric TCP port is required')
    if (typeof args[1] === 'string' && args[1] !== '127.0.0.1') throw new Error('Only 127.0.0.1 binding is allowed')
    return listen(first, '127.0.0.1', ...args.slice(typeof args[1] === 'string' ? 2 : 1))
  }
  server.requestTimeout = 15000
  server.headersTimeout = 10000
  return server
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createLocalServer().listen(4174, '127.0.0.1', () => process.stdout.write('Локальный помощник: http://127.0.0.1:4174/assistant\n'))
}
