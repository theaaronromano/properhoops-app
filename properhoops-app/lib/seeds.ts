// Seed voices — the manual starting list of known basketball voices
// The system will auto-discover more from who these accounts follow and engage with

export const SEED_VOICES = [
  // ── Bluesky ──────────────────────────────────────────────────────────────
  // NBA Journalists & Insiders
  { platform: 'bluesky', handle: 'adrianwojnarowski.bsky.social', display_name: 'Adrian Wojnarowski', is_seed: true },
  { platform: 'bluesky', handle: 'shamscharania.bsky.social', display_name: 'Shams Charania', is_seed: true },
  { platform: 'bluesky', handle: 'brianbabcock.bsky.social', display_name: 'Brian Babcock', is_seed: true },
  { platform: 'bluesky', handle: 'kelseaplum.bsky.social', display_name: 'Kelsey Plum', is_seed: true },
  // NBA Analytics & Media
  { platform: 'bluesky', handle: 'kirkgoldsberry.bsky.social', display_name: 'Kirk Goldsberry', is_seed: true },
  { platform: 'bluesky', handle: 'netsnation.bsky.social', display_name: 'Nets Nation', is_seed: true },
  { platform: 'bluesky', handle: 'nbacom.bsky.social', display_name: 'NBA', is_seed: true },
  { platform: 'bluesky', handle: 'bleacherreport.bsky.social', display_name: 'Bleacher Report', is_seed: true },
  { platform: 'bluesky', handle: 'theathletic.bsky.social', display_name: 'The Athletic', is_seed: true },
  { platform: 'bluesky', handle: 'theringer.bsky.social', display_name: 'The Ringer', is_seed: true },
  // Australian Basketball
  { platform: 'bluesky', handle: 'nbl.bsky.social', display_name: 'NBL', is_seed: true },
  { platform: 'bluesky', handle: 'basketballaustralia.bsky.social', display_name: 'Basketball Australia', is_seed: true },
  // WNBA
  { platform: 'bluesky', handle: 'wnba.bsky.social', display_name: 'WNBA', is_seed: true },
  { platform: 'bluesky', handle: 'highposthoops.bsky.social', display_name: 'High Post Hoops', is_seed: true },
  // College
  { platform: 'bluesky', handle: 'cbssportscollegebball.bsky.social', display_name: 'CBS Sports CBB', is_seed: true },

  // ── Threads ───────────────────────────────────────────────────────────────
  { platform: 'threads', handle: 'nba', display_name: 'NBA', is_seed: true },
  { platform: 'threads', handle: 'wnba', display_name: 'WNBA', is_seed: true },
  { platform: 'threads', handle: 'espn', display_name: 'ESPN', is_seed: true },
  { platform: 'threads', handle: 'bleacherreport', display_name: 'Bleacher Report', is_seed: true },
  { platform: 'threads', handle: 'theathletic', display_name: 'The Athletic', is_seed: true },
  { platform: 'threads', handle: 'theringer', display_name: 'The Ringer', is_seed: true },
  { platform: 'threads', handle: 'cbssports', display_name: 'CBS Sports', is_seed: true },
  { platform: 'threads', handle: 'nbl', display_name: 'NBL', is_seed: true },
  { platform: 'threads', handle: 'wnbl', display_name: 'WNBL', is_seed: true },
  { platform: 'threads', handle: 'fiba', display_name: 'FIBA', is_seed: true },
  { platform: 'threads', handle: 'unrivaled', display_name: 'Unrivaled', is_seed: true },
  { platform: 'threads', handle: 'big3', display_name: 'BIG3', is_seed: true },

  // ── Fediverse / Mastodon ──────────────────────────────────────────────────
  { platform: 'fediverse', handle: 'nba@mastodon.social', display_name: 'NBA', is_seed: true },
  { platform: 'fediverse', handle: 'basketball@sports.social', display_name: 'Basketball', is_seed: true },
]
