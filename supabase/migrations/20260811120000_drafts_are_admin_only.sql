-- A draft course is invisible to everyone but an admin.
--
-- ---------------------------------------------------------------- the hole
--
-- `catalog_courses_read` is `for select to anon, authenticated using (true)`,
-- written when every course in the table was live and the only question was
-- whether the marketing pages could read it. `status` changed that: a draft is
-- a course being written in front of real visitors, and "invisible" was enforced
-- entirely by a `.eq("status", "published")` in `src/lib/catalog.ts`.
--
-- A WHERE clause in application code is not a boundary. The publishable key is
-- in the client bundle by design, and PostgREST is a public endpoint, so anyone
-- could read every draft course — its title, its summary, the modules and
-- lessons under it — by asking the API directly and skipping our reader.
--
-- Nothing sensitive has been in one yet. That is luck rather than design, and
-- the fix is four lines.
--
-- ---------------------------------------------------------- and it costs less
--
-- A second reason, stated at its real size rather than larger.
--
-- With drafts filtered in application code, the catalogue had to be read as the
-- CALLER — the reader needed a session to know whether to include them. With the
-- rule in Postgres it does not: the published catalogue is the same rows for
-- every visitor, so `getCatalog()` uses the anonymous key and touches no
-- cookies. That takes a cookie-dependent read off the request path of every
-- public page and makes `/sitemap.xml` prerendered again.
--
-- It does NOT make the marketing pages static. They are dynamic because the
-- `(site)` layout calls `getViewer()` to decide whether the header offers an
-- account or a sign-in link, which was true before any of this and is a separate
-- trade-off with its own note in that file. Checked against the build output of
-- the commit this branch started from rather than assumed.

-- ------------------------------------------------- one policy per role, not one
--
-- `is_admin()` is granted to `authenticated` and not to `anon`, and a single
-- policy reading `status = 'published' or public.is_admin()` for both roles
-- fails the build with "permission denied for function is_admin" — Postgres does
-- not promise to skip the second branch of an OR, and here it did not. Caught by
-- `next build`, which prerenders the course pages with the anonymous key.
--
-- Granting EXECUTE to `anon` would work and is the wrong fix: it puts a function
-- on the public surface to serve a branch that can only ever return false for a
-- caller with no uid. Two policies say what is actually meant — anon sees
-- published courses, a signed-in admin sees everything — and permissive policies
-- OR together, so a signed-in non-admin still gets the published set.

drop policy if exists catalog_courses_read on public.courses;
drop policy if exists catalog_modules_read on public.modules;
drop policy if exists catalog_lessons_read on public.lessons;

create policy catalog_courses_read_public on public.courses
  for select to anon using (status = 'published');

create policy catalog_courses_read on public.courses
  for select to authenticated using (status = 'published' or public.is_admin());

create policy catalog_modules_read_public on public.modules
  for select to anon
  using (exists (select 1 from public.courses c
                 where c.id = modules.course_id and c.status = 'published'));

create policy catalog_modules_read on public.modules
  for select to authenticated
  using (exists (select 1 from public.courses c
                 where c.id = modules.course_id
                   and (c.status = 'published' or public.is_admin())));

create policy catalog_lessons_read_public on public.lessons
  for select to anon
  using (exists (select 1 from public.modules m
                 join public.courses c on c.id = m.course_id
                 where m.id = lessons.module_id and c.status = 'published'));

create policy catalog_lessons_read on public.lessons
  for select to authenticated
  using (exists (select 1 from public.modules m
                 join public.courses c on c.id = m.course_id
                 where m.id = lessons.module_id
                   and (c.status = 'published' or public.is_admin())));

-- The subqueries above run per row on every catalogue read, so the joins they
-- walk need to be cheap. Both are foreign keys; neither had an index.
create index if not exists modules_course_id_idx on public.modules (course_id);
create index if not exists lessons_module_id_idx on public.lessons (module_id);
