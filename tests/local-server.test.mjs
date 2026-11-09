import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, mkdir, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { request } from 'node:http'
import { createLocalServer } from '../server/local-assistant.mjs'

const localModel = { details: { format: 'gguf' }, model_info: { 'general.architecture': 'qwen3' } }

async function fixture(t, fetchImpl, options = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'local-assistant-'))
  await mkdir(join(dir, 'dist'))
  await writeFile(join(dir, 'dist/index.html'), '<html>assistant</html>')
  await writeFile(join(dir, 'dist/app.js'), 'export const ok = true')
  await writeFile(join(dir, 'secret.txt'), 'secret')
  await symlink(join(dir, 'secret.txt'), join(dir, 'dist/leak.txt'))
  const effectiveFetch = options.rawFetch ? fetchImpl : (url, init) => url.endsWith('/api/show') ? Promise.resolve(Response.json(localModel)) : fetchImpl(url, init)
  const server = createLocalServer({ fetchImpl: effectiveFetch, distDir: join(dir, 'dist'), ...options })
  await new Promise((resolve) => server.listen(0, resolve))
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); await rm(dir, { recursive: true, force: true }) })
  const origin = `http://127.0.0.1:${server.address().port}`
  const post = (data, headers = {}) => fetch(`${origin}/local/generate`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) })
  return { server, origin, post }
}

test('health reports installed local models at fixed local URL', async (t) => {
  const { origin } = await fixture(t, async (url, options) => { assert.equal(url, 'http://127.0.0.1:11434/api/tags'); assert.equal(options.redirect, 'error'); return Response.json({ models: [{ name: 'qwen3:8b' }, { name: '../bad' }, { name: 'gpt:cloud' }, { name: 'gpt-cloud:latest' }, { name: 'alias', remote_host: 'https://ollama.com' }, { name: 'alias2', remote_model: 'gpt' }] }) })
  assert.deepEqual(await (await fetch(`${origin}/local/health`)).json(), { available: true, models: ['qwen3:8b'] })
})

test('unavailable and malformed health are safe', async (t) => {
  for (const fetchImpl of [async () => { throw new Error('private detail') }, async () => Response.json({}), async () => new Response('error', { status: 500 })]) {
    const { origin } = await fixture(t, fetchImpl)
    const body = await (await fetch(`${origin}/local/health`)).json()
    assert.equal(body.available, false); assert.deepEqual(body.models, []); assert.ok(!body.error.includes('private'))
  }
})

test('generation sends constrained payload without tools or remote redirect', async (t) => {
  const { post } = await fixture(t, async (url, options) => {
    assert.equal(url, 'http://127.0.0.1:11434/api/generate')
    assert.equal(options.redirect, 'error')
    assert.deepEqual(JSON.parse(options.body), { model: 'qwen3:8b', prompt: 'Привет', stream: false, options: { temperature: 0.7, num_predict: 1200 } })
    return Response.json({ response: 'Ответ' })
  })
  assert.deepEqual(await (await post({ model: 'qwen3:8b', prompt: 'Привет', tools: ['ignored'] })).json(), { text: 'Ответ' })
})

test('generation validates prompts, byte limits, names, origin, content type and host', async (t) => {
  let calls = 0
  const { post, origin } = await fixture(t, async () => { calls++; return Response.json({ response: 'ok' }) })
  const valid = { model: 'qwen3:8b', prompt: 'Hi' }
  for (const data of [{ ...valid, prompt: '' }, { ...valid, prompt: 'a'.repeat(32001) }, { ...valid, model: '../evil' }, { ...valid, model: 'bad model' }, null]) assert.equal((await post(data)).status, 400)
  assert.equal((await post({ ...valid, prompt: '界'.repeat(30000) })).status, 413)
  for (const origin of ['https://evil.example', 'null', 'http://localhost:9999', '']) assert.equal((await post(valid, { Origin: origin })).status, 403)
  assert.equal((await post(valid, { 'Content-Type': 'text/plain' })).status, 415)
  const badHostStatus = await new Promise((resolve, reject) => { const req = request(`${origin}/local/health`, { headers: { Host: 'evil.example' } }, (res) => { res.resume(); resolve(res.statusCode) }); req.on('error', reject); req.end() })
  assert.equal(badHostStatus, 403)
  assert.equal((await post(valid, { 'Sec-Fetch-Site': 'cross-site' })).status, 403)
  assert.equal((await fetch(`${origin}/local/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(valid) })).status, 403)
  assert.equal((await fetch(`${origin}/local/generate`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{' })).status, 400)
  const chunkedStatus = await new Promise((resolve, reject) => { const req = request(`${origin}/local/generate`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' } }, (res) => { res.resume(); resolve(res.statusCode) }); req.on('error', reject); req.write('x'.repeat(40000)); req.end('x'.repeat(40000)) })
  assert.equal(chunkedStatus, 413)
  assert.equal(calls, 0)
})

test('generation failures, excessive output and timeout', async (t) => {
  for (const fetchImpl of [async () => { throw new Error('secret') }, async () => Response.json({ response: 'x'.repeat(100001) }), async () => new Response('bad json'), async () => new Response('bad', { status: 500 }), async () => Response.json({ response: 'x'.repeat(1100000) })]) {
    const { post } = await fixture(t, fetchImpl)
    assert.equal((await post({ model: 'qwen3', prompt: 'Hi' })).status, 502)
  }
  const { post } = await fixture(t, async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('abort')))), { timeoutMs: 10 })
  assert.equal((await post({ model: 'qwen3', prompt: 'Hi' })).status, 504)
})

test('static SPA routing, MIME, missing files and symlink escape', async (t) => {
  const { origin } = await fixture(t, async () => { throw new Error('unexpected') })
  const root = await fetch(origin, { redirect: 'manual' }); assert.equal(root.status, 302); assert.equal(root.headers.get('location'), '/assistant')
  assert.match(await (await fetch(`${origin}/assistant/settings`)).text(), /assistant/)
  const js = await fetch(`${origin}/app.js`); assert.match(js.headers.get('content-type'), /text\/javascript/)
  assert.equal(js.headers.get('access-control-allow-origin'), null)
  assert.equal((await fetch(`${origin}/missing.js`)).status, 404)
  assert.equal((await fetch(`${origin}/leak.txt`)).status, 403)
  assert.equal((await fetch(`${origin}/local/nope`)).status, 404)
  assert.equal((await fetch(`${origin}/assistant`, { method: 'POST' })).status, 405)
  for (const path of ['/%2e%2e/secret.txt', '/%5csecret.txt', '/%00', '/%zz']) {
    const status = await new Promise((resolve, reject) => { const req = request(`${origin}`, { path }, (res) => { res.resume(); resolve(res.statusCode) }); req.on('error', reject); req.end() })
    assert.equal(status, 400)
  }
})

test('server cannot bind to external interfaces', () => {
  const server = createLocalServer()
  assert.throws(() => server.listen(4174, '0.0.0.0'), /127.0.0.1/)
  assert.throws(() => server.listen({ port: 4174, host: '::' }), /127.0.0.1/)
  assert.throws(() => server.listen('/tmp/socket'), /numeric/)
  assert.throws(() => server.listen({ fd: 1 }), /TCP/)
})

test('cloud names never trigger Ollama; remote or uncertain descriptors never generate', async (t) => {
  const descriptors = [
    { ...localModel, remote_model: 'gpt' },
    { ...localModel, remote_host: 'https://ollama.com' },
    { ...localModel, details: { format: 'gguf', remote_model: 'gpt' } },
    { ...localModel, details: { format: 'gguf', parent_model: 'gpt-cloud:latest' } },
    { ...localModel, model: 'gpt:cloud' },
    {},
    { details: { format: 'gguf' } },
    { details: { format: 'unknown' }, model_info: { 'general.architecture': 'qwen3' } },
  ]
  for (const descriptor of descriptors) {
    const calls = []
    const { post } = await fixture(t, async (url, init) => {
      calls.push(url)
      assert.deepEqual(JSON.parse(init.body), { model: 'local-alias', verbose: false })
      return Response.json(descriptor)
    }, { rawFetch: true })
    assert.equal((await post({ model: 'local-alias', prompt: 'Private text' })).status, 400)
    assert.deepEqual(calls, ['http://127.0.0.1:11434/api/show'])
  }
  let calls = 0
  const { post } = await fixture(t, async () => { calls++; throw new Error('must not call') }, { rawFetch: true })
  for (const model of ['gpt:cloud', 'gpt-cloud:latest', 'org/gpt-cloud', 'CLOUD:model']) assert.equal((await post({ model, prompt: 'Private text' })).status, 400)
  assert.equal(calls, 0)
})

test('failed model inspection never sends the prompt to generate', async (t) => {
  for (const response of [() => { throw new Error('offline') }, () => new Response('{}', { status: 404 }), () => new Response('invalid')]) {
    const calls = []
    const { post } = await fixture(t, async (url) => { calls.push(url); return response() }, { rawFetch: true })
    assert.equal((await post({ model: 'local-alias', prompt: 'Private text' })).status, 502)
    assert.deepEqual(calls, ['http://127.0.0.1:11434/api/show'])
  }
})
