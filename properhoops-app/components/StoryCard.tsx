'use client'

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  NBA: { bg: 'rgba(200,16,46,0.12)', text: '#ff6b6b', border: 'rgba(200,16,46,0.3)' },
  WNBA: { bg: 'rgba(255,103,31,0.12)', text: '#ff9a5c', border: 'rgba(255,103,31,0.3)' },
  NBL: { bg: 'rgba(42,191,191,0.12)', text: '#2ABFBF', border: 'rgba(42,191,191,0.3)' },
  WNBL: { bg: 'rgba(42,191,191,0.12)', text: '#2ABFBF', border: 'rgba(42,191,191,0.3)' },
  NCAA: { bg: 'rgba(107,63,160,0.12)', text: '#b47fe8', border: 'rgba(107,63,160,0.3)' },
  FIBA: { bg: 'rgba(245,197,24,0.12)', text: '#F5C518', border: 'rgba(245,197,24,0.3)' },
  Unrivaled: { bg: 'rgba(232,98,26,0.12)', text: '#E8621A', border: 'rgba(232,98,26,0.3)' },
  BIG3: { bg: 'rgba(232,98,26,0.12)', text: '#E8621A', border: 'rgba(232,98,26,0.3)' },
  Basketball: { bg: 'rgba(255,255,255,0.06)', text: '#888', border: 'rgba(255,255,255,0.1)' },
}

const PLATFORM_ICONS: Record<string, string> = {
  bluesky: '🦋',
  threads: '🧵',
  fediverse: '🌐',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function VelocityIndicator({ score }: { score: number }) {
  const maxScore = 200
  const pct = Math.min(100, (score / maxScore) * 100)
  const label = pct > 70 ? '🔥 Trending' : pct > 40 ? '📈 Rising' : '🆕 New'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 3, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
        <div className="velocity-bar" style={{ width: `${pct}%`, height: '100%', borderRadius: 2, transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: 10, color: '#555', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}

export default function StoryCard({ story, rank }: { story: any; rank: number }) {
  const tag = story.tag || 'Basketball'
  const colors = TAG_COLORS[tag] || TAG_COLORS['Basketball']
  const isTrending = story.is_trending || story.velocity_score > 50
  const posts = story.posts || []
  const platforms = [...new Set(posts.map((p: any) => p.platform))]

  return (
    <div className={`story-card ${isTrending ? 'trending' : ''}`}
      style={{
        background: '#141414',
        border: `1px solid ${isTrending ? 'rgba(232,98,26,0.3)' : '#1e1e1e'}`,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative'
      }}>

      {/* Rank badge */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        width: 28, height: 28, borderRadius: 6,
        background: rank <= 3 ? 'linear-gradient(135deg, #E8621A, #F5C518)' : '#1a1a1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 900, color: rank <= 3 ? '#000' : '#444',
        zIndex: 1
      }}>
        {rank}
      </div>

      {/* Lead image */}
      {story.image_url && (
        <div style={{ position: 'relative', width: '100%', height: 160, background: '#0a0a0a', overflow: 'hidden' }}>
          <img src={story.image_url} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLElement).parentElement!.style.display = 'none' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #141414, transparent)' }} />
        </div>
      )}

      <div style={{ padding: 16 }}>
        {/* Tag + platforms */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: story.image_url ? 0 : 20 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: 4,
            background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`
          }}>{tag}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {platforms.map(p => (
              <span key={p as string} title={p as string} style={{ fontSize: 12 }}>{PLATFORM_ICONS[p as string] || '🌐'}</span>
            ))}
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3, color: '#fff', marginBottom: 8 }}>
          {story.url ? (
            <a href={story.url} target="_blank" rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'none' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = '#F5C518'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = '#fff'}>
              {story.title}
            </a>
          ) : story.title}
        </h2>

        {/* Summary */}
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 12 }}>
          {story.summary}
        </p>

        {/* Velocity */}
        <VelocityIndicator score={story.velocity_score} />

        {/* Voice count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0', padding: '8px 10px', background: '#0d0d0d', borderRadius: 6 }}>
          <span style={{ fontSize: 18 }}>🗣️</span>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#E8621A' }}>{story.voice_count}</span>
            <span style={{ fontSize: 12, color: '#555' }}> basketball voices discussing this</span>
          </div>
        </div>

        {/* Recent posts from voices */}
        {posts.length > 0 && (
          <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 10, marginTop: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#444', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              What they're saying
            </p>
            {posts.slice(0, 3).map((post: any) => (
              <a key={post.id} href={post.post_url || '#'} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', gap: 8, marginBottom: 8, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                {post.voices?.avatar_url ? (
                  <img src={post.voices.avatar_url} alt="" style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1a1a1a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                    {PLATFORM_ICONS[post.platform] || '👤'}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#888' }}>
                    {post.voices?.display_name || post.voices?.handle}
                  </span>
                  <span style={{ fontSize: 10, color: '#444', marginLeft: 4 }}>· {timeAgo(post.posted_at)}</span>
                  {post.content && (
                    <p style={{ fontSize: 11, color: '#555', marginTop: 2, lineHeight: 1.4,
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                      {post.content}
                    </p>
                  )}
                </div>
              </a>
            ))}
            {posts.length > 3 && (
              <p style={{ fontSize: 11, color: '#444' }}>+{posts.length - 3} more posts</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid #1a1a1a' }}>
          <span style={{ fontSize: 10, color: '#333' }}>{timeAgo(story.last_updated)} ago</span>
          <span style={{ fontSize: 10, color: '#333' }}>{story.post_count} posts</span>
        </div>
      </div>
    </div>
  )
}
