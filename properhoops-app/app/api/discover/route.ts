import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { searchBskyAccounts, getBskyFollowers } from '@/lib/bluesky'
import { searchMastodonAccounts } from '@/lib/fediverse'
import { SEED_VOICES } from '@/lib/seeds'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Basketball search terms for discovery
const DISCOVERY_QUERIES = [
  'NBA basketball', 'WNBA', 'NBL basketball', 'basketball analyst',
  'basketball journalist', 'hoops', 'NCAA basketball', 'FIBA basketball',
  'basketball reporter', 'basketball writer', 'basketball podcast'
]

async function scoreVoiceWithAI(handle: string, displayName: string, bio: string): Promise<number> {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Rate how relevant this social media account is to basketball news and analysis on a scale of 0-100. 
        
Handle: ${handle}
Name: ${displayName}
Bio: ${bio}

Return ONLY a number between 0 and 100. No explanation.
- 80-100: Dedicated basketball account (journalists, teams, leagues, analysts)
- 50-79: Regular basketball content mixed with other sports
- 20-49: Occasional basketball content
- 0-19: Not basketball related`
      }]
    })
    const score = parseInt(msg.content[0].type === 'text' ? msg.content[0].text.trim() : '0')
    return isNaN(score) ? 0 : Math.min(100, Math.max(0, score))
  } catch (e) {
    return 0
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-ingest-secret')
  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let voicesAdded = 0

  // Step 1: Seed the manual list first
  console.log('Seeding manual voices...')
  for (const voice of SEED_VOICES) {
    const { error } = await supabaseAdmin
      .from('voices')
      .upsert({
        platform: voice.platform,
        platform_id: voice.handle,
        handle: voice.handle,
        display_name: voice.display_name,
        is_seed: true,
        basketball_score: 90, // seed voices are pre-approved
        is_active: true
      }, { onConflict: 'platform,platform_id', ignoreDuplicates: true })
    
    if (!error) voicesAdded++
  }

  // Step 2: Auto-discover on Bluesky
  console.log('Discovering Bluesky voices...')
  for (const query of DISCOVERY_QUERIES.slice(0, 5)) { // limit queries to save API calls
    try {
      const accounts = await searchBskyAccounts(query, 25)
      
      for (const account of accounts) {
        // Skip if already in DB
        const { data: existing } = await supabaseAdmin
          .from('voices')
          .select('id')
          .eq('platform', 'bluesky')
          .eq('platform_id', account.did)
          .single()
        
        if (existing) continue

        // Score with AI
        const score = await scoreVoiceWithAI(
          account.handle,
          account.displayName || '',
          account.description || ''
        )

        if (score >= 60) { // only add if genuinely basketball-related
          await supabaseAdmin.from('voices').upsert({
            platform: 'bluesky',
            platform_id: account.did,
            handle: account.handle,
            display_name: account.displayName,
            avatar_url: account.avatar,
            bio: account.description,
            follower_count: account.followersCount || 0,
            basketball_score: score,
            is_seed: false,
            is_active: true
          }, { onConflict: 'platform,platform_id', ignoreDuplicates: true })
          
          voicesAdded++
        }

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 500))
      }
    } catch (e: any) {
      console.error(`Discovery error for "${query}":`, e.message)
    }
  }

  // Step 3: Expand from seed follows on Bluesky
  console.log('Expanding from seed follows...')
  const { data: seedVoices } = await supabaseAdmin
    .from('voices')
    .select('platform_id, handle')
    .eq('platform', 'bluesky')
    .eq('is_seed', true)
    .limit(5)

  for (const seed of seedVoices || []) {
    try {
      const followers = await getBskyFollowers(seed.platform_id, 50)
      
      for (const follower of followers.slice(0, 20)) {
        const { data: existing } = await supabaseAdmin
          .from('voices')
          .select('id')
          .eq('platform', 'bluesky')
          .eq('platform_id', follower.did)
          .single()
        
        if (existing) continue

        const score = await scoreVoiceWithAI(
          follower.handle,
          follower.displayName || '',
          follower.description || ''
        )

        if (score >= 65) {
          await supabaseAdmin.from('voices').upsert({
            platform: 'bluesky',
            platform_id: follower.did,
            handle: follower.handle,
            display_name: follower.displayName,
            avatar_url: follower.avatar,
            bio: follower.description,
            follower_count: follower.followersCount || 0,
            basketball_score: score,
            is_seed: false,
            is_active: true
          }, { onConflict: 'platform,platform_id', ignoreDuplicates: true })
          
          voicesAdded++
        }

        await new Promise(r => setTimeout(r, 300))
      }
    } catch (e: any) {
      console.error(`Follow expansion error for ${seed.handle}:`, e.message)
    }
  }

  // Step 4: Discover on Mastodon
  console.log('Discovering Fediverse voices...')
  for (const query of ['basketball', 'NBA', 'NBL basketball']) {
    try {
      const accounts = await searchMastodonAccounts(query)
      
      for (const account of accounts) {
        const score = await scoreVoiceWithAI(
          account.acct,
          account.display_name || '',
          account.note?.replace(/<[^>]*>/g, '') || '' // strip HTML
        )

        if (score >= 60) {
          await supabaseAdmin.from('voices').upsert({
            platform: 'fediverse',
            platform_id: account.id,
            handle: account.acct,
            display_name: account.display_name,
            avatar_url: account.avatar,
            bio: account.note?.replace(/<[^>]*>/g, ''),
            follower_count: account.followers_count || 0,
            basketball_score: score,
            is_seed: false,
            is_active: true
          }, { onConflict: 'platform,platform_id', ignoreDuplicates: true })
          
          voicesAdded++
        }
        await new Promise(r => setTimeout(r, 300))
      }
    } catch (e: any) {
      console.error(`Mastodon discovery error:`, e.message)
    }
  }

  // Get total voice count
  const { count } = await supabaseAdmin
    .from('voices')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  return NextResponse.json({
    success: true,
    voicesAdded,
    totalVoices: count
  })
}

export async function GET() {
  const { count } = await supabaseAdmin
    .from('voices')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  
  return NextResponse.json({ totalVoices: count })
}
