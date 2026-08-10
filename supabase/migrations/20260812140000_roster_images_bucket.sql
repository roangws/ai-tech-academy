-- Somewhere to put a portrait and an employer mark that did not arrive in a
-- pull request.
--
-- ------------------------------------------------------------------ the report
--
-- Roan, on /admin/roster/aaron: "I can't upload a logo."
--
-- He was right and the form was worse than it looked. It asked for a "Portrait
-- path" and an "Employer mark path" under /public — which is a directory in the
-- git repository, not a place a running application can write. So the only way
-- to change a judge's photograph was to commit a file and deploy, which is the
-- exact failure moving the roster into Postgres was supposed to end. The table
-- became editable and the pictures did not.
--
-- ------------------------------------------------------------------ the bucket
--
-- Public, because these images are on public pages and a signed URL that expires
-- is the wrong shape for a portrait a crawler should be able to fetch.
--
-- `avatars` is the closest existing bucket and is deliberately not reused. Its
-- write policy keys on the first path segment being the uploader's own user id —
-- that is what makes it safe for anybody to write to — and a roster image is
-- written by an admin ON BEHALF OF somebody who may not have an account at all.
-- Bending the avatars policy to allow that would weaken the one rule protecting
-- every learner's own folder.
--
-- Paths are `<roster id>/<timestamp>.<ext>`. The id prefix keeps one person's
-- images together so a delete can find them; the timestamp is what makes a
-- replacement a new URL rather than an overwrite, because overwriting leaves the
-- old image cached on every CDN edge and in every open tab — the note in
-- actions/profile.ts explains that at length and it applies identically here.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'roster', 'roster', true, 2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- SVG is allowed here and nowhere else on this project, because employer marks
-- ship as SVG — `/images/logos/nvidia.svg` and `pge.svg` already do. An SVG is
-- an executable document, so this is only tolerable because the bucket is
-- admin-write: nothing a learner uploads can ever land in it. It is served from
-- the storage host rather than the app origin, so a script inside one cannot
-- reach an app cookie.

create policy roster_images_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'roster');

create policy roster_images_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'roster' and public.is_admin());

create policy roster_images_update on storage.objects
  for update to authenticated
  using (bucket_id = 'roster' and public.is_admin())
  with check (bucket_id = 'roster' and public.is_admin());

create policy roster_images_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'roster' and public.is_admin());
