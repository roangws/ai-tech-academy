-- The catalogue becomes editable.
--
-- ---------------------------------------------------------------- why this exists
--
-- Until now `src/lib/content.ts` was the source of truth for every word of the
-- catalogue — course titles, summaries, module names, lesson names — and the
-- database held only structure: ids, module numbers, lesson slots, the access
-- column. The admin console said so in its own docstring and treated it as a
-- deliberate split.
--
-- It is a defensible split for a five-course catalogue authored by one person,
-- and it fails the thing the product is actually for. An instructor cannot
-- create a course, because creating a course is an edit to a TypeScript file and
-- a deploy. That is the whole complaint: "it has to be 100% completely managed
-- by the LMS", and it cannot be while a course is a code change.
--
-- So authority moves. Postgres owns the catalogue. `content.ts` keeps the
-- homepage copy that is genuinely marketing — the hero, the method, the FAQs,
-- the legal pages — and stops owning courses.
--
-- ------------------------------------------------------- what these columns are
--
-- Every column below already existed as a field on the `Course` type in
-- content.ts. Nothing here is a new concept; this is that type, written down in
-- the schema so it can be edited by a person instead of a programmer. The shapes
-- are kept identical on purpose, so the reader in src/lib/catalog.ts is a
-- straight mapping and there is no second definition of what a course is.
--
-- Scalar prose is a column. Ordered lists of strings are `text[]`. The three
-- fields that are lists of objects — facts, stats, preview — are `jsonb`,
-- because they are rendered as opaque units and never queried by their contents.
--
-- ------------------------------------------------------------------ status
--
-- New. There was no way to build a course without it being live, which made
-- authoring and publishing the same act. `draft` is the default so a course
-- being written is invisible until somebody says otherwise, and so the QA pass
-- that this migration ships alongside could create and destroy courses on the
-- production database without a visitor ever seeing one.
--
-- `featured` is the front page. The homepage used to render whatever was in the
-- array, in array order, which meant "which courses does the site lead with" was
-- also a code change.
--
-- ------------------------------------------------------------------- RLS
--
-- Nothing to do. `catalog_courses_write` is already ALL / is_admin(), as are the
-- equivalents on modules, lessons and lesson_blocks, so the console's writes are
-- covered by policies that predate this file. Adding columns to a table does not
-- widen a policy.

create type course_status as enum ('draft', 'published');

alter table public.courses
  add column status        course_status not null default 'draft',
  add column featured      boolean       not null default false,

  -- The cover photograph. Five columns rather than a jsonb blob because the
  -- width and height are load-bearing: `openGraph.images` declares them to a
  -- social card renderer before it has the bytes, and three call sites used to
  -- hardcode 1600x900 over assets that were none of them that size.
  add column cover_src     text,
  add column cover_alt     text,
  add column cover_width   integer,
  add column cover_height  integer,
  add column cover_focus   text,
  add column cover_build   text,

  add column audience      text,
  add column build         text,
  add column tagline       text,
  add column seo_title     text,
  add column seo_description text,

  add column keywords      text[] not null default '{}',
  add column skills        text[] not null default '{}',
  add column what_learn    text[] not null default '{}',
  add column requirements  text[] not null default '{}',
  add column description   text[] not null default '{}',

  add column facts         jsonb  not null default '[]'::jsonb,
  add column stats         jsonb  not null default '[]'::jsonb,
  add column preview       jsonb;

-- A course is addressed by its slug on every public URL, so two courses may not
-- share one. `slug` was already unique; this is the id, which is what the admin
-- console generates from the title and what the LMS joins progress on.
alter table public.courses
  add constraint courses_id_shape check (id ~ '^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$');

-- The three jsonb columns hold arrays of objects and nothing else. Without this
-- a typo in the console could store an object where the renderer maps an array,
-- which is a runtime crash on a public page rather than a rejected save.
alter table public.courses
  add constraint courses_facts_is_array   check (jsonb_typeof(facts) = 'array'),
  add constraint courses_stats_is_array   check (jsonb_typeof(stats) = 'array'),
  add constraint courses_preview_is_object check (preview is null or jsonb_typeof(preview) = 'object');

-- Everything that exists today was written before there was a draft state, and
-- all five are live on the site right now.
update public.courses set status = 'published';

-- The homepage leads with the two the site has always led with: they are the
-- first two in the array `content.ts` exported, which is what `sections/courses`
-- rendered.
update public.courses set featured = true where id in ('gtm', 'media');

-- ---------------------------------------------------------------- lesson slugs
--
-- A lesson is addressed by slug within its module, and the admin console is
-- about to let people rename them. Two lessons in one module answering to the
-- same URL is a silent 50/50 as to which one a reader gets, so it is refused
-- here rather than hoped about in the form handler.
create unique index if not exists lessons_module_slug_key
  on public.lessons (module_id, slug);

-- Same argument, one level up: `/learn/<course>/<n>` addresses a module by its
-- number within a course.
create unique index if not exists modules_course_n_key
  on public.modules (course_id, n);

comment on column public.courses.status is
  'draft courses are invisible to every public surface and to /learn. Set by the admin console.';
comment on column public.courses.featured is
  'appears in the homepage course section. Ordering within it follows courses.position.';
