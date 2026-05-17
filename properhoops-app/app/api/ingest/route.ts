import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getBskyAgent, getBskyPosts, extractUrlsFromBskyPost } from '@/lib/bluesky'
import { getMastodonPosts, extractUrlsFromMastodonPost } from '@/lib/fediverse'

// Domains we don't want to track (social platforms, not news)
const SKIP_DOMAINS = [
  'bsky.app', 'bsky.social', 'threads.net', 'twitter.com', 'x.com',
  'instagram.com', 'facebook.com', 'tiktok.com', 'youtube.com',
  'bit.ly', 't.co', 'buff.ly'
]

function isValidNewsUrl(url: string): boolean {
  try {
    const domain = new URL(url).hostname
    return !SKIP_DOMAINS.some(skip => domain.includes(skip))
  } catch {
    return false
  }
}

function calcEngagement(likes: number, reposts: number, replies: number): number {
  return likes + (reposts * 2) + (replies * 1.5)
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-ingest-secret')
  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get active voices — process in batches
  const { data: voices } = await supabaseAdmin
    .from('voices')
    .select('*')
    .eq('is_active', true)
    .order('last_checked', { ascending: true }) // process least recently checked first
    .limit(100)

  if (!voices || voices.length === 0) {
    return NextResponse.json({ message: 'No voices to check — run /api/discover first' })
  }

  let postsAdded = 0
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // ── Bluesky ───────────────────────────────────────────────────────────────
  const bskyVoices = voices.filter(v => v.platform === 'bluesky')
  console.log(`Checking ${bskyVoices.length} Bluesky voices...`)

  for (const voice of bskyVoices) {
    try {
      const feed = await getBskyPosts(voice.platform_id, 20)
      
      for (const item of feed) {
        const post = item.post
        const postedAt = new Date(post.indexedAt)
        if (postedAt < new Date(since)) continue

        const urls = extractUrlsFromBskyPost(post).filter(isValidNewsUrl)
        if (urls.length === 0) continue

        for (const url of urls) {
          const engagement = calcEngagement(
            post.likeCount || 0,
            post.repostCount || 0,
            post.replyCount || 0
          )

          await supabaseAdmin.from('posts').upsert({
            platform: 'bluesky',
            platform_post_id: post.uri,
            voice_id: voice.id,
            content: post.record?.text || '',
            url,
            post_url: `https://bsky.app/profile/${voice.handle}/post/${post.uri.split('/').pop()}`,
            like_count: post.likeCount || 0,
            repost_count: post.repostCount || 0,
            reply_count: post.replyCount || 0,
            engagement_score: engagement,
            posted_at: postedAt.toISOString()
          }, { onConflict: 'platform,platform_post_id', ignoreDuplicates: true })

          postsAdded++
        }
      }

      // Update last checked
      await supabaseAdmin
        .from('voices')
        .update({ last_checked: new Date().toISOString() })
        .eq('id', voice.id)

      await new Promise(r => setTimeout(r, 200))
    } catch (e: any) {
      console.error(`Bluesky ingest error for ${voice.handle}:`, e.message)
    }
  }

  // ── Fediverse ─────────────────────────────────────────────────────────────
  const fediverseVoices = voices.filter(v => v.platform === 'fediverse')
  console.log(`Checking ${fediverseVoices.length} Fediverse voices...`)

  for (const voice of fediverseVoices) {
    try {
      // Extract instance from handle (user@instance.com)
      const parts = voice.handle.split('@')
      const instance = parts.length > 1 ? parts[parts.length - 1] : 'mastodon.social'
      
      const posts = await getMastodonPosts(voice.platform_id, instance)

      for (const post of posts) {
        const postedAt = new Date(post.created_at)
        if (postedAt < new Date(since)) continue

        const urls = extractUrlsFromMastodonPost(post).filter(isValidNewsUrl)
        if (urls.length === 0) continue

        for (const url of urls) {
          const engagement = calcEngagement(
            post.favourites_count || 0,
            post.reblogs_count || 0,
            post.replies_count || 0
          )

          await supabaseAdmin.from('posts').upsert({
            platform: 'fediverse',
            platform_post_id: post.id,
            voice_id: voice.id,
            content: post.content?.replace(/<[^>]*>/g, '') || '',
            url,
            post_url: post.url,
            like_count: post.favourites_count || 0,
            repost_count: post.reblogs_count || 0,
            reply_count: post.replies_count || 0,
            engagement_score: engagement,
            posted_at: postedAt.toISOString()
          }, { onConflict: 'platform,platform_post_id', ignoreDuplicates: true })

          postsAdded++
        }
      }

      await supabaseAdmin
        .from('voices')
        .update({ last_checked: new Date().toISOString() })
        .eq('id', voice.id)

      await new Promise(r => setTimeout(r, 300))
    } catch (e: any) {
      console.error(`Fediverse ingest error for ${voice.handle}:`, e.message)
    }
  }

  return NextResponse.json({ success: true, postsAdded, voicesChecked: voices.length })
}

export async function GET() {
  const { count } = await supabaseAdmin
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .gte('fetched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  return NextResponse.json({ postsLast24h: count })
}
