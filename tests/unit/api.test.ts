import { describe, it, expect } from 'vitest'
import { ApiRequestError, authenticatedJson } from '../../src/lib/api'

describe('ApiRequestError', () => {
  it('stores status and retryAfter', () => {
    const err = new ApiRequestError('test', 429, 60)
    expect(err.message).toBe('test')
    expect(err.status).toBe(429)
    expect(err.retryAfter).toBe(60)
  })

  it('defaults retryAfter to null', () => {
    const err = new ApiRequestError('test', 500)
    expect(err.retryAfter).toBeNull()
  })

  it('is instance of Error', () => {
    expect(new ApiRequestError('test', 400)).toBeInstanceOf(Error)
  })
})

describe('authenticatedJson', () => {
  it('throws 401 when token is null', async () => {
    const getToken = async () => null
    await expect(authenticatedJson(getToken, '/api/test', {})).rejects.toThrow(ApiRequestError)
    await expect(authenticatedJson(getToken, '/api/test', {})).rejects.toMatchObject({ status: 401 })
  })

  it('throws with status 0 on network error', async () => {
    const getToken = async () => 'valid-token'
    const fetchStub = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('fetch failed'))

    await expect(authenticatedJson(getToken, '/api/test', { key: 'value' })).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('интернет'),
    })

    fetchStub.mockRestore()
  })

  it('sends Authorization header and JSON body', async () => {
    const getToken = async () => 'test-token'
    let capturedRequest: RequestInit | undefined

    const fetchStub = vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (url, init) => {
      capturedRequest = init
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    })

    const result = await authenticatedJson(getToken, '/api/test', { hello: 'world' })
    expect(result).toEqual({ ok: true })
    expect(capturedRequest?.headers).toMatchObject({
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
    })
    expect(capturedRequest?.body).toBe(JSON.stringify({ hello: 'world' }))

    fetchStub.mockRestore()
  })

  it('throws ApiRequestError on non-ok response', async () => {
    const getToken = async () => 'token'
    const fetchStub = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'rate limited' }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '30' } }),
    )

    await expect(authenticatedJson(getToken, '/api/test', {})).rejects.toMatchObject({
      status: 429,
      retryAfter: 30,
      message: expect.stringContaining('rate limited'),
    })

    fetchStub.mockRestore()
  })

  it('throws on empty response body', async () => {
    const getToken = async () => 'token'
    const fetchStub = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 200 }),
    )

    await expect(authenticatedJson(getToken, '/api/test', {})).rejects.toMatchObject({
      status: 502,
    })

    fetchStub.mockRestore()
  })
})