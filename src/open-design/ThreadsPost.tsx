import type { ReactNode } from 'react'

export interface ThreadsPostProps {
  username: string
  displayName: string
  avatar: ReactNode
  content: string
  timestamp: string
  likes?: number
  replies?: number
  reposts?: number
  views?: number
  verified?: boolean
  mediaPreview?: ReactNode
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function ThreadsPost({
  username,
  displayName,
  avatar,
  content,
  timestamp,
  likes = 0,
  replies = 0,
  reposts = 0,
  views = 0,
  verified = false,
  mediaPreview,
}: ThreadsPostProps) {
  return (
    <article className="threads-post">
      <div className="threads-post-header">
        <div className="threads-post-avatar">{avatar}</div>
        <div className="threads-post-author">
          <span className="threads-post-name">
            <strong>{displayName}</strong>
            {verified && (
              <svg className="threads-verified" viewBox="0 0 24 24" width="16" height="16" fill="#1d9bf0">
                <path d="M12 2L2 7v5c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z" />
              </svg>
            )}
          </span>
          <span className="threads-post-handle">@{username} · {timestamp}</span>
        </div>
      </div>
      <div className="threads-post-body">
        <p>{content}</p>
      </div>
      {mediaPreview && <div className="threads-post-media">{mediaPreview}</div>}
      <div className="threads-post-actions">
        <button className="threads-action" aria-label="Reply">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 2C6.5 2 2 6.5 2 12c0 5.5 4.5 10 10 10s10-4.5 10-10c0-5.5-4.5-10-10-10zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm-1-12h2v5h-2v-5zm0 6h2v2h-2v-2z" />
          </svg>
          {replies > 0 && <span>{formatCount(replies)}</span>}
        </button>
        <button className="threads-action" aria-label="Repost">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M6 4l4 4H7v5c0 2.8 2.2 5 5 5s5-2.2 5-5V7h-2v6c0 1.7-1.3 3-3 3s-3-1.3-3-3V8h3L6 4z" />
          </svg>
          {reposts > 0 && <span>{formatCount(reposts)}</span>}
        </button>
        <button className="threads-action" aria-label="Like">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 21.3l-1.5-1.4C5.5 14.8 2 11.5 2 7.5 2 4.4 4.4 2 7.5 2c1.8 0 3.5.8 4.5 2.1C13 2.8 14.7 2 16.5 2 19.6 2 22 4.4 22 7.5c0 4-3.5 7.3-8.5 12.4L12 21.3z" />
          </svg>
          {likes > 0 && <span>{formatCount(likes)}</span>}
        </button>
        {views > 0 && (
          <span className="threads-views">{formatCount(views)} views</span>
        )}
      </div>
    </article>
  )
}
