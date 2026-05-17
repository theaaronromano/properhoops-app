'use client'

import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import ScoreTicker from '@/components/ScoreTicker'
import StoryCard from '@/components/StoryCard'

export default function Home() {
  const [stories, setStories] = useState<any[]>([])
  const [activeLeague, setActiveLeague] = useState('All')
  const [loading, setLoading] = useState(true)
  const [voiceCount, setVoiceCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [bootstrapping, setBootstrapping] = useState(false)
  const [status, setStatus] = useState('')

  async function loadStories(tag: string) {
    setLoading(true)
    try {
      const url = `/api/stories?limit=30${tag !== 'All' ? `&tag=${tag}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      setStories(data.stories || [])
      setLastUpdated(new Date())
    } catch (e) {
      console.error('Failed to load stories:', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadVoiceCount() {
    try {
      const res = await fetch('/api/voices')
      const data = await res.json()
      setVoiceCount(data.total || 0)
    } catch (e) {}
  }

  async function runPipeline() {
    const secret = 'properhoops_ingest_2026'
    try {
      setStatus('Checking voices...')
      // Run discovery if we have very few voices
      if (voiceCount < 10) {
        setBootstrapping(true)
        setStatus('Discovering basketball voices...')
        await fetch('/api/discover', { method: 'POST', headers: { 'x-ingest-secret': secret } })
        await loadVoiceCount()
      }

      setStatus('Fetching posts...')
      await fetch('/api/ingest', { method: 'POST', headers: { 'x-ingest-secret': secret } })

      setStatus('Clustering stories...')
      await fetch('/api/stories', { method: 'POST', headers: { 'x-ingest-secret': secret } })

      setStatus('')
      setBootstrapping(false)
      await loadStories(activeLeague)
    } catch (e) {
      setStatus('')
      setBootstrapping(false)
    }
  }

  useEffect(() => {
    loadVoiceCount()
    loadStories(activeLeague)
    // Run pipeline on load
    runPipeline()
    // Then every 30 mins
    const interval = setInterval(runPipeline, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    loadStories(activeLeague)
  }, [activeLeague])

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D' }}>
      {/* Score Ticker */}
      <ScoreTicker />

      {/* Navigation */}
      <Navigation
        activeLeague={activeLeague}
        onLeagueChange={setActiveLeague}
        voiceCount={voiceCount}
      />

      {/* Main */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                {activeLeague === 'All' ? (
                  <>
                    <span style={{ color: '#F5C518' }}>What Basketball</span>
                    <br />
                    <span style={{ color: '#2ABFBF' }}>is Talking About</span>
                  </>
                ) : (
                  <span style={{ color: '#F5C518' }}>{activeLeague} Stories</span>
                )}
              </h1>
              <p style={{ fontSize: 13, color: '#444', marginTop: 6 }}>
                {voiceCount > 0
                  ? `Tracked across ${voiceCount} basketball voices on Bluesky, Threads & Fediverse`
                  : 'Discovering basketball voices...'}
                {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
              </p>
            </div>

            <button onClick={() => { loadStories(activeLeague); runPipeline() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 6, border: '1px solid #222',
                background: 'transparent', color: '#555', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.15s'
              }}
              onMouseEnter={e => { (e.currentTarget.style.borderColor = '#E8621A'); (e.currentTarget.style.color = '#E8621A') }}
              onMouseLeave={e => { (e.currentTarget.style.borderColor = '#222'); (e.currentTarget.style.color = '#555') }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0 1 14.93-3M20 15a8 8 0 0 1-14.93 3" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Bootstrap status */}
          {(bootstrapping || status) && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 6,
              background: 'rgba(42,191,191,0.08)', border: '1px solid rgba(42,191,191,0.2)',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: '#2ABFBF',
                animation: 'live-pulse 1s ease-in-out infinite'
              }} />
              <span style={{ fontSize: 12, color: '#2ABFBF', fontWeight: 600 }}>
                {status || 'Warming up the pipeline...'}
              </span>
            </div>
          )}
        </div>

        {/* How it works banner — show when no stories */}
        {!loading && stories.length === 0 && !bootstrapping && (
          <div style={{
            padding: 32, borderRadius: 12, border: '1px solid #1a1a1a',
            background: '#111', textAlign: 'center', marginBottom: 32
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏀</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              Building your basketball feed
            </h2>
            <p style={{ fontSize: 14, color: '#555', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
              We're discovering basketball voices and fetching their posts.
              This takes a few minutes the first time — check back shortly.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 24 }}>
              {[
                { icon: '🦋', label: 'Bluesky' },
                { icon: '🧵', label: 'Threads' },
                { icon: '🌐', label: 'Fediverse' },
              ].map(p => (
                <div key={p.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24 }}>{p.icon}</div>
                  <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>{p.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stories grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {[...Array(9)].map((_, i) => (
              <div key={i} style={{
                height: 320, borderRadius: 12, background: '#141414',
                border: '1px solid #1a1a1a', animation: 'pulse 2s infinite'
              }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {stories.map((story, i) => (
              <StoryCard key={story.id} story={story} rank={i + 1} />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer style={{ marginTop: 64, paddingTop: 24, borderTop: '1px solid #1a1a1a', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#333' }}>
            ProperHoops — Basketball Intelligence from Australia 🇦🇺
          </p>
          <p style={{ fontSize: 11, color: '#222', marginTop: 4 }}>
            Stories ranked by velocity across {voiceCount} tracked voices · Powered by Claude AI
          </p>
        </footer>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
