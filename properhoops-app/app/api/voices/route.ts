import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, count, error } = await supabaseAdmin
    .from('voices')
    .select('id, handle, display_name, avatar_url, platform, basketball_score, follower_count, is_seed', { count: 'exact' })
    .eq('is_active', true)
    .order('basketball_score', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ voices: data || [], total: count })
}
