import { createClient } from "@/lib/supabase/server";
import { courses as catalog, totalLessons, type Course } from "@/lib/content";
import type {
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
  const byId = new Map(catalog.map((c) => [c.id, c]));

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
    .filter((x): x is AdminLearner => x !== null);
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

  return catalog.map((course) => {
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

export type Week = { start: string; label: string; signups: number; enrolments: number; active: number };

/**
 * Twelve weeks of arrivals.
 *
 * Roan asked to see new students on the dashboard, and nothing tracked them:
 * `profiles.created_at` has recorded every account since the trigger was
 * written and no screen has ever read it.
 *
 * Bucketed in TypeScript rather than SQL because it is three columns over a
 * table that will hold thousands, not millions, and a `date_trunc` group-by
 * behind PostgREST needs an RPC for what a loop does in one pass.
 *
 * "Active" is a learner who completed at least one lesson that week. It is the
 * only honest activity signal the schema has: there is no session table, no page
 * views, and `lessons.minutes` is an editorial estimate, so any "time on site"
 * figure would be a number with nothing behind it.
 */
export async function getWeeks(count = 12): Promise<Week[]> {
  const supabase = await createClient();

  const [{ data: profiles }, { data: enrolments }, { data: progress }] = await Promise.all([
    supabase.from("profiles").select("created_at"),
    supabase.from("enrollments").select("enrolled_at"),
    supabase.from("lesson_progress").select("user_id, completed_at"),
  ]);

  /* Monday-start weeks, most recent last, so the row reads left to right the way
     a person reads a date. */
  const now = new Date();
  const day = (now.getUTCDay() + 6) % 7;
  const thisMonday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day);
  const WEEK = 7 * 24 * 60 * 60 * 1000;

  const weeks: Week[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const start = new Date(thisMonday - i * WEEK);
    weeks.push({
      start: start.toISOString(),
      label: `${start.getUTCDate()} ${start.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })}`,
      signups: 0,
      enrolments: 0,
      active: 0,
    });
  }

  const bucket = (iso: string | null) => {
    if (!iso) return -1;
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return -1;
    const i = Math.floor((thisMonday - t) / WEEK);
    return i >= 0 && i < count ? count - 1 - i : t > thisMonday ? count - 1 : -1;
  };

  for (const row of profiles ?? []) {
    const i = bucket(row.created_at);
    if (i >= 0) weeks[i].signups += 1;
  }
  for (const row of enrolments ?? []) {
    const i = bucket(row.enrolled_at);
    if (i >= 0) weeks[i].enrolments += 1;
  }

  /* One per learner per week, not one per lesson: the question is how many
     people showed up, and somebody ticking nine lessons on a Tuesday is one. */
  const seen = new Set<string>();
  for (const row of (progress ?? []) as { user_id: string; completed_at: string }[]) {
    const i = bucket(row.completed_at);
    if (i < 0) continue;
    const k = `${i}/${row.user_id}`;
    if (seen.has(k)) continue;
    seen.add(k);
    weeks[i].active += 1;
  }

  return weeks;
}
