'use client'

import { useState } from 'react'

const LEAGUES = ['All', 'NBA', 'WNBA', 'NBL', 'WNBL', 'NCAA', 'FIBA', 'Unrivaled', 'BIG3']

interface NavProps {
  activeLeague: string
  onLeagueChange: (league: string) => void
  voiceCount: number
}

export default function Navigation({ activeLeague, onLeagueChange, voiceCount }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: '#0D0D0D', borderBottom: '1px solid #1a1a1a',
      backdropFilter: 'blur(12px)'
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>

        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <img src="/logo.png" alt="ProperHoops" style={{ height: 36, width: 'auto' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-0.02em' }}>
              <span style={{ color: '#F5C518' }}>PROPER</span><span style={{ color: '#2ABFBF' }}>HOOPS</span>
            </span>
            <span style={{ fontSize: 9, color: '#444', letterSpacing: '0.06em', fontWeight: 600 }}>
              BASKETBALL INTELLIGENCE
            </span>
          </div>
        </a>

        {/* League filters — desktop */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden', flex: 1 }}
          className="hidden-mobile">
          {LEAGUES.map(league => (
            <button key={league} onClick={() => onLeagueChange(league)}
              style={{
                padding: '6px 12px', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.04em', textTransform: 'uppercase',
                border: 'none', cursor: 'pointer', borderRadius: 4, whiteSpace: 'nowrap',
                background: activeLeague === league ? 'rgba(232,98,26,0.15)' : 'transparent',
                color: activeLeague === league ? '#F5C518' : '#555',
                borderBottom: activeLeague === league ? '2px solid #E8621A' : '2px solid transparent',
                transition: 'all 0.15s'
              }}>
              {league}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto', flexShrink: 0 }}>
          {/* Voice count pill */}
          {voiceCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(42,191,191,0.1)', border: '1px solid rgba(42,191,191,0.2)'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ABFBF', display: 'block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2ABFBF' }}>{voiceCount} voices</span>
            </div>
          )}

          {/* Newsletter link */}
          <a href="https://properhoops.com" target="_blank" rel="noopener noreferrer"
            style={{
              fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 6,
              background: 'linear-gradient(135deg, #E8621A, #F5C518)',
              color: '#000', textDecoration: 'none', letterSpacing: '0.03em',
              textTransform: 'uppercase'
            }}>
            Newsletter
          </a>

          {/* Mobile menu */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4 }}
            className="show-mobile">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile league filters */}
      {menuOpen && (
        <div style={{ borderTop: '1px solid #1a1a1a', background: '#111', padding: '12px 16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LEAGUES.map(league => (
              <button key={league} onClick={() => { onLeagueChange(league); setMenuOpen(false) }}
                style={{
                  padding: '6px 12px', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  border: `1px solid ${activeLeague === league ? '#E8621A' : '#222'}`,
                  borderRadius: 4, cursor: 'pointer',
                  background: activeLeague === league ? 'rgba(232,98,26,0.15)' : 'transparent',
                  color: activeLeague === league ? '#F5C518' : '#555'
                }}>
                {league}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </header>
  )
}
