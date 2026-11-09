import { describe, expect, it } from 'vitest'
import { buildLocalPrompt, buildThreadsIntent, deserializeWorkspace, emptyWorkspace, loadWorkspace, parseLocalDraft, serializeWorkspace } from '../../src/lib/local-workspace'
describe('local workspace', () => {
  it('round trips blank and over-limit editable drafts', () => {
    const workspace = emptyWorkspace()
    workspace.drafts.push({ id: 'draft1', kind: 'post', label: 'draft', parts: [''], warnings: [], sourceIds: ['removed'], status: 'draft', createdAt: '2026-11-09T10:00:00.000Z' })
    expect(deserializeWorkspace(serializeWorkspace(workspace))).toEqual(workspace)
    workspace.drafts[0].parts = ['a'.repeat(501)]
    expect(deserializeWorkspace(serializeWorkspace(workspace))).toEqual(workspace)
  })
  it('returns an error without destroying a corrupted copy', () => {
    const store = { getItem: () => '{broken' }
    expect(loadWorkspace(store).error).toContain('не перезаписаны')
    expect(loadWorkspace(store).workspace).toEqual(emptyWorkspace())
  })
  it('downgrades imported published state without a valid Threads URL', () => {
    const state = JSON.parse(serializeWorkspace({ ...emptyWorkspace(), drafts: [{ id: 'd', kind: 'post', label: 'draft', parts: ['safe'], sourceIds: [], warnings: [], status: 'published', createdAt: '2026-11-09', publishedUrl: 'https://evil.test' }] }))
    expect(deserializeWorkspace(JSON.stringify(state)).drafts[0].status).toBe('draft')
  })
  it('encodes post and reply intents and rejects unsafe targets', () => {
    const text = 'Вопрос & ответ? 🌿'
    const url = new URL(buildThreadsIntent(text, 'https://www.threads.net/@alice/post/abc?x=y'))
    expect(url.searchParams.get('text')).toBe(text)
    expect(url.searchParams.get('reply_post_shortcode')).toBe('abc')
    expect(() => buildThreadsIntent('a'.repeat(501))).toThrow()
    expect(() => buildThreadsIntent('hello', 'javascript:alert(1)')).toThrow()
    expect(() => buildThreadsIntent('')).toThrow()
  })
  it('parses only bounded structured model drafts', () => {
    expect(parseLocalDraft('```json\n{"parts":["текст"]}\n```', 'post', ['source']).parts).toEqual(['текст'])
    expect(() => parseLocalDraft('{"parts":["текст"]}', 'thread', [])).toThrow()
    expect(() => parseLocalDraft('not json', 'post', [])).toThrow()
    expect(() => parseLocalDraft(JSON.stringify({ parts: ['a'.repeat(501)] }), 'reply', [])).toThrow()
  })
  it('labels sources as data and profile rules in local model prompt', () => {
    const prompt = buildLocalPrompt([], { ...emptyWorkspace().profile, avoid: 'Спам' }, 'Образование', 'thread')
    expect(prompt).toContain('недоверенные данные')
    expect(prompt).toContain('Спам')
    expect(prompt).toContain('Ровно 3 части')
  })
})
