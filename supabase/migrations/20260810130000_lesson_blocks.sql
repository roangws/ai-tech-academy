-- An ordered, typed content model for lessons.
--
-- ---------------------------------------------------------------- why a block list
--
-- A lesson was one `body` text column rendered by a ~40-line markdown subset
-- that deliberately never touches dangerouslySetInnerHTML. That is a good
-- property and it is why the renderer is not being extended: teaching it a
-- `::: video :::` fence means giving it a parser, and a parser that emits
-- components is one careless change away from being the injection vector its
-- docstring promises it can never become.
--
-- Course content is about to be mostly YouTube video and self-hosted podcast
-- audio, plus docs, knowledge checks, embedded tools, guided exercises and
-- fillable checklists. A lesson will routinely be "intro video, then prose, then
-- the episode, then two PDFs, then a check" -- in an order the author chooses.
-- Flat columns on `lessons` cannot express order and break on the first second
-- attachment. A media-only child table cannot order media relative to prose.
-- An ordered list of typed blocks is the only shape that holds all of it, and
-- prose becomes one block type rather than a special case.
--
-- ------------------------------------------------- and why it is a security fix
--
-- `catalog_lessons_read` is `using (true)`. The free-first-module gate lives
-- entirely in src/lib/lms/access.ts and an early return in the module page --
-- a rendering gate. Proven against production with nothing but the publishable
-- key that ships in the browser bundle and no session at all:
--
--   GET /rest/v1/lessons?module_id=eq.<module 02, access='account'>
--   -> 200, five lessons, ~1,120 characters of body each
--
-- Today that leaks generated scaffolding. The moment a lesson carries a YouTube
-- id, a podcast path and a quiz answer key it gives away the course.
--
-- It cannot be fixed while content lives on `lessons`, because lesson *names*
-- must stay world-readable -- they are already public copy on /courses/[slug]
-- and in content.ts. Names public, content gated is not expressible as one row
-- policy over one table. It is trivial once content is a child row, which is the
-- strongest argument for this shape and the reason it lands before any media.

create type public.lesson_block_kind as enum (
  'prose', 'video', 'audio', 'doc', 'quiz', 'embed', 'exercise', 'checklist'
);

create table public.lesson_blocks (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid not null references public.lessons (id) on delete cascade,

  -- Identity, not order -- the same lesson learned one table up. `media_positions`
  -- points at block_id, so keying a block by its slot would reintroduce exactly
  -- the bug 20260810120000 just removed from `lessons`. Authored: 'intro',
  -- 'episode', 'brief-pdf', 'check'.
  key        text not null,

  position   integer not null,
  kind       public.lesson_block_kind not null,
  title      text,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (lesson_id, key)
);

-- Presentation order, and deferrable so reordering a whole lesson commits in one
-- statement. Deferrable also means Postgres refuses it as an ON CONFLICT
-- arbiter, so the wrong key is unusable by accident rather than by discipline.
alter table public.lesson_blocks
  add constraint lesson_blocks_lesson_position_key
  unique (lesson_id, position) deferrable initially deferred;

create index lesson_blocks_lesson_idx on public.lesson_blocks (lesson_id, position);

create trigger lesson_blocks_touch before update on public.lesson_blocks
  for each row execute function public.touch_updated_at();

-- What each kind's payload must contain. jsonb buys ordering and per-kind shape
-- for free; the cost is losing column constraints, and this is that cost paid
-- back. A malformed block fails at write time rather than rendering as an empty
-- box a learner has to report.
--
-- The `embed` origin list is hardcoded here rather than read from a table
-- because a CHECK cannot reference another table, and more importantly because
-- "which third parties may execute script inside our page" should require a
-- migration and a review, not an INSERT. It must be edited in the same commit as
-- the frame-src CSP in next.config.ts -- the two are one fact stated twice.
alter table public.lesson_blocks add constraint lesson_blocks_payload_shape check (
  case kind
    when 'prose' then
      jsonb_typeof(payload -> 'md') = 'string'
      and length(payload ->> 'md') between 1 and 40000
    when 'video' then
      payload ->> 'youtube_id' ~ '^[A-Za-z0-9_-]{11}$'
    when 'audio' then
      payload ->> 'path' ~ '^audio/[a-z0-9-]+/[a-z0-9._-]+\.(mp3|m4a)$'
    when 'doc' then
      payload ->> 'path' ~ '^docs/[a-z0-9-]+/[a-z0-9._-]+\.(pdf|md|csv|xlsx|docx)$'
    when 'quiz' then
      jsonb_typeof(payload -> 'questions') = 'array'
      and jsonb_array_length(payload -> 'questions') between 1 and 20
    when 'embed' then
      payload ->> 'src' ~ '^https://(www\.figma\.com|colab\.research\.google\.com|codesandbox\.io|www\.desmos\.com|www\.loom\.com)/'
    when 'exercise' then
      jsonb_typeof(payload -> 'prompt') = 'string'
      and length(payload ->> 'prompt') between 1 and 8000
    when 'checklist' then
      jsonb_typeof(payload -> 'steps') = 'array'
      and jsonb_array_length(payload -> 'steps') between 1 and 40
  end
);

-- ------------------------------------------------------------- learner state
--
-- Where a learner's answers to an `exercise` or `checklist` block live. Shaped
-- like lesson_progress -- one row per (learner, block) -- rather than an event
-- log, because the question it answers is "what did they write", not "when did
-- they type it".
--
-- Quiz answers deliberately do NOT come here in this pass: the quiz is a
-- self-check that grades nothing and gates nothing, so its state is client-side
-- and its answer key is readable in the payload. That is an accepted trade, and
-- the day a quiz gates completion it needs its own table with the key revoked
-- and grading behind a SECURITY DEFINER function.
create table public.block_responses (
  user_id    uuid not null references auth.users (id) on delete cascade,
  block_id   uuid not null references public.lesson_blocks (id) on delete cascade,
  body       jsonb not null default '{}'::jsonb,
  status     public.artifact_status not null default 'draft',
  updated_at timestamptz not null default now(),
  primary key (user_id, block_id)
);

create index block_responses_block_idx on public.block_responses (block_id);

create trigger block_responses_touch before update on public.block_responses
  for each row execute function public.touch_updated_at();

alter table public.lesson_blocks   enable row level security;
alter table public.block_responses enable row level security;
