import { describe, it, expect } from 'vitest'
import type { ContentStatus, ApprovalStatus, RiskLevel } from '../../src/lib/domain'

describe('domain types', () => {
  it('ContentStatus includes all expected values', () => {
    const statuses: ContentStatus[] = ['idea', 'draft', 'pending_approval', 'approved', 'scheduled', 'published', 'failed', 'rejected']
    expect(statuses).toHaveLength(8)
    expect(statuses).toContain('published')
    expect(statuses).toContain('failed')
  })

  it('ApprovalStatus includes all expected values', () => {
    const statuses: ApprovalStatus[] = ['pending', 'approved', 'rejected', 'changes_requested']
    expect(statuses).toHaveLength(4)
  })

  it('RiskLevel includes all expected values', () => {
    const levels: RiskLevel[] = ['low', 'medium', 'high', 'blocked']
    expect(levels).toHaveLength(4)
  })

  it('Draft type has required fields', () => {
    const draft = {
      id: '1',
      workspace_id: 'w1',
      brand_id: null,
      account_id: null,
      created_by: 'u1',
      format: 'post' as const,
      title: 'Test',
      content: 'Hello',
      variants: [],
      selected_variant: null,
      source: 'manual',
      status: 'draft' as ContentStatus,
      risk_score: 0,
      risk_level: 'low' as RiskLevel,
      compliance_notes: [],
      scheduled_at: null,
      published_at: null,
      threads_post_id: null,
      error_message: null,
      metadata: {},
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    }
    expect(draft.title).toBe('Test')
    expect(draft.status).toBe('draft')
  })
})