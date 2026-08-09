-- Lessons get a stable identity.
--
-- `lessons` had no key but its slot. scripts/seed-catalog.mjs upserted on
-- (module_id, position), and its header argued that the slot "had been the key
-- the whole time". That only held because no lesson had ever been inserted
-- anywhere but the end of a module. A slot is a position in a list: every row
-- below an insert moves. Upserting on it after adding a lesson at index 1 writes
-- lesson 2's content into lesson 1's row, keeps that row's uuid, and hands every
-- completion of the old lesson 1 to whatever now sits there -- lesson_progress
-- is keyed (user_id, lesson_id), so it follows the uuid, not the lesson. Silent,
-- plausible-looking afterwards, and unrecoverable because nothing recorded what
-- the slots used to mean.
--
-- Done now because lesson_progress and enrollments are both empty. The same fix
-- after launch is a data migration against live completions.
--
-- `slug` is authored in src/lib/content.ts and must never be re-derived from
-- `name` again: renaming a lesson is a typo fix, renaming its slug detaches
-- every completion of it. The backfill below is a one-off, and it is safe only
-- because every current slug is exactly the slugify of its current name --
-- verified against content.ts for all 173 rows before this was written.

alter table public.lessons add column if not exists slug text;

update public.lessons
   set slug = trim(both '-' from
                regexp_replace(lower(replace(name, '&', ' and ')), '[^a-z0-9]+', '-', 'g'))
 where slug is null;

-- Every lesson must have one, and it must be unique inside its module.
alter table public.lessons alter column slug set not null;
alter table public.lessons add constraint lessons_module_slug_key unique (module_id, slug);

-- Position stops being identity. It stays unique so a bad seed cannot produce
-- two lesson 3s, but DEFERRABLE so a whole-module reorder commits in one
-- statement instead of tripping over itself halfway through. Being deferrable
-- also makes the old key impossible to reach for by accident: Postgres refuses a
-- deferrable constraint as an ON CONFLICT arbiter outright.
alter table public.lessons drop constraint lessons_module_id_position_key;
alter table public.lessons
  add constraint lessons_module_id_position_key
  unique (module_id, position) deferrable initially deferred;
