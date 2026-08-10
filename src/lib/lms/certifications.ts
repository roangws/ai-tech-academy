import { createClient } from "@/lib/supabase/server";
import { getCatalog, totalLessons, type Course } from "@/lib/catalog";

/**
 * Certifications: what a learner has earned, and what they are close to.
 *
 * ------------------------------------------------------------------ the naming
 *
 * Roan asked for "Certifications" and that is what the destination is called.
 * It is worth writing down that this collides with a copy lock: the note at the
 * head of `content.ts` fixes the canonical vocabulary after the 6 Aug review and
 * says the final artifact is "the completion record, never a deployment record
 * or a shareable record", because the mechanic had six names and a
 * differentiator with six names is forgettable.
 *
 * Both are honoured here rather than one overruling the other, and the split is
 * deliberate: **"Certifications" names the place, "completion record" names the
 * thing.** A learner looks for the former in a nav and holds the latter, the
 * database table is already `completion_records`, and the FAQ, the method
 * section and the outcomes band all already say completion record. Renaming the
 * artifact would be a copy migration across five pages to satisfy a nav label.
 *
 * If that is wrong, the fix is one word in `nav`, this file's exports and four
 * page headings — and it is Roan's call, not this file's.
 *
 * ------------------------------------------------------- the backend already existed
 *
 * `completion_records`, `claim_completion(course_id)` and
 * `issue_completion(user_id, course_id, force)` were already in the database and
 * read by nothing. This module is the missing half. Nothing here re-implements
 * the rules those functions enforce:
 *
 *   - `claim_completion` is SECURITY DEFINER, takes the caller from `auth.uid()`,
 *     and refuses unless every lesson in the course is complete. A learner cannot
 *     claim somebody else's, and cannot claim early.
 *   - The reference format lives in `mint_completion_reference`, so the two
 *     issuing paths cannot drift.
 *   - Reads are governed by `completion_read_own`, `completion_read_as_instructor`
 *     and `completion_admin_write`. This module does not filter by user; Postgres
 *     does.
 */

export type CompletionRecord = {
  id: string;
  user_id: string;
  course_id: string;
  reference: string;
  issued_at: string;
};

/** A course, this reader's progress through it, and the record if they hold one. */
export type CertificationRow = {
  course: Course;
  done: number;
  total: number;
  /** True when every lesson is complete, whether or not it has been claimed. */
  finished: boolean;
  record: CompletionRecord | null;
};

/**
 * Every course this reader is enrolled on, with progress and any record.
 *
 * Courses they have never opened are deliberately absent. A certifications page
 * listing all five with "0 of 39" against four of them is a list of things you
 * have not done, which is not what somebody came to that page for — the empty
 * state says how to earn one instead, and says it once.
 */
export async function getMyCertifications(userId: string): Promise<CertificationRow[]> {
  const supabase = await createClient();

  const [{ data: enrolments }, { data: progress }, { data: records }] = await Promise.all([
    supabase.from("enrollments").select("course_id").eq("user_id", userId),
    /* Progress joined up to the course, so one query answers "how many lessons
       of each course has this person finished" rather than one query per
       course. Same shape `getDashboard` uses. */
    supabase
      .from("lesson_progress")
      .select("lesson_id, lessons!inner(modules!inner(course_id))")
      .eq("user_id", userId),
    supabase.from("completion_records").select("*").eq("user_id", userId),
  ]);

  const doneByCourse = new Map<string, number>();
  for (const row of (progress ?? []) as unknown as {
    lessons: { modules: { course_id: string } };
  }[]) {
    const id = row.lessons?.modules?.course_id;
    if (id) doneByCourse.set(id, (doneByCourse.get(id) ?? 0) + 1);
  }

  const recordByCourse = new Map(
    ((records ?? []) as CompletionRecord[]).map((r) => [r.course_id, r]),
  );
  const catalog = await getCatalog();

  /*
    Enrolments OR records, unioned.

    A record without an enrolment is possible — an admin can `issue_completion`
    for somebody who never pressed Start, and withdrawing from a course does not
    revoke what was already earned. Keying the list on enrolments alone would
    hide a certificate the person actually holds, which is the one thing this
    page must never do.
  */
  const courseIds = new Set<string>([
    ...((enrolments ?? []) as { course_id: string }[]).map((e) => e.course_id),
    ...recordByCourse.keys(),
  ]);

  return catalog
    .filter((c) => courseIds.has(c.id))
    .map((course) => {
      const total = totalLessons(course);
      const done = doneByCourse.get(course.id) ?? 0;
      return {
        course,
        done,
        total,
        /* `total > 0` matters: an un-seeded course has no lessons, and
           `0 >= 0` would report it finished and offer a certificate for a course
           with nothing in it. `claim_completion` refuses that too. */
        finished: total > 0 && done >= total,
        record: recordByCourse.get(course.id) ?? null,
      };
    });
}

/** One record by course, for the printable certificate page. */
export async function getMyCertification(
  userId: string,
  courseId: string,
): Promise<CertificationRow | null> {
  return (await getMyCertifications(userId)).find((r) => r.course.id === courseId) ?? null;
}

/* --------------------------------------------------------------------- admin */

export type AdminCertification = CompletionRecord & {
  name: string;
  email: string | null;
  courseTitle: string;
  courseBadge: string;
};

/**
 * Every record on the site, newest first, with who holds it.
 *
 * `completion_admin_write` is `for all` on `is_admin()`, so an admin's read
 * returns every row; a non-admin calling this gets only their own, which is
 * correct rather than a leak. The profile join is a second query rather than an
 * embed because `completion_records` has no foreign key to `profiles` — both
 * point at `auth.users` — so PostgREST cannot infer the relationship.
 */
export async function listCertifications(): Promise<AdminCertification[]> {
  const supabase = await createClient();

  const { data: records } = await supabase
    .from("completion_records")
    .select("*")
    .order("issued_at", { ascending: false });

  const rows = (records ?? []) as CompletionRecord[];
  if (!rows.length) return [];

  const [{ data: profiles }, catalog] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", [...new Set(rows.map((r) => r.user_id))]),
    getCatalog(),
  ]);

  const person = new Map(
    ((profiles ?? []) as { id: string; first_name: string | null; last_name: string | null; email: string | null }[]).map(
      (p) => [p.id, p],
    ),
  );
  const course = new Map(catalog.map((c) => [c.id, c]));

  return rows.map((r) => {
    const p = person.get(r.user_id);
    return {
      ...r,
      /* An account deleted after earning a record leaves the row behind and the
         profile gone. "Deleted account" rather than a blank cell, so the list
         stays countable and nobody reads a gap as a bug. */
      name: [p?.first_name, p?.last_name].filter(Boolean).join(" ") || p?.email || "Deleted account",
      email: p?.email ?? null,
      courseTitle: course.get(r.course_id)?.title ?? r.course_id,
      courseBadge: course.get(r.course_id)?.badge ?? "—",
    };
  });
}
