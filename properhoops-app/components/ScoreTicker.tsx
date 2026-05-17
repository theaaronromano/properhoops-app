'use client'
import { useEffect, useState } from 'react'

function gameInfo(game: any) {
  const comp = game.competitions?.[0]
  const state = comp?.status?.type?.state
  const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')
  const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')
  if (!home || !away) return null

  const homeScore = home.score ?? ''
  const awayScore = away.score ?? ''
  const homeWon = state === 'post' && parseInt(homeScore) > parseInt(awayScore)
  const awayWon = state === 'post' && parseInt(awayScore) > parseInt(homeScore)

  let statusText = '', dateText = ''
  if (state === 'in') {
    statusText = comp?.status?.period ? `Q${comp.status.period} ${comp.status.displayClock || ''}` : 'LIVE'
  } else if (state === 'post') {
    statusText = 'Final'
  } else {
    const d = new Date(comp?.date || game.date)
    const today = new Date()
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    dateText = d.toDateString() === today.toDateString() ? 'Today'
      : d.toDateString() === tomorrow.toDateString() ? 'Tomorrow'
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    statusText = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  return { homeAbbr: home.team?.abbreviation || '?', homeLogo: home.team?.logo || '', homeScore, homeWon,
           awayAbbr: away.team?.abbreviation || '?', awayLogo: away.team?.logo || '', awayScore, awayWon,
           statusText, dateText, state, link: game.links?.[0]?.href || '#' }
}

export default function ScoreTicker() {
  const [leagues, setLeagues] = useState<any[]>([])
  const [active, setActive] = useState('')

  async function load() {
    try {
      const res = await fetch('/api/scores')
      const data = await res.json()
      const withGames = (data.leagues || []).filter((l: any) => l.games.length > 0)
      setLeagues(withGames)
      if (!active && withGames.length > 0) {
        const liveLeague = withGames.find((l: any) =>
          l.games.some((g: any) => g.competitions?.[0]?.status?.type?.state === 'in')
        )
        setActive((liveLeague || withGames[0]).league.id)
      }
    } catch (e) {}
  }

  useEffect(() => { load(); const t = setInterval(load, 120000); return () => clearInterval(t) }, [])

  const activeData = leagues.find(l => l.league.id === active)

  if (leagues.length === 0) return (
    <div className="w-full h-20 flex items-center justify-center" style={{ background: '#080808', borderBottom: '1px solid #1a1a1a' }}>
      <span style={{ color: '#333', fontSize: 12 }}>Loading scores...</span>
    </div>
  )

  return (
    <div style={{ background: '#080808', borderBottom: '1px solid #1a1a1a' }}>
      {/* Tabs */}
      <div className="ticker-scroll flex" style={{ borderBottom: '1px solid #141414' }}>
        {leagues.map(({ league, games }) => {
          const hasLive = games.some((g: any) => g.competitions?.[0]?.status?.type?.state === 'in')
          const isActive = active === league.id
          return (
            <button key={league.id} onClick={() => setActive(league.id)}
              style={{
                padding: '8px 16px', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                whiteSpace: 'nowrap', border: 'none', background: 'none',
                borderBottom: isActive ? '2px solid #E8621A' : '2px solid transparent',
                color: isActive ? '#fff' : '#555', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.15s'
              }}>
              {league.logo && <img src={league.logo} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />}
              {league.label}
              {games.length > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 10,
                  background: hasLive ? '#E8621A' : '#1a1a1a',
                  color: hasLive ? '#fff' : '#555'
                }}>{games.length}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Games */}
      <div className="ticker-scroll flex gap-1 p-2">
        {activeData?.games.map((game: any) => {
          const info = gameInfo(game)
          if (!info) return null
          const isLive = info.state === 'in'
          return (
            <a key={game.id} href={info.link} target="_blank" rel="noopener noreferrer"
              style={{
                flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4,
                padding: '8px 12px', borderRadius: 6, minWidth: 110,
                border: `1px solid ${isLive ? '#E8621A' : '#1a1a1a'}`,
                background: isLive ? 'rgba(232,98,26,0.06)' : 'transparent',
                textDecoration: 'none', transition: 'border-color 0.15s'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {isLive && <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8621A', flexShrink: 0 }} />}
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isLive ? '#E8621A' : '#555' }}>
                  {info.dateText || info.statusText}
                </span>
              </div>
              {[
                { abbr: info.awayAbbr, logo: info.awayLogo, score: info.awayScore, won: info.awayWon },
                { abbr: info.homeAbbr, logo: info.homeLogo, score: info.homeScore, won: info.homeWon }
              ].map((team, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, opacity: team.won ? 1 : 0.65 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {team.logo && <img src={team.logo} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />}
                    <span style={{ fontSize: 11, fontWeight: team.won ? 800 : 500, color: team.won ? '#fff' : '#bbb' }}>{team.abbr}</span>
                  </div>
                  {info.state !== 'pre' && (
                    <span style={{ fontSize: 11, fontWeight: team.won ? 800 : 400, color: team.won ? '#fff' : '#888', fontVariantNumeric: 'tabular-nums' }}>{team.score}</span>
                  )}
                </div>
              ))}
              {info.state === 'pre' && <span style={{ fontSize: 9, color: '#444' }}>{info.statusText}</span>}
            </a>
          )
        })}
      </div>
    </div>
  )
}
