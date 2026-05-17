import { BskyAgent } from '@atproto/api'

let agent: BskyAgent | null = null

export async function getBskyAgent(): Promise<BskyAgent> {
  if (agent) return agent
  
  agent = new BskyAgent({ service: 'https://bsky.social' })
  
  await agent.login({
    identifier: process.env.BSKY_HANDLE!,
    password: process.env.BSKY_APP_PASSWORD!,
  })
  
  return agent
}

// Search for basketball-related accounts on Bluesky
export async function searchBskyAccounts(query: string, limit = 25) {
  const agent = await getBskyAgent()
  const res = await agent.searchActors({ q: query, limit })
  return res.data.actors
}

// Get recent posts from an account
export async function getBskyPosts(did: string, limit = 20) {
  const agent = await getBskyAgent()
  const res = await agent.getAuthorFeed({ actor: did, limit })
  return res.data.feed
}

// Get followers of an account (for discovery)
export async function getBskyFollowers(did: string, limit = 100) {
  const agent = await getBskyAgent()
  const res = await agent.getFollowers({ actor: did, limit })
  return res.data.followers
}

// Extract URLs from a Bluesky post
export function extractUrlsFromBskyPost(post: any): string[] {
  const urls: string[] = []
  
  // Check facets for links
  const facets = post.record?.facets || []
  for (const facet of facets) {
    for (const feature of facet.features || []) {
      if (feature.$type === 'app.bsky.richtext.facet#link' && feature.uri) {
        urls.push(feature.uri)
      }
    }
  }
  
  // Check embed for external links
  if (post.record?.embed?.external?.uri) {
    urls.push(post.record.embed.external.uri)
  }
  if (post.embed?.external?.uri) {
    urls.push(post.embed.external.uri)
  }
  
  return [...new Set(urls)] // deduplicate
}
