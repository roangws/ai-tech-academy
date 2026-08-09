import { createClient } from "@/lib/supabase/server";
import { courses as catalog, totalLessons, type Course } from "@/lib/content";
import type {
  Artifact,
  CurriculumReview,
  Enrollment,
  JudgeSeat,
  Judgement,
  LessonBlock,
  LessonRow,
  ModuleRow,
  OutcomeRow,
  OutcomeSheet,
  Profile,
  RubricCriterion,
} from "@/lib/supabase/types";

/**
 * Every read the LMS does.
 *
 * ------------------------------------------------------ two sources, one join
 *
 * The catalog exists twice and that is the design, not an accident. content.ts
 * holds the prose — titles, summaries, the curriculum a reader browses before
 * signing up — and is what the statically generated marketing pages render.
 * Postgres holds the structure — ids, module numbers, lesson slots, the access
 * column — and is what progress, artifacts and judgements point at.
 *
 * These functions are where the two meet. They read structure and state from the
 * database and copy from content.ts, joined on `course.id` and `module.n`, which
 * are the two keys the seed script guarantees are the same on both sides.
 *
 * The alternative was storing prose in Postgres and rendering course pages from
 * queries, which would trade five prerendered pages for five uncached ones and
 * put a typo fix behind a migration.
 *
 * -------------------------------------------------------------- no RLS bypass
 *
 * Every function here goes through the request-scoped client, so every query
 * runs as the reader. There is no service-role client in this file and none in
 * `src/` at all: if a query returns a row, the policies allowed it. That is why
 * `getSubmittedWork` below does not filter by instructor — it does not have to,
 * because the policy already does, and a WHERE clause that duplicates a policy
 * is a WHERE clause that can disagree with it.
 *
 * ------------------------------------------------------------ errors throw
 *
 * Originally every response here was destructured as `{ data }` and the `error`
 * was dropped. That is worse than it sounds, because PostgREST does not throw:
 * a failed read came back as `data: null`, which each function turned into an
 * empty list or a `null` return, which the pages then rendered as fact. A
 * transient failure on the course board showed "course not found" for a course
 * that exists; on the dashboard it showed a learner's ticked lessons as
 * unticked and every counter at zero. Silent wrong data, no log line.
 *
 * `rows()` and `one()` throw instead, which routes to the route's error
 * boundary. A visible failure is the correct outcome — the reader can retry,
 * and nobody is told their progress is gone when it is not.
 */

/*
  The result type is deliberately loose, and the shape is asserted by the caller
  through the type argument.

  The client is created without the generated `Database` generic, so PostgREST
  infers row shapes from the select string alone — and it gets embeds wrong in
  one specific way that matters here: it types a to-one embed (`lessons!inner(…)`)
  as an ARRAY, when the runtime returns an object. Verified against the live API
  rather than assumed. Threading the builder's inferred type through these
  helpers would therefore mean writing the wrong shape down and casting it back
  at every call site, which is more assertions in more places, not fewer.
*/
type Result = { data: unknown; error: { message: string } | null };

async function rows<T>(label: string, query: PromiseLike<Result>): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  return (data ?? []) as T[];
}

async function one<T>(label: string, query: PromiseLike<Result>): Promise<T | null> {
  const { data, error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  return (data ?? null) as T | null;
}

/** Console pages page their lists rather than rendering the whole table. */
export const PAGE_SIZE = 50;

export const byId = new Map(catalog.map((c) => [c.id, c]));
export const bySlug = new Map(catalog.map((c) => [c.slug, c]));

export type ModuleWithProgress = ModuleRow & {
  lessons: LessonRow[];
  /** Lessons this reader has completed. Always 0 when signed out. */
  done: number;
  artifact_status: Artifact["status"] | null;
};

export type CourseBoard = {
  course: Course;
  courseId: string;
  modules: ModuleWithProgress[];
  totalLessons: number;
  doneLessons: number;
  enrollment: Enrollment | null;
};

/**
 * The course contents, with this reader's progress folded in.
 *
 * One query for the modules with their lessons nested, one for the reader's
 * completions, one for their artifacts. Three round trips rather than the
 * obvious N+1 of a query per module.
 *
 * `userId` is null for a signed-out reader, and every per-reader query is then
 * skipped rather than run and discarded — a signed-out reader has no rows to
 * find, and asking anyway costs two round trips to learn it.
 */
export async function getCourseBoard(slug: string, userId: string | null): Promise<CourseBoard | null> {
  const course = bySlug.get(slug);
  if (!course) return null;

  const supabase = await createClient();

  const modules = await rows<ModuleRow & { lessons: LessonRow[] }>(
    "course modules",
    supabase
      .from("modules")
      .select("*, lessons(*)")
      .eq("course_id", course.id)
      .order("position")
      .order("position", { referencedTable: "lessons" }),
  );

  /* An empty list is a real answer — an un-seeded course — and it is not the
     same as "no such course". The caller 404s on null; this returns a board
     with no modules so the page can say so instead of crashing on
     `modules[0].n`, which is what it used to do for a signed-in reader. */
  if (!modules.length) return null;

  let doneIds = new Set<string>();
  let artifacts = new Map<string, Artifact["status"]>();
  let enrollment: Enrollment | null = null;

  if (userId) {
    const moduleIds = modules.map((m) => m.id);
    const [progress, arts, enr] = await Promise.all([
      rows<{ lesson_id: string }>(
        "board progress",
        supabase
          .from("lesson_progress")
          .select("lesson_id, lessons!inner(module_id)")
          .eq("user_id", userId)
          .in("lessons.module_id", moduleIds),
      ),
      rows<{ module_id: string; status: Artifact["status"] }>(
        "board artifacts",
        supabase.from("artifacts").select("module_id, status").eq("user_id", userId).in("module_id", moduleIds),
      ),
      one<Enrollment>(
        "board enrolment",
        supabase.from("enrollments").select("*").eq("user_id", userId).eq("course_id", course.id).maybeSingle(),
      ),
    ]);

    doneIds = new Set(progress.map((p) => p.lesson_id));
    artifacts = new Map(arts.map((a) => [a.module_id, a.status]));
    enrollment = enr;
  }

  const withProgress: ModuleWithProgress[] = modules.map((m) => {
    const lessons = m.lessons ?? [];
    return {
      ...m,
      lessons,
      done: lessons.filter((l) => doneIds.has(l.id)).length,
      artifact_status: artifacts.get(m.id) ?? null,
    };
  });

  return {
    course,
    courseId: course.id,
    modules: withProgress,
    totalLessons: withProgress.reduce((n, m) => n + m.lessons.length, 0),
    doneLessons: withProgress.reduce((n, m) => n + m.done, 0),
    enrollment,
  };
}

/** A lesson in a list, carrying just enough about its blocks to pick an icon. */
export type LessonWithKinds = LessonRow & { lesson_blocks?: { kind: string }[] };

export type ModuleView = {
  course: Course;
  module: ModuleRow;
  lessons: LessonWithKinds[];
  done: Set<string>;
  artifact: Artifact | null;
  prev: ModuleRow | null;
  next: ModuleRow | null;
};

/**
 * One module, for the player.
 *
 * `prev` and `next` come from the same fetch as the module rather than from two
 * more queries: forty rows is nothing, and having the whole ordered list in hand
 * is what makes the neighbours a array lookup.
 */
export async function getModuleView(
  slug: string,
  n: string,
  userId: string | null,
): Promise<ModuleView | null> {
  const course = bySlug.get(slug);
  if (!course) return null;

  const supabase = await createClient();

  /* Modules and their lessons in one select rather than two sequential round
     trips. `prev`/`next` need the whole ordered list anyway, and the lessons
     ride along on the module they belong to. */
  /* `lesson_blocks(kind)` rides along so the list can draw an icon that
     describes what is actually in each lesson. It used to derive the icon from
     `lessons.kind`, where "lesson" mapped to a play circle — 81 play buttons
     over pages of text, on a product with no player. Only the kind column is
     selected; the payloads are not needed here and are the expensive part. */
  const modules = await rows<ModuleRow & { lessons: (LessonRow & { lesson_blocks: { kind: string }[] })[] }>(
    "module view",
    supabase
      .from("modules")
      .select("*, lessons(*, lesson_blocks(kind))")
      .eq("course_id", course.id)
      .order("position")
      .order("position", { referencedTable: "lessons" }),
  );

  if (!modules.length) return null;

  const index = modules.findIndex((m) => m.n === n);
  if (index === -1) return null;
  const current = modules[index];
  const lessons = current.lessons ?? [];

  let done = new Set<string>();
  let artifact: Artifact | null = null;

  if (userId) {
    const [progress, art] = await Promise.all([
      rows<{ lesson_id: string }>(
        "module progress",
        supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", userId)
          .in("lesson_id", lessons.map((l) => l.id)),
      ),
      one<Artifact>(
        "module artifact",
        supabase
          .from("artifacts")
          .select("*")
          .eq("user_id", userId)
          .eq("module_id", current.id)
          .maybeSingle(),
      ),
    ]);
    done = new Set(progress.map((p) => p.lesson_id));
    artifact = art;
  }

  return {
    course,
    module: current,
    lessons,
    done,
    artifact,
    prev: modules[index - 1] ?? null,
    next: modules[index + 1] ?? null,
  };
}

export type ArtifactWithModule = Artifact & {
  modules: { n: string; name: string; course_id: string };
};

export type ScoredCriterion = Judgement & {
  rubric_criteria: { label: string; description: string | null; weight: number };
};

export type DashboardCourse = {
  course: Course;
  enrollment: Enrollment;
  done: number;
  total: number;
  sheet: OutcomeSheet | null;
  /** Artifacts an instructor has written back on. */
  feedback: ArtifactWithModule[];
  /** Started and never sent. */
  drafts: ArtifactWithModule[];
  /** Judge scores on this course's outcome sheet, if any have been filed. */
  judgements: ScoredCriterion[];
  /**
   * The lesson to open when they press Continue, already resolved to a URL.
   *
   * Null when nothing has been opened yet, and the caller falls back to the
   * course board. Resolved here rather than in the page so "Continue" can be
   * labelled with the lesson's name — "Continue · Find the high-value use cases"
   * tells a returning learner what they were doing; "Continue" does not.
   */
  resume: { href: string; lessonName: string; moduleName: string } | null;
};

/** The signed-in home: what they are enrolled in and how far through it they are. */
export async function getDashboard(userId: string): Promise<DashboardCourse[]> {
  const supabase = await createClient();

  /*
    Three queries, not four.

    The fourth used to be `from("modules").select("course_id, lessons(id)")`
    with no filter at all — the entire catalog, 40 modules and 173 lesson ids,
    fetched on every dashboard render to compute a total that content.ts already
    knows statically and that cannot change without a deploy. `totalLessons(c)`
    is right there in the module this file already imports.
  */
  const [enrollments, progress, sheets, artifacts, judgements] = await Promise.all([
    rows<Enrollment>(
      "enrolments",
      /* Most recently touched first. It ordered by `enrolled_at`, which answers
         "which course did you sign up for first" — and the question a returning
         learner is asking is "what was I doing". NULLS LAST so a course enrolled
         in but never opened sits below one with real activity. */
      supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", userId)
        .order("last_seen_at", { ascending: false, nullsFirst: false })
        .order("enrolled_at", { ascending: false }),
    ),
    /* The nested selects walk lesson → module → course, so completions can be
       bucketed by course without a query per enrolment. A to-one embed comes
       back as an object, not an array — verified against PostgREST rather than
       assumed, because the difference is a silently-zero counter. */
    rows<{ lessons: { modules: { course_id: string } } }>(
      "progress",
      supabase
        .from("lesson_progress")
        .select("lesson_id, lessons!inner(modules!inner(course_id))")
        .eq("user_id", userId),
    ),
    rows<OutcomeSheet>("outcome sheets", supabase.from("outcome_sheets").select("*").eq("user_id", userId)),
    /* Artifacts an instructor has written back on, and drafts still sitting
       unsent. Both are things the dashboard should be telling the learner about
       and neither had any surface: feedback arrived silently on a module page
       nobody has a reason to revisit. */
    rows<Artifact & { modules: { n: string; name: string; course_id: string } }>(
      "dashboard artifacts",
      supabase
        .from("artifacts")
        .select("*, modules!inner(n, name, course_id)")
        .eq("user_id", userId),
    ),
    /* The scores. `judgements_read_by_learner` has existed since the schema was
       written and nothing has ever read it — a learner could be scored by three
       judges and never see a number. */
    rows<Judgement & { rubric_criteria: { label: string; description: string | null; weight: number } }>(
      "my judgements",
      supabase
        .from("judgements")
        .select("*, rubric_criteria!inner(label, description, weight)")
        .order("created_at"),
    ),
  ]);

  const doneByCourse = new Map<string, number>();
  for (const row of progress) {
    const courseId = row.lessons?.modules?.course_id;
    if (courseId) doneByCourse.set(courseId, (doneByCourse.get(courseId) ?? 0) + 1);
  }

  const sheetByCourse = new Map(sheets.map((s) => [s.course_id, s]));
  const sheetIds = new Set(sheets.map((s) => s.id));

  /* Resolve every resume pointer in one query rather than one per course. */
  const lastIds = enrollments.map((e) => e.last_lesson_id).filter((id): id is string => Boolean(id));
  const resumeRows = lastIds.length
    ? await rows<{ id: string; slug: string; name: string; modules: { n: string; name: string; course_id: string } }>(
        "resume targets",
        supabase.from("lessons").select("id, slug, name, modules!inner(n, name, course_id)").in("id", lastIds),
      )
    : [];
  const resumeById = new Map(resumeRows.map((r) => [r.id, r]));

  return enrollments
    .map((e) => {
      const course = byId.get(e.course_id);
      if (!course) return null;
      const mine = artifacts.filter((a) => a.modules?.course_id === e.course_id);
      const last = e.last_lesson_id ? resumeById.get(e.last_lesson_id) : undefined;
      return {
        course,
        enrollment: e,
        done: doneByCourse.get(e.course_id) ?? 0,
        total: totalLessons(course),
        sheet: sheetByCourse.get(e.course_id) ?? null,
        /* Reviewed and unread by the learner is the thing worth surfacing; a
           draft with something in it is the thing worth nudging. */
        feedback: mine.filter((a) => a.status === "reviewed" && a.instructor_feedback),
        drafts: mine.filter((a) => a.status === "draft" && a.body.trim().length > 0),
        judgements: judgements.filter((j) => sheetIds.has(j.sheet_id)
          && sheetByCourse.get(e.course_id)?.id === j.sheet_id),
        resume: last
          ? {
              href: `/learn/${course.slug}/${last.modules.n}/${last.slug}`,
              lessonName: last.name,
              moduleName: last.modules.name,
            }
          : null,
      };
    })
    .filter((x): x is DashboardCourse => x !== null);
}

export type LessonView = {
  course: Course;
  module: ModuleRow;
  lesson: LessonRow;
  index: number;
  total: number;
  done: boolean;
  prev: LessonRow | null;
  next: LessonRow | null;
  /** The first lesson of the following module, for the end of a module. */
  nextModule: ModuleRow | null;
  /**
   * What the lesson is made of, in author order.
   *
   * Empty means the lesson has not been authored yet — the seed script writes a
   * prose scaffold into `lessons.body` and no blocks. The page uses that to say
   * so at the top, rather than the scaffold signing itself at the bottom after
   * the reader has already spent the time.
   */
  blocks: LessonBlock[];
  /** Every lesson in this module, in order — the syllabus rail. */
  siblings: LessonWithKinds[];
  /** Which of those this reader has finished. Empty when signed out. */
  doneIds: Set<string>;
};

/**
 * One lesson, by its slug within a module.
 *
 * ------------------------------------------------- this used to key on position
 *
 * The address was `/learn/<course>/04/02` and the note here argued it was
 * "readable and stable". Half right. It is readable, and it is the opposite of
 * stable: `02` names whatever is currently second, so inserting a lesson higher
 * up silently repoints the URL at a different lesson, and every link anyone
 * saved now goes somewhere else. The slug names the lesson itself, which is what
 * the reader meant.
 *
 * `position` survives as presentation — the order lessons are listed in, and
 * nothing more.
 */
export async function getLessonView(
  slug: string,
  n: string,
  lessonSlug: string,
  userId: string | null,
): Promise<LessonView | null> {
  const course = bySlug.get(slug);
  if (!course) return null;

  const supabase = await createClient();

  const modules = await rows<ModuleRow>(
    "lesson modules",
    supabase.from("modules").select("*").eq("course_id", course.id).order("position"),
  );
  const mi = modules.findIndex((m) => m.n === n);
  if (mi === -1) return null;
  const current = modules[mi];

  /* `lesson_blocks(kind)` rides along for the rail's per-lesson icon. Only the
     kind column: the payloads belong to the lesson being read, not to the eleven
     rows listed beside it. */
  const lessons = await rows<LessonWithKinds>(
    "lesson list",
    supabase
      .from("lessons")
      .select("*, lesson_blocks(kind)")
      .eq("module_id", current.id)
      .order("position"),
  );
  /* Neighbours come from the index in this ordered list, not from arithmetic on
     `position`. The two used to be mixed — the lesson was found by matching
     `position` and prev/next were `lessons[pos ± 1]` — which agree only while
     positions are gapless and zero-based. A single gap made "next" skip a lesson
     or point at itself. */
  const li = lessons.findIndex((l) => l.slug === lessonSlug);
  if (li === -1) return null;
  const lesson = lessons[li];

  /* The blocks are gated in Postgres by `catalog_blocks_read`, not here: a
     locked module's blocks are simply not returned to a signed-out reader, so
     this needs no branch and cannot be talked out of one by a forged parameter.
     The rendering gate above is still the thing that stops the page being drawn;
     this is the layer that stops the content existing to be drawn. */
  const blocks = await rows<LessonBlock>(
    "lesson blocks",
    supabase.from("lesson_blocks").select("*").eq("lesson_id", lesson.id).order("position"),
  );

  /* Completion for the WHOLE module, not just this lesson — the rail draws a
     tick per row and a meter over all of them, and one `.in()` costs the same
     round trip the single-lesson lookup already cost. */
  let doneIds = new Set<string>();
  if (userId) {
    const progress = await rows<{ lesson_id: string }>(
      "lesson done",
      supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .in("lesson_id", lessons.map((l) => l.id)),
    );
    doneIds = new Set(progress.map((p) => p.lesson_id));
  }

  return {
    course,
    module: current,
    lesson,
    index: li,
    total: lessons.length,
    done: doneIds.has(lesson.id),
    prev: lessons[li - 1] ?? null,
    next: lessons[li + 1] ?? null,
    nextModule: modules[mi + 1] ?? null,
    blocks,
    siblings: lessons,
    doneIds,
  };
}

/* ---------------------------------------------------------- outcome sheets */

export async function getOutcomeSheet(
  userId: string,
  courseId: string,
): Promise<{ sheet: OutcomeSheet; rows: OutcomeRow[] } | null> {
  const supabase = await createClient();
  const sheet = await one<OutcomeSheet & { outcome_rows: OutcomeRow[] }>(
    "outcome sheet",
    supabase
      .from("outcome_sheets")
      .select("*, outcome_rows(*)")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .order("position", { referencedTable: "outcome_rows" })
      .maybeSingle(),
  );

  if (!sheet) return null;
  const { outcome_rows, ...rest } = sheet;
  return { sheet: rest as OutcomeSheet, rows: outcome_rows ?? [] };
}

/* ------------------------------------------------------------- instructors */

export async function getTaughtCourses(userId: string): Promise<Course[]> {
  const supabase = await createClient();
  const assignments = await rows<{ course_id: string }>(
    "assignments",
    supabase.from("instructor_assignments").select("course_id").eq("user_id", userId),
  );

  const ids = new Set(assignments.map((a) => a.course_id));
  /* Ordered by the catalog rather than by whatever the database returns. The
     query had no ORDER BY at all, so the instructor console's course list
     reordered itself between renders. */
  return catalog.filter((c) => ids.has(c.id));
}

export type SubmittedWork = Artifact & {
  learner: Pick<Profile, "id" | "first_name" | "last_name" | "email"> | null;
  moduleName: string;
  moduleNumber: string;
  courseId: string;
};

/**
 * Artifacts an instructor may act on.
 *
 * No instructor filter in the query. The `artifacts_read_as_instructor` policy
 * already restricts this to non-draft rows on courses the caller is assigned to,
 * and repeating that here would be a second rule that can disagree with the
 * first. The one thing the query does add is ordering.
 */
export async function getSubmittedWork(courseIds: string[]): Promise<SubmittedWork[]> {
  if (!courseIds.length) return [];
  const supabase = await createClient();

  /*
    Bounded, and ordered deterministically.

    It was unbounded, `select("*")`, sorted on `submitted_at` alone. At 10,000
    learners × 8 modules that is 80,000 rows and every submission's full body
    pulled into one render. The id tiebreaker matters as soon as there is a
    second page: two rows sharing a timestamp would otherwise swap between
    pages, showing one twice and the other never.
  */
  const work = await rows<Artifact & { modules: { n: string; name: string; course_id: string } }>(
    "submitted work",
    supabase
      .from("artifacts")
      .select("*, modules!inner(n, name, course_id)")
      .in("modules.course_id", courseIds)
      .neq("status", "draft")
      .order("submitted_at", { ascending: false })
      .order("id")
      .limit(PAGE_SIZE),
  );

  const learnerIds = [...new Set(work.map((r) => r.user_id))];

  /* Profiles are a separate query because there is no foreign key from artifacts
     to profiles for PostgREST to embed through — both point at auth.users, which
     is not in the exposed schema.

     The `in` list is bounded by PAGE_SIZE above, which also fixes the other half
     of the old bug: an unbounded id list built a URL that the edge proxy
     rejected with a 400 past roughly 600 uuids, and the discarded error meant
     every row silently rendered with no learner attached. */
  const profiles = learnerIds.length
    ? await rows<Pick<Profile, "id" | "first_name" | "last_name" | "email">>(
        "learner profiles",
        supabase.from("profiles").select("id, first_name, last_name, email").in("id", learnerIds),
      )
    : [];

  const byLearner = new Map(profiles.map((p) => [p.id, p]));

  return work.map((r) => ({
    ...r,
    learner: byLearner.get(r.user_id) ?? null,
    moduleName: r.modules.name,
    moduleNumber: r.modules.n,
    courseId: r.modules.course_id,
  }));
}

/* ------------------------------------------------------------------ judges */

/**
 * The seat this reader holds, if any.
 *
 * Through an RPC rather than a select, and that is forced rather than stylistic.
 * `SELECT` on `judge_seats.user_id` is revoked from `authenticated` — the seat
 * is public on /review-judge-board, the person holding it is not — and Postgres
 * requires SELECT privilege on a column to FILTER on it as well as to return it.
 * So `.eq("user_id", me)` fails with "permission denied for column user_id",
 * correctly and unhelpfully.
 *
 * `my_seat()` is SECURITY DEFINER, compares against `auth.uid()` internally, and
 * takes no argument — so it can answer "which seat is mine" without granting the
 * ability to ask "whose seat is this".
 *
 * No parameter, for that reason. An earlier signature took the viewer's id and
 * ignored it, which read like the caller was choosing whose seat to fetch.
 */
export async function getMySeat(): Promise<JudgeSeat | null> {
  const supabase = await createClient();
  const seats = await rows<JudgeSeat>("judge seat", supabase.rpc("my_seat"));
  return seats[0] ?? null;
}

export type SheetForReview = OutcomeSheet & {
  rows: OutcomeRow[];
  /** Never a name. See the note below. */
  reference: string;
  /** Whether the judge asking has already filed scores on it. */
  scoredByMe: boolean;
};

/**
 * Submitted outcome sheets a judge may score.
 *
 * `status <> 'draft'` is here as well as in the policy, and this is the one
 * place that duplication is deliberate: the policy is the enforcement, and the
 * filter is what stops a future policy change from silently widening the console.
 *
 * No learner name, no email, and no join that could produce one. The
 * `profiles_read_as_instructor` policy does not extend to judges, so the query
 * would return nothing anyway — but not asking is the point. A judge scores a
 * deployed workflow against a rubric, and knowing whose it is can only bias that.
 * The sheet's id, shortened, is the reference on screen.
 */
/* The columns a judge sees. `user_id` is deliberately not among them — see the
   note above — and neither is anything else that could identify a learner. */
const SHEET_COLUMNS =
  "id, course_id, title, status, measured_after_days, footnote, submitted_at, created_at, updated_at";

export async function getSheetsForReview(
  courseId: string | null,
  scoredBy?: string,
): Promise<SheetForReview[]> {
  const supabase = await createClient();

  let query = supabase
    .from("outcome_sheets")
    .select(`${SHEET_COLUMNS}, outcome_rows(*)`)
    .neq("status", "draft")
    .order("submitted_at", { ascending: false })
    .order("id")
    .order("position", { referencedTable: "outcome_rows" })
    .limit(PAGE_SIZE);

  /* A null courseId is the learning-design seat, which reads across all five. */
  if (courseId) query = query.eq("course_id", courseId);

  const sheets = await rows<Omit<OutcomeSheet, "user_id"> & { outcome_rows: OutcomeRow[] }>(
    "sheets for review",
    query,
  );

  /* Which of these this judge has already scored. Without it the console was
     byte-identical before and after judging — "3 sheets to score" stayed at 3,
     and a judge working through a queue had to reopen each sheet to find out
     whether they had done it. */
  let scored = new Set<string>();
  if (scoredBy && sheets.length) {
    const filed = await rows<{ sheet_id: string }>(
      "my judgements",
      supabase
        .from("judgements")
        .select("sheet_id")
        .eq("judge_id", scoredBy)
        .in("sheet_id", sheets.map((s) => s.id)),
    );
    scored = new Set(filed.map((j) => j.sheet_id));
  }

  return sheets.map((s) => ({
    ...(s as unknown as OutcomeSheet),
    rows: s.outcome_rows ?? [],
    reference: `Sheet ${s.id.slice(0, 8)}`,
    scoredByMe: scored.has(s.id),
  }));
}

/** One sheet, by id. Scope is enforced by `sheets_read_as_judge`, not here. */
export async function getSheetForReview(sheetId: string): Promise<SheetForReview | null> {
  const supabase = await createClient();
  const sheet = await one<Omit<OutcomeSheet, "user_id"> & { outcome_rows: OutcomeRow[] }>(
    "sheet for review",
    supabase
      .from("outcome_sheets")
      .select(`${SHEET_COLUMNS}, outcome_rows(*)`)
      .eq("id", sheetId)
      .neq("status", "draft")
      .order("position", { referencedTable: "outcome_rows" })
      .maybeSingle(),
  );

  if (!sheet) return null;
  return {
    ...(sheet as unknown as OutcomeSheet),
    rows: sheet.outcome_rows ?? [],
    reference: `Sheet ${sheet.id.slice(0, 8)}`,
    scoredByMe: false,
  };
}

export async function getRubric(courseId: string): Promise<RubricCriterion[]> {
  const supabase = await createClient();
  return rows<RubricCriterion>(
    "rubric",
    supabase
      .from("rubric_criteria")
      .select("*")
      .eq("course_id", courseId)
      /* Retired criteria stay in the table so the judgements filed against them
         keep their meaning; they are not offered for new scoring. */
      .is("archived_at", null)
      .order("position"),
  );
}

export async function getCurriculumReviews(seatId: string): Promise<CurriculumReview[]> {
  const supabase = await createClient();
  return rows<CurriculumReview>(
    "curriculum reviews",
    supabase
      .from("curriculum_reviews")
      .select("*")
      .eq("seat_id", seatId)
      .order("term", { ascending: false })
      .limit(PAGE_SIZE),
  );
}
