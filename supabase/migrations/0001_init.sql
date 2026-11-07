create extension if not exists pgcrypto;

create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website_url text,
  ig_user_id text unique,
  ig_username text,
  followers int,
  dna jsonb not null,
  audience jsonb,
  created_at timestamptz not null default now()
);

create table personas (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  name text not null, age_range text not null, gender text, location text,
  description text not null,
  motivations jsonb not null default '[]',
  pain_points jsonb not null default '[]',
  content_they_love jsonb not null default '[]',
  preferred_format text not null,
  segment_share numeric not null default 0.25,
  grounded_in text not null default ''
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  kind text not null default 'generated' check (kind in ('generated','imported_history')),
  goal text not null,
  platform text not null check (platform in ('instagram','facebook')),
  brief text not null,
  formats text[] not null default '{}',
  status text not null default 'generating',
  created_at timestamptz not null default now()
);

create table variants (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  origin text not null default 'generated' check (origin in ('generated','imported')),
  format text not null,
  angle text not null default '',
  caption text not null default '',
  hashtags text[] not null default '{}',
  cta text not null default '',
  image_headline text not null default '',
  image_prompt text not null default '',
  image_url text,
  reel_script jsonb,
  suggested_post_hour int,
  panel jsonb not null default '[]',
  panel_score numeric,
  predicted_engagement_rate numeric,
  rank int not null default 1,
  status text not null default 'draft',
  applied_learning_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table publications (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references variants(id) on delete cascade,
  platform text not null,
  mode text not null check (mode in ('live','mock','imported')),
  account text not null default 'publish' check (account in ('main','publish')),
  external_id text unique,
  permalink text,
  status text not null,
  error text,
  published_at timestamptz not null default now()
);

create table metrics (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references publications(id) on delete cascade,
  reach int not null default 0, views int not null default 0,
  likes int not null default 0, comments int not null default 0,
  shares int not null default 0, saves int not null default 0,
  engagement_rate numeric not null default 0,
  source text not null check (source in ('live','seeded','simulated')),
  captured_at timestamptz not null default now()
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  external_id text not null unique,
  media_external_id text not null,
  text text not null,
  like_count int,
  sentiment text, topic text, is_question boolean,
  suggested_reply text,
  replied boolean not null default false,
  created_at timestamptz not null default now()
);

create table learnings (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  insight text not null, evidence text not null,
  confidence text not null check (confidence in ('low','medium','high')),
  created_at timestamptz not null default now()
);

create table model_state (
  brand_id uuid primary key references brands(id) on delete cascade,
  weights jsonb not null, r2 numeric, samples int not null default 0,
  trained_on text not null default 'live',
  updated_at timestamptz not null default now()
);

create table loyalty_ideas (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  title text not null, mechanic text not null, description text not null, why text not null,
  created_at timestamptz not null default now()
);

create table ai_usage (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete cascade,
  operation text not null,
  provider text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cost_eur numeric not null default 0,
  estimated boolean not null default false,
  latency_ms int,
  created_at timestamptz not null default now()
);

create index on personas(brand_id);
create index on campaigns(brand_id);
create index on variants(campaign_id);
create index on publications(variant_id);
create index on metrics(publication_id);
create index on comments(brand_id);
create index on learnings(brand_id);
create index on loyalty_ideas(brand_id);
create index on ai_usage(brand_id);
create index on ai_usage(campaign_id);

do $$ declare t text; begin
  foreach t in array array['brands','personas','campaigns','variants','publications','metrics',
    'comments','learnings','model_state','loyalty_ideas','ai_usage'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;
-- No policies on purpose: only the server (service role) accesses data.

insert into storage.buckets (id, name, public) values ('creatives','creatives', true)
on conflict (id) do nothing;
