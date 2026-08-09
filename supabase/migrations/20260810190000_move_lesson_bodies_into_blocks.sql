-- Close the other half of the leak.
--
-- `lesson_blocks` is gated by `catalog_blocks_read`, but `lessons.body` was
-- never moved and `catalog_lessons_read` is still `using (true)`. So the 173
-- generated bodies stayed world-readable over PostgREST after the gate shipped:
--
--   GET /rest/v1/lessons?module_id=eq.<locked module>  ->  5 rows, bodies included
--
-- Gating `lessons` as a whole is not available: lesson NAMES are public copy,
-- rendered on /courses/[slug] and authored in content.ts, and a course whose
-- syllabus is secret cannot be marketed. The fix is to finish what the block
-- model started — content lives in the child row, and `lessons` keeps only what
-- is already public.
--
-- The bodies become prose blocks keyed `scaffold`, and that key is load-bearing
-- rather than decorative: it is how the lesson page keeps telling the truth. A
-- lesson whose only block is the scaffold is still unwritten and still says so
-- at the top; the banner disappears when an author adds anything else. Seeding
-- these as plain `prose` would have marked all 173 lessons authored overnight.

insert into public.lesson_blocks (lesson_id, key, position, kind, title, payload)
select l.id, 'scaffold', 0, 'prose'::public.lesson_block_kind, null,
       jsonb_build_object('md', l.body)
  from public.lessons l
 where l.body is not null
   and btrim(l.body) <> ''
on conflict (lesson_id, key) do update set payload = excluded.payload;

-- Dropped rather than nulled: a NULL column invites somebody to start writing to
-- it again, and this one cannot be gated.
alter table public.lessons drop column body;

-- Verification. Signed out, a locked module's blocks must not come back.
select
  (select count(*) from public.lesson_blocks where key = 'scaffold') as scaffolds,
  (select count(*) from public.lessons)                              as lessons,
  (select count(*) from information_schema.columns
     where table_schema = 'public' and table_name = 'lessons'
       and column_name = 'body')                                     as body_column_must_be_zero;
