import { createClient } from "@/lib/supabase/server";
import { getAdminCatalog, totalLessons, type Course } from "@/lib/catalog";
import type {
  Application,
  AppRole,
  Artifact,
  Enrollment,
  OutcomeSheet,
  Profile,
} from "@/lib/supabase/types";

/**
 * Every read the admin console does.
 *
 * Separate from lms/queries.ts because every function in that file is scoped to
 * one learner, one course or one seat, and every function here is scoped to all
 * of them. Mixing the two would make it impossible to tell, at a glance, which
 * queries can see across accounts.
 *
 * -------------------------------------------------------------- still under RLS
 *
 * Same request-scoped client as everything else. These return rows because the
 * `*_read_as_admin` policies allow them to, not because they bypass anything —
 * there is no service-role client in src/ and there is not going to be one. A
 * non-admin calling any of these gets an empty list, which is the correct
 * outcome and not something this file has to check for.
 *
 * The one exception is the judge roster, which goes through the `admin_seats()`
 * definer RPC: `authenticated` has no SELECT on `judge_seats.user_id` at all,
 * and granting it would publish every judge's identity to every learner because
 * `catalog_seats_read` is `using (true)`.
 */

/* ------------------------------------------------------------------- people */

export type AdminPerson = Profile & {
  roles: AppRole[];
  courses: { course_id: string; kind: string }[];
  enrollments: number;
  lastSeen: string | null;
};

/**
 * Everyone with an account.
 *
 * `profiles` is the roster, not `auth.users`. `profiles_read_as_admin` already
 * exists and `authenticated` holds SELECT on every profiles column including
 * email, so this needs no RPC and no new policy.
 *
 * What `profiles` lacks against `auth.users` is `last_sign_in_at`,
 * `email_confirmed_at` and `banned_until`, and none of those are worth a definer
 * view over the auth schema. "Last seen" is derived from `enrollments` instead,
 * which is the activity that actually matters here.
 */
export async function listPeople(): Promise<AdminPerson[]> {
  const supabase = await createClient();

  const [{ data: profiles }, { data: roles }, { data: assignments }, { data: enrolments }] =
    await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("instructor_assignments").select("user_id, course_id, kind"),
      supabase.from("enrollments").select("user_id, last_seen_at"),
    ]);

  const roleBy = new Map<string, AppRole[]>();
  for (const r of roles ?? []) {
    roleBy.set(r.user_id, [...(roleBy.get(r.user_id) ?? []), r.role as AppRole]);
  }

  const courseBy = new Map<string, { course_id: string; kind: string }[]>();
  for (const a of assignments ?? []) {
    courseBy.set(a.user_id, [...(courseBy.get(a.user_id) ?? []), { course_id: a.course_id, kind: a.kind }]);
  }

  const enrolBy = new Map<string, { n: number; last: string | null }>();
  for (const e of enrolments ?? []) {
    const cur = enrolBy.get(e.user_id) ?? { n: 0, last: null };
    enrolBy.set(e.user_id, {
      n: cur.n + 1,
      last: !cur.last || (e.last_seen_at && e.last_seen_at > cur.last) ? e.last_seen_at : cur.last,
    });
  }

  return (profiles ?? []).map((p) => ({
    ...p,
    roles: (roleBy.get(p.id) ?? []).sort(),
    courses: courseBy.get(p.id) ?? [],
    enrollments: enrolBy.get(p.id)?.n ?? 0,
    lastSeen: enrolBy.get(p.id)?.last ?? null,
  }));
}

/* -------------------------------------------------------------- judge seats */

export type AdminSeat = {
  id: string;
  seat: string;
  reviews_course_id: string | null;
  reviews_label: string | null;
  reads_all_courses: boolean;
  position: number;
  user_id: string | null;
  holder_name: string | null;
  holder_email: string | null;
};

export async function listSeats(): Promise<AdminSeat[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_seats");
  return (data ?? []) as AdminSeat[];
}

/* --------------------------------------------------------------- learners */

export type AdminLearner = {
  profile: Profile;
  course: Course;
  enrollment: Enrollment;
  done: number;
  total: number;
  artifacts: { submitted: number; reviewed: number };
  sheet: OutcomeSheet | null;
  completion: string | null;
};

/** Every enrolment, with enough state to answer "is anyone stuck". */
export async function listLearners(): Promise<AdminLearner[]> {
  const supabase = await createClient();

  const [{ data: enrolments }, { data: profiles }, { data: progress }, { data: artifacts }, { data: sheets }, { data: records }] =
    await Promise.all([
      supabase
        .from("enrollments")
        .select("*")
        .order("last_seen_at", { ascending: false, nullsFirst: false }),
      supabase.from("profiles").select("*"),
      supabase.from("lesson_progress").select("user_id, lessons!inner(modules!inner(course_id))"),
      supabase.from("artifacts").select("user_id, status, modules!inner(course_id)"),
      supabase.from("outcome_sheets").select("*"),
      supabase.from("completion_records").select("user_id, course_id, reference"),
    ]);

  const profileBy = new Map((profiles ?? []).map((p) => [p.id, p]));
  const byId = new Map((await getAdminCatalog()).map((c) => [c.id, c]));

  const key = (u: string, c: string) => `${u}/${c}`;

  const doneBy = new Map<string, number>();
  /* `as unknown as` deliberately. The client is created without the generated
     Database generic, so PostgREST infers a to-one embed as an ARRAY when the
     runtime returns an object — the same mismatch lms/queries.ts documents at
     length. Asserting through `unknown` is the honest spelling of "the inferred
     type is wrong here, and this is the shape that actually arrives". */
  for (const row of (progress ?? []) as unknown as {
    user_id: string;
    lessons: { modules: { course_id: string } };
  }[]) {
    const k = key(row.user_id, row.lessons?.modules?.course_id ?? "");
    doneBy.set(k, (doneBy.get(k) ?? 0) + 1);
  }

  const artBy = new Map<string, { submitted: number; reviewed: number }>();
  for (const row of (artifacts ?? []) as unknown as {
    user_id: string;
    status: Artifact["status"];
    modules: { course_id: string };
  }[]) {
    const k = key(row.user_id, row.modules?.course_id ?? "");
    const cur = artBy.get(k) ?? { submitted: 0, reviewed: 0 };
    if (row.status === "submitted") cur.submitted += 1;
    if (row.status === "reviewed") cur.reviewed += 1;
    artBy.set(k, cur);
  }

  const sheetBy = new Map((sheets ?? []).map((s) => [key(s.user_id, s.course_id), s]));
  const recordBy = new Map((records ?? []).map((r) => [key(r.user_id, r.course_id), r.reference]));

  return (enrolments ?? [])
    .map((e) => {
      const profile = profileBy.get(e.user_id);
      const course = byId.get(e.course_id);
      if (!profile || !course) return null;
      const k = key(e.user_id, e.course_id);
      return {
        profile,
        course,
        enrollment: e,
        done: doneBy.get(k) ?? 0,
        total: totalLessons(course),
        artifacts: artBy.get(k) ?? { submitted: 0, reviewed: 0 },
        sheet: sheetBy.get(k) ?? null,
        completion: recordBy.get(k) ?? null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

/* ------------------------------------------------------------ certificates */

export type AdminCertificate = {
  reference: string;
  issued_at: string;
  course: Course;
  profile: Profile | null;
};

/**
 * Every certificate this program has issued, newest first.
 *
 * `/admin/learners` already shows a reference against the enrolment that earned
 * it, and that is the right place to answer "how is this person doing". It is the
 * wrong place to answer "what have we issued", which needs one row per record
 * rather than one row per enrolment and needs them in the order they were issued
 * rather than in the order people were last seen.
 *
 * Two selects and a join in JS, which is the shape every function in this file
 * uses: PostgREST cannot embed `profiles` from `completion_records` without a
 * declared foreign key between them, and both tables are small enough that the
 * second round trip is cheaper than the migration would be.
 */
export async function listCertificates(): Promise<AdminCertificate[]> {
  const supabase = await createClient();

  const [{ data: records }, { data: profiles }] = await Promise.all([
    supabase
      .from("completion_records")
      .select("reference, issued_at, user_id, course_id")
      .order("issued_at", { ascending: false }),
    supabase.from("profiles").select("*"),
  ]);

  const profileBy = new Map((profiles ?? []).map((p) => [p.id, p]));
  const courseBy = new Map((await getAdminCatalog()).map((c) => [c.id, c]));

  return (records ?? [])
    .map((r) => {
      const course = courseBy.get(r.course_id);
      if (!course) return null;
      return {
        reference: r.reference,
        issued_at: r.issued_at,
        course,
        profile: profileBy.get(r.user_id) ?? null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

/* ---------------------------------------------------------------- insights */

export type Insight = {
  course: Course;
  enrolled: number;
  reachedModule: number[];
  submittedSheets: number;
  scoredSheets: number;
  completions: number;
};

/**
 * The numbers a person running this platform opens the console to see.
 *
 * Everything here is computable from what already exists. Watch and listen time
 * is deliberately absent until there is media to measure — and `lessons.minutes`
 * is an editorial estimate, so any "time spent" derived from it would be
 * fiction with a number attached.
 */
export async function getInsights(): Promise<Insight[]> {
  const supabase = await createClient();

  const [{ data: enrolments }, { data: progress }, { data: sheets }, { data: judgements }, { data: records }] =
    await Promise.all([
      supabase.from("enrollments").select("user_id, course_id"),
      supabase
        .from("lesson_progress")
        .select("user_id, lessons!inner(modules!inner(course_id, position))"),
      supabase.from("outcome_sheets").select("id, course_id, status"),
      supabase.from("judgements").select("sheet_id"),
      supabase.from("completion_records").select("course_id"),
    ]);

  const scoredSheetIds = new Set((judgements ?? []).map((j) => j.sheet_id));

  return (await getAdminCatalog()).map((course) => {
    const mine = (enrolments ?? []).filter((e) => e.course_id === course.id);

    /* The drop-off curve: how many learners got at least one completion inside
       each module. Read down the row and you can see where a course loses
       people, which is the single most useful thing this screen can draw. */
    const reached = course.curriculum.map((_, i) => {
      const users = new Set<string>();
      for (const row of (progress ?? []) as unknown as {
        user_id: string;
        lessons: { modules: { course_id: string; position: number } };
      }[]) {
        if (row.lessons?.modules?.course_id === course.id && row.lessons.modules.position === i) {
          users.add(row.user_id);
        }
      }
      return users.size;
    });

    const courseSheets = (sheets ?? []).filter((s) => s.course_id === course.id);

    return {
      course,
      enrolled: mine.length,
      reachedModule: reached,
      submittedSheets: courseSheets.filter((s) => s.status !== "draft").length,
      scoredSheets: courseSheets.filter((s) => scoredSheetIds.has(s.id)).length,
      completions: (records ?? []).filter((r) => r.course_id === course.id).length,
    };
  });
}

/* ------------------------------------------------------------------ signups */

export type Period = {
  start: string;
  label: string;
  signups: number;
  enrolments: number;
  active: number;
};

/**
 * Twelve months of arrivals.
 *
 * Roan asked to see new students on the dashboard, and nothing tracked them:
 * `profiles.created_at` has recorded every account since the trigger was written and
 * no screen has ever read it.
 *
 * ------------------------------------------------------------ MONTHS, NOT WEEKS
 *
 * This bucketed by Monday-start week until 9 Aug. Roan: "on 'Who arrived, and who
 * came back' make it more sequential, maybe monthly."
 *
 * Weeks were the wrong unit for this program and the chart said so: twelve weekly
 * columns spanned under three months, so eleven of them were empty and the twelfth
 * held everything. A course measured in weeks, taken by a handful of people, produces
 * a signal that only becomes a shape at month scale. Twelve months also reads as a
 * sequence a person recognises, which is what "more sequential" is asking for: Sep,
 * Oct, Nov is a run, and "25 May, 1 Jun, 8 Jun" is arithmetic.
 *
 * Calendar months rather than 30-day windows, because the label has to be a month
 * name for that recognition to work, and "Jun" has to mean June.
 *
 * ------------------------------------------------------------------ the bucketing
 *
 * In TypeScript rather than SQL, because it is three columns over a table that will
 * hold thousands, not millions, and a `date_trunc` group-by behind PostgREST needs an
 * RPC for what a loop does in one pass.
 *
 * The index is derived from the year and month rather than by dividing a duration,
 * which is what a month bucket makes necessary: months are 28 to 31 days long, so
 * `floor(elapsed / MONTH)` drifts by a day per bucket and eventually files a record
 * under its neighbour.
 *
 * "Active" is a learner who completed at least one lesson that month. It is the only
 * honest activity signal the schema has: there is no session table, no page views,
 * and `lessons.minutes` is an editorial estimate, so any "time on site" figure would
 * be a number with nothing behind it.
 */
export async function getMonths(count = 12): Promise<Period[]> {
  const supabase = await createClient();

  const [{ data: profiles }, { data: enrolments }, { data: progress }] = await Promise.all([
    supabase.from("profiles").select("created_at"),
    supabase.from("enrollments").select("enrolled_at"),
    supabase.from("lesson_progress").select("user_id, completed_at"),
  ]);

  /* Most recent last, so the row reads left to right the way a person reads a date. */
  const now = new Date();
  const thisYear = now.getUTCFullYear();
  const thisMonth = now.getUTCMonth();
  /* Months since a fixed origin, so one subtraction gives the offset between any two
     calendar months without touching day lengths at all. */
  const ordinal = (y: number, m: number) => y * 12 + m;
  const newest = ordinal(thisYear, thisMonth);

  const months: Period[] = [];
  for (let k = count - 1; k >= 0; k -= 1) {
    const start = new Date(Date.UTC(thisYear, thisMonth - k, 1));
    months.push({
      start: start.toISOString(),
      /* The year only where the run crosses one, so a twelve-month row is not twelve
         repetitions of the same four digits. January carries it, and so does the
         first column whatever month it is, because that is where a reader looks to
         see when the run begins. */
      label:
        start.getUTCMonth() === 0 || k === count - 1
          ? `${start.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })} ${String(start.getUTCFullYear()).slice(2)}`
          : start.toLocaleString("en-GB", { month: "short", timeZone: "UTC" }),
      signups: 0,
      enrolments: 0,
      active: 0,
    });
  }

  const bucket = (iso: string | null) => {
    if (!iso) return -1;
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) return -1;
    const back = newest - ordinal(t.getUTCFullYear(), t.getUTCMonth());
    /* A future timestamp lands in the current month rather than nowhere: clock skew
       between the database and this process should not lose a signup. */
    if (back < 0) return count - 1;
    return back < count ? count - 1 - back : -1;
  };

  for (const row of profiles ?? []) {
    const i = bucket(row.created_at);
    if (i >= 0) months[i].signups += 1;
  }
  for (const row of enrolments ?? []) {
    const i = bucket(row.enrolled_at);
    if (i >= 0) months[i].enrolments += 1;
  }

  /* One per learner per month, not one per lesson: the question is how many people
     showed up, and somebody ticking nine lessons on a Tuesday is one. */
  const seen = new Set<string>();
  for (const row of (progress ?? []) as { user_id: string; completed_at: string }[]) {
    const i = bucket(row.completed_at);
    if (i < 0) continue;
    const k = `${i}/${row.user_id}`;
    if (seen.has(k)) continue;
    seen.add(k);
    months[i].active += 1;
  }

  return months;
}

/* --------------------------------------------------------------- applications

   The advisory board's queue: every application to teach or to judge, with the
   account behind it.

   ------------------------------------------------------------------ two reads

   `applications` and `profiles` are fetched separately and joined here rather
   than embedded, because there is no foreign key between them to embed on:
   `applications.user_id` references `auth.users`, as every user reference on
   this schema does, and PostgREST can only embed across a declared relationship.
   `listPeople` above joins the same way for the same reason.

   The profile is only ever used for the email and for how long the account has
   existed. Everything the board reads and decides on is on the application row
   itself, which is the point of copying it there -- see the note on the type. */

export type AdminApplication = Application & {
  email: string | null;
  accountCreated: string | null;
};

export async function listApplications(): Promise<AdminApplication[]> {
  const supabase = await createClient();

  const [{ data: apps, error }, { data: profiles }] = await Promise.all([
    supabase
      .from("applications")
      .select("*")
      /* Oldest submission at the top, drafts (no `submitted_at`) at the bottom.
         A queue read newest-first is a queue where the person who has waited
         longest is on page two. The page re-sorts by status on top of this; this
         ordering is what decides ties within a status. */
      .order("submitted_at", { ascending: true, nullsFirst: false }),
    supabase.from("profiles").select("id, email, created_at"),
  ]);
  if (error) throw new Error(`applications: ${error.message}`);

  const byUser = new Map(
    ((profiles ?? []) as { id: string; email: string | null; created_at: string }[]).map((p) => [
      p.id,
      p,
    ]),
  );

  return ((apps ?? []) as Application[]).map((a) => ({
    ...a,
    email: byUser.get(a.user_id)?.email ?? null,
    accountCreated: byUser.get(a.user_id)?.created_at ?? null,
  }));
}
