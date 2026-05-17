-- ProperHoops Basketball Digg — Database Schema
-- Run this entire file in Supabase SQL Editor

-- ── Voices ─────────────────────────────────────────────────────────────────
-- The 500 basketball voices we track across platforms
CREATE TABLE IF NOT EXISTS voices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL, -- 'bluesky' | 'threads' | 'fediverse'
  platform_id TEXT NOT NULL, -- platform-specific user ID
  handle TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  follower_count INTEGER DEFAULT 0,
  basketball_score FLOAT DEFAULT 0, -- AI-scored relevance to basketball (0-100)
  is_seed BOOLEAN DEFAULT FALSE, -- part of the manual seed list
  is_active BOOLEAN DEFAULT TRUE,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, platform_id)
);

-- ── Posts ──────────────────────────────────────────────────────────────────
-- Posts from tracked voices that contain external links
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  platform_post_id TEXT NOT NULL,
  voice_id UUID REFERENCES voices(id) ON DELETE CASCADE,
  content TEXT,
  url TEXT, -- the external URL shared in the post
  post_url TEXT, -- link to the post itself
  like_count INTEGER DEFAULT 0,
  repost_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  engagement_score FLOAT DEFAULT 0,
  posted_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  story_id UUID,
  UNIQUE(platform, platform_post_id)
);

-- ── Stories ────────────────────────────────────────────────────────────────
-- Clustered stories ranked by velocity
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  tag TEXT NOT NULL, -- NBA | WNBA | NBL | etc
  url TEXT, -- the canonical article URL
  image_url TEXT,
  voice_count INTEGER DEFAULT 0, -- how many voices are talking about it
  post_count INTEGER DEFAULT 0, -- total posts about it
  velocity_score FLOAT DEFAULT 0, -- rising speed
  peak_velocity FLOAT DEFAULT 0,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  is_trending BOOLEAN DEFAULT FALSE
);

-- Add story FK to posts
ALTER TABLE posts ADD CONSTRAINT fk_story 
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE SET NULL;

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_voices_platform ON voices(platform);
CREATE INDEX IF NOT EXISTS idx_voices_active ON voices(is_active);
CREATE INDEX IF NOT EXISTS idx_voices_basketball_score ON voices(basketball_score DESC);
CREATE INDEX IF NOT EXISTS idx_posts_voice_id ON posts(voice_id);
CREATE INDEX IF NOT EXISTS idx_posts_posted_at ON posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_url ON posts(url);
CREATE INDEX IF NOT EXISTS idx_posts_story_id ON posts(story_id);
CREATE INDEX IF NOT EXISTS idx_stories_velocity ON stories(velocity_score DESC);
CREATE INDEX IF NOT EXISTS idx_stories_tag ON stories(tag);
CREATE INDEX IF NOT EXISTS idx_stories_last_updated ON stories(last_updated DESC);

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read voices" ON voices FOR SELECT USING (true);
CREATE POLICY "Public read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Public read stories" ON stories FOR SELECT USING (true);

CREATE POLICY "Service write voices" ON voices FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write posts" ON posts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write stories" ON stories FOR ALL USING (auth.role() = 'service_role');
