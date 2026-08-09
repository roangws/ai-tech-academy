-- Where course media lives.
--
-- --------------------------------------------------------------- two buckets
--
-- Audio is public and documents are not, and that split is deliberate rather
-- than an oversight in one direction or the other.
--
-- Audio wants to be public: range requests are how a browser seeks in a 40MB
-- episode, a CDN in front of it is most of the delivery story, and a signed URL
-- that expires mid-listen is a bug a listener experiences as the player dying.
-- If these episodes ever become a podcast feed, an RSS enclosure cannot carry a
-- token at all. The cost of public audio is that a determined person can share a
-- URL, which is the same cost every podcast has always had.
--
-- Documents do not want to be public. A public bucket would put every module-04
-- worksheet outside the account gate this site promises on six separate
-- surfaces, and unlike audio there is no delivery reason to accept that. They
-- are served through short-lived signed URLs, minted per render.
--
-- The application does not care which is which: `lesson_blocks.payload` stores a
-- PATH, never a URL, and src/lib/lms/media.ts is the single place that turns one
-- into something fetchable. Moving a bucket between public and private is a
-- change to that one function.
--
-- The counter-example is already in this repo. `profiles.avatar_url` stores a
-- fully-resolved public URL, so src/app/actions/profile.ts has to string-search
-- for "/avatars/" and slice the path back out in order to delete the old object.
-- That is what storing a URL costs.
--
-- ------------------------------------------------------------- the size limit
--
-- 50 MB. A bucket's file_size_limit is clamped by the project-wide upload limit,
-- which is 50 MB on the free plan, so a larger number here would be a lie that
-- fails at upload time with an error about the wrong thing. 50 MB is roughly a
-- 50-minute episode at 128 kbps mono. Raise the project limit first if episodes
-- will run longer, then raise this.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-media', 'course-media', true, 52428800,
  array['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/x-m4a',
        'image/jpeg', 'image/webp', 'image/png',
        'text/vtt']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-docs', 'course-docs', false, 52428800,
  array['application/pdf', 'text/markdown', 'text/csv', 'text/plain',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------------ policies
--
-- Paths are  <kind>/<courseId>/<file>  — audio/gtm/04-account-brief.mp3 — so the
-- SECOND path segment is the course id, which is exactly what teaches_course()
-- takes. That is the same trick the avatars bucket plays with the first segment
-- being the user id: the path is not decoration, it is the access control.
--
-- Scoping writes by course rather than by role means an instructor on the GTM
-- course cannot overwrite the governance course's audio. Admins pass everywhere.

create policy course_media_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'course-media');

create policy course_media_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'course-media'
    and (
      public.is_admin()
      or public.teaches_course((select auth.uid()), (storage.foldername(name))[2])
    )
  );

create policy course_media_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'course-media'
    and (public.is_admin()
         or public.teaches_course((select auth.uid()), (storage.foldername(name))[2]))
  );

create policy course_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'course-media'
    and (public.is_admin()
         or public.teaches_course((select auth.uid()), (storage.foldername(name))[2]))
  );

-- Documents: no anon read at all. A signed URL is minted server-side for a
-- reader who has already passed the module gate, which is what makes the
-- private bucket worth the extra call.
create policy course_docs_read on storage.objects
  for select to authenticated
  using (bucket_id = 'course-docs');

create policy course_docs_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'course-docs'
    and (public.is_admin()
         or public.teaches_course((select auth.uid()), (storage.foldername(name))[2]))
  );

create policy course_docs_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'course-docs'
    and (public.is_admin()
         or public.teaches_course((select auth.uid()), (storage.foldername(name))[2]))
  );

create policy course_docs_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'course-docs'
    and (public.is_admin()
         or public.teaches_course((select auth.uid()), (storage.foldername(name))[2]))
  );
