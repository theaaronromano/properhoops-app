import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// GET — serve stories to frontend
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tag = searchParams.get('tag')
  const limit = parseInt(searchParams.get('limit') || '30')

  let query = supabaseAdmin
    .from('stories')
    .select(`
      *,
      posts (
        id,
        url,
        post_url,
        content,
        platform,
        like_count,
        repost_count,
        engagement_score,
        posted_at,
        voices (
          handle,
          display_name,
          avatar_url,
          platform
        )
      )
    `)
    .order('velocity_score', { ascending: false })
    .gte('last_updated', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
    .limit(limit)

  if (tag && tag !== 'All') {
    query = query.eq('tag', tag)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ stories: data || [] })
}

// POST — cluster new posts into stories and calculate velocity
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-ingest-secret')
  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get recent posts that have URLs (last 24h)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: posts } = await supabaseAdmin
    .from('posts')
    .select('*, voices(handle, display_name, basketball_score)')
    .gte('posted_at', since)
    .not('url', 'is', null)
    .order('posted_at', { ascending: false })
    .limit(200)

  if (!posts || posts.length === 0) {
    return NextResponse.json({ message: 'No posts to cluster' })
  }

  // Group posts by URL first — same URL shared by multiple voices = high signal
  const urlGroups: Record<string, any[]> = {}
  for (const post of posts) {
    if (!post.url) continue
    if (!urlGroups[post.url]) urlGroups[post.url] = []
    urlGroups[post.url].push(post)
  }

  // Calculate velocity for each URL group
  const now = Date.now()
  const urlData = Object.entries(urlGroups).map(([url, urlPosts]) => {
    const voiceCount = new Set(urlPosts.map(p => p.voice_id)).size
    const totalEngagement = urlPosts.reduce((sum, p) => sum + (p.engagement_score || 0), 0)
    const mostRecent = Math.max(...urlPosts.map(p => new Date(p.posted_at).getTime()))
    const ageHours = (now - mostRecent) / (1000 * 60 * 60)
    
    // Velocity = voice count (weighted heavily) + engagement + recency bonus
    const velocity = (voiceCount * 15) + (Math.log(totalEngagement + 1) * 5) + Math.max(0, 24 - ageHours)
    
    return { url, posts: urlPosts, voiceCount, totalEngagement, velocity, mostRecent }
  })
  .filter(d => d.voiceCount >= 1) // at least 1 voice
  .sort((a, b) => b.velocity - a.velocity)
  .slice(0, 50) // top 50 URLs

  if (urlData.length === 0) {
    return NextResponse.json({ message: 'No qualifying URLs found' })
  }

  // Send to Claude for story clustering and tagging
  const urlList = urlData.map((d, i) =>
    `${i + 1}. [${d.voiceCount} voices, velocity: ${d.velocity.toFixed(0)}] ${d.url}`
  ).join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    tools: [{
      name: 'web_search',
      description: 'Search for information about a URL or basketball story',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string' }
        },
        required: ['query']
      }
    }],
    messages: [{
      role: 'user',
      content: `You are a basketball news editor. These are URLs being shared by basketball voices on social media, ranked by how many voices are sharing them.

${urlList}

Group related URLs into basketball stories. For each story:
1. Write a compelling headline
2. Write a 2-3 sentence summary of what's happening
3. Assign a league tag: NBA, WNBA, NBL, WNBL, NCAA, FIBA, Unrivaled, BIG3, or Basketball
4. List which URL numbers belong to this story

Return ONLY a JSON array:
[
  {
    "title": "Story headline",
    "summary": "2-3 sentence summary",
    "tag": "NBA",
    "url_indices": [1, 3],
    "image_url": null
  }
]`
    }]
  })

  let clusters: any[] = []
  try {
    const text = message.content.find(c => c.type === 'text')
    if (text && text.type === 'text') {
      const clean = text.text.replace(/```json|```/g, '').trim()
      clusters = JSON.parse(clean)
    }
  } catch (e) {
    console.error('Failed to parse Claude response')
    return NextResponse.json({ error: 'Clustering failed' }, { status: 500 })
  }

  // Save stories to DB
  let storiesCreated = 0
  for (const cluster of clusters) {
    const clusterUrls = (cluster.url_indices || [])
      .map((i: number) => urlData[i - 1])
      .filter(Boolean)

    if (clusterUrls.length === 0) continue

    const velocity = Math.max(...clusterUrls.map((u: any) => u.velocity))
    const voiceCount = new Set(clusterUrls.flatMap((u: any) => u.posts.map((p: any) => p.voice_id))).size
    const postCount = clusterUrls.reduce((sum: number, u: any) => sum + u.posts.length, 0)
    const primaryUrl = clusterUrls[0].url

    // Upsert story — update if URL already exists
    const { data: story, error } = await supabaseAdmin
      .from('stories')
      .upsert({
        title: cluster.title,
        summary: cluster.summary,
        tag: cluster.tag,
        url: primaryUrl,
        image_url: cluster.image_url || null,
        voice_count: voiceCount,
        post_count: postCount,
        velocity_score: velocity,
        peak_velocity: velocity,
        last_updated: new Date().toISOString(),
        is_trending: velocity > 50
      }, { onConflict: 'url' })
      .select()
      .single()

    if (error || !story) continue

    // Link posts to this story
    const postIds = clusterUrls.flatMap((u: any) => u.posts.map((p: any) => p.id))
    await supabaseAdmin
      .from('posts')
      .update({ story_id: story.id })
      .in('id', postIds)

    storiesCreated++
  }

  return NextResponse.json({
    success: true,
    urlsAnalyzed: urlData.length,
    storiesCreated
  })
}
