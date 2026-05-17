// Fediverse / Mastodon client
// Uses the public Mastodon API — no authentication needed for public timelines

const MASTODON_INSTANCES = [
  'mastodon.social',
  'sports.social',
  'aus.social', // Australian instance
]

export async function searchMastodonAccounts(query: string, instance = 'mastodon.social') {
  try {
    const res = await fetch(
      `https://${instance}/api/v2/search?q=${encodeURIComponent(query)}&type=accounts&limit=20`,
      { headers: { 'Accept': 'application/json' } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.accounts || []
  } catch (e) {
    console.error(`Mastodon search error on ${instance}:`, e)
    return []
  }
}

export async function getMastodonPosts(accountId: string, instance = 'mastodon.social', limit = 20) {
  try {
    const res = await fetch(
      `https://${instance}/api/v1/accounts/${accountId}/statuses?limit=${limit}&exclude_replies=true`,
      { headers: { 'Accept': 'application/json' } }
    )
    if (!res.ok) return []
    return await res.json()
  } catch (e) {
    console.error(`Mastodon posts error:`, e)
    return []
  }
}

export function extractUrlsFromMastodonPost(post: any): string[] {
  const urls: string[] = []
  
  // Check card (link preview)
  if (post.card?.url) urls.push(post.card.url)
  
  // Check content for links
  if (post.content) {
    const matches = post.content.match(/href="([^"]+)"/g) || []
    for (const match of matches) {
      const url = match.replace('href="', '').replace('"', '')
      if (url.startsWith('http') && !url.includes('mastodon')) {
        urls.push(url)
      }
    }
  }
  
  return [...new Set(urls)]
}

export { MASTODON_INSTANCES }
