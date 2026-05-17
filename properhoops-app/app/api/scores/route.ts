import { NextResponse } from 'next/server'

const LEAGUES = [
  { id: 'nba', sport: 'basketball', label: 'NBA' },
  { id: 'wnba', sport: 'basketball', label: 'WNBA' },
  { id: 'nbl', sport: 'basketball', label: 'NBL' },
  { id: 'wnbl', sport: 'basketball', label: 'WNBL' },
  { id: 'mens-college-basketball', sport: 'basketball', label: 'NCAA M', needsGroups: true },
  { id: 'womens-college-basketball', sport: 'basketball', label: 'NCAA W', needsGroups: true },
]

async function fetchLeague(league: any) {
  try {
    const base = `https://site.api.espn.com/apis/site/v2/sports/${league.sport}/${league.id}/scoreboard`
    const url = league.needsGroups ? `${base}?groups=100` : base
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return { league, games: [] }
    const data = await res.json()

    const logo = data.leagues?.[0]?.logos?.find((l: any) =>
      l.rel?.includes('dark') || l.rel?.includes('white')
    )?.href || data.leagues?.[0]?.logos?.[0]?.href || null

    const now = new Date()
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)

    const games = (data.events || []).filter((e: any) => {
      const comp = e.competitions?.[0]
      const state = comp?.status?.type?.state
      const gameDate = new Date(e.date || comp?.date)
      const isLive = state === 'in'
      const isToday = state === 'post' && gameDate >= todayStart
      const isUpcoming = state === 'pre' && gameDate >= todayStart &&
        gameDate <= new Date(now.getTime() + 72 * 60 * 60 * 1000)
      return isLive || isToday || isUpcoming
    }).map((e: any) => { e._leagueId = league.id; return e })

    games.sort((a: any, b: any) => {
      const order: Record<string, number> = { in: 0, pre: 1, post: 2 }
      const sA = a.competitions?.[0]?.status?.type?.state || 'pre'
      const sB = b.competitions?.[0]?.status?.type?.state || 'pre'
      if (order[sA] !== order[sB]) return order[sA] - order[sB]
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    return { league: { ...league, logo }, games }
  } catch (e) {
    return { league, games: [] }
  }
}

export async function GET() {
  const results = await Promise.all(LEAGUES.map(fetchLeague))
  return NextResponse.json({ leagues: results })
}
