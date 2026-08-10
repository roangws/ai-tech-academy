-- Exactly one course can lead the homepage.
--
-- ----------------------------------------------------------------- how it broke
--
-- Found by QA on the redesigned /admin/courses: two rows rendered the "Leads the
-- homepage" badge at once, because two rows genuinely had `featured = true`.
--
-- `setFeatured` is not the culprit and never was — it clears every other row
-- before setting the chosen one, and has since it was written. Nothing else in
-- the application writes the column. So the pair came from a seed or a direct
-- write, which is exactly the class of state an application-level invariant
-- cannot defend against: the rule lived in one function, and anything that did
-- not go through that function was free to break it.
--
-- The old console hid the damage. `featured` rendered as one small chip among
-- five other same-sized controls, so two of them being lit read as noise; the
-- redesign gives the badge its own weight and the duplicate became obvious the
-- first time somebody looked at the screen.
--
-- What it costs downstream: `getFeatured()` returns an array, and the homepage
-- grid draws its first element as a wide lead card. Two featured courses means
-- two wide cards in a grid built for one.
--
-- ------------------------------------------------------------------ the index
--
-- A partial unique index on the constant column, which is the standard way to
-- spell "at most one row satisfying this predicate" in Postgres: every row with
-- `featured = true` indexes the same key, so a second one is a unique violation.
-- Rows with `featured = false` are not in the index at all, so there is no
-- contention on the common case.
--
-- `roster_one_lead_idx` in 20260812100000 is the same shape for the same reason —
-- the lead instructor is one row out of a list, and no single row can check it.
--
-- The data is corrected first, because the index cannot be created while it is
-- violated. The course kept is the one at the lowest `position`, which is the
-- one the grid was already drawing first.

update public.courses
set featured = false
where featured
  and id <> (
    select id from public.courses where featured order by position limit 1
  );

create unique index courses_one_featured_idx
  on public.courses (featured) where featured;
