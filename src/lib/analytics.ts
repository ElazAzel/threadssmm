export interface ContentMetrics {
  totalIdeas: number
  totalDrafts: number
  totalScheduled: number
  totalPublished: number
  publishRate: number
  averageApprovalTimeHours: number
  topContentTypes: Array<{ type: string; count: number; avgEngagement: number }>
  topPostingHours: Array<{ hour: number; avgEngagement: number }>
  averageRiskScore: number
  riskDistribution: { safe: number; low: number; needsReview: number; high: number; blocked: number }
}

export interface EngagementMetrics {
  opportunitiesFound: number
  commentsGenerated: number
  commentsApproved: number
  commentsPublished: number
  approvalRate: number
  averageCommentScore: number
  replyRate: number
  topCommentTones: Array<{ tone: string; count: number; avgResponse: number }>
  leadsDetected: number
  spamBlocked: number
}

export interface SegmentAnalytics {
  segmentId: string
  segmentName: string
  postsTargeted: number
  commentsTargeted: number
  engagementRate: number
  bestPerformingTone: string
  bestPerformingTopic: string
  conversionEstimate: number
}

export interface LocationAnalytics {
  locationId: string
  locationName: string
  postsAdapted: number
  commentsMade: number
  localEngagementRate: number
  topLocalTopics: Array<{ topic: string; engagement: number }>
  bestPostingTime: string
}

export interface QualityMetrics {
  averageHumanToneScore: number
  averageBrandFitScore: number
  averageOriginalityScore: number
  averageRelevanceScore: number
  averageSpamRiskScore: number
  contentQualityTrend: Array<{ date: string; score: number }>
  topIssues: Array<{ issue: string; count: number }>
}

export function calculatePublishRate(published: number, scheduled: number, drafts: number): number {
  const total = published + scheduled + drafts
  if (total === 0) return 0
  return Math.round((published / total) * 100)
}

export function calculateApprovalRate(approved: number, total: number): number {
  if (total === 0) return 0
  return Math.round((approved / total) * 100)
}

export function estimateConversion(
  commentsPublished: number,
  leadsDetected: number,
  replyRate: number
): number {
  if (commentsPublished === 0) return 0
  const leadRate = leadsDetected / commentsPublished
  return Math.round((leadRate * replyRate) * 100)
}

export function getOverallScore(metrics: {
  publishRate: number
  approvalRate: number
  averageHumanToneScore: number
  averageBrandFitScore: number
  averageSpamRiskScore: number
  engagementRate: number
}): number {
  const components = [
    metrics.publishRate / 100 * 0.15,
    metrics.approvalRate / 100 * 0.10,
    metrics.averageHumanToneScore / 10 * 0.25,
    metrics.averageBrandFitScore / 10 * 0.20,
    (100 - metrics.averageSpamRiskScore) / 100 * 0.10,
    metrics.engagementRate / 100 * 0.20,
  ]

  return Math.round(components.reduce((a, b) => a + b, 0) * 100)
}
