/**
 * The database, as TypeScript.
 *
 * ------------------------------------------------------------ how to update
 *
 * These types mirror the schema in docs/LMS-ARCHITECTURE.md and are checked
 * against the live database by `npm run db:types`, which regenerates the
 * canonical version from Postgres itself and diffs it against this file. Run it
 * after any migration. Hand-editing the schema and this file separately is how
 * a `string` quietly becomes a `string | null` in production and nowhere else.
 *
 * The shapes here are narrower than a full generated `Database` type on purpose:
 * they are the Row/Insert pairs the app actually selects and writes, named after
 * the domain rather than reached through `Tables<"artifacts">`. `Artifact` reads
 * better than the generic at every call site, and the enums below are the same
 * literal unions Postgres has, so a typo in a status is a compile error.
 */

/* --------------------------------------------------------------------- enums
   Every one of these is a Postgres enum, and the union order matches the type's
   declaration order. `module_access` is the important one: it is the entire
   free-first-module gate, and its two values are the two values
   CourseModule.access has had in content.ts since before there was a database. */

export type AppRole = "student" | "instructor" | "judge" | "admin";
export type ModuleAccess = "open" | "account";
export type LessonKind = "lesson" | "lab" | "template";
export type EnrollmentStatus = "active" | "completed" | "withdrawn";
export type ArtifactStatus = "draft" | "submitted" | "reviewed";
export type SheetStatus = "draft" | "submitted" | "verified";
export type ReviewVerdict = "pass" | "concerns" | "fail";
export type AssignmentKind = "lead" | "specialist";
export type LessonBlockKind =
  | "prose"
  | "video"
  | "audio"
  | "doc"
  | "quiz"
  | "embed"
  | "exercise"
  | "checklist";

/* ------------------------------------------------------------------- catalog
   Seeded from content.ts by scripts/seed-catalog.mjs. Read-only to everyone but
   an admin, and read by the LMS routes only — the marketing pages keep reading
   content.ts directly, because they are statically generated and their prose is
   not something a query should be able to change. */

export type CourseRow = {
  id: string;
  slug: string;
  badge: string;
  title: string;
  level: string | null;
  duration: string | null;
  workload_hours: number | null;
  ground: string | null;
  summary: string | null;
  position: number;
};

export type ModuleRow = {
  id: string;
  course_id: string;
  n: string;
  name: string;
  summary: string | null;
  step: number | null;
  artifact: string | null;
  access: ModuleAccess;
  position: number;
};

export type LessonRow = {
  id: string;
  module_id: string;
  /**
   * Stable identity within the module, and the URL segment.
   *
   * The upsert key the seed script writes on, and therefore the thing that
   * decides which uuid a lesson keeps across a re-seed. It used to be
   * `position`, which meant inserting a lesson mid-module handed every uuid
   * below it to a different lesson and silently reassigned every completion in
   * `lesson_progress`. Authored in content.ts; see the note on `Lesson.slug`.
   */
  slug: string;
  name: string;
  kind: LessonKind;
  minutes: number | null;
  /** The lesson itself. Seeded by scripts/seed-catalog.mjs. */
  body: string | null;
  /** Presentation order only. Identity is `slug`. */
  position: number;
};

/* -------------------------------------------------------------- lesson blocks
   What a lesson is made of, in the order an author chose.

   A discriminated union rather than one optional-everything payload type, so
   reading `block.payload.youtube_id` only compiles after `block.kind` has been
   narrowed to "video". Postgres enforces the same shapes with a CHECK keyed on
   `kind` (see the lesson_blocks migration), which is what stops a malformed
   block reaching this type in the first place. */

/** Where a media file lives in Storage. A path, never a URL — see lib/lms/media. */
type StoragePath = string;

export type BlockPayload = {
  prose: { md: string };
  video: {
    youtube_id: string;
    /** Poster served from our own bucket, so no request reaches Google before play. */
    poster?: StoragePath;
    duration?: number;
  };
  audio: {
    path: StoragePath;
    duration?: number;
    /** Seek points, offered as buttons under the transport. */
    chapters?: readonly { t: number; title: string }[];
    transcript?: StoragePath;
  };
  doc: { path: StoragePath; title?: string; bytes?: number };
  quiz: {
    questions: readonly {
      id: string;
      q: string;
      choices: readonly string[];
      /**
       * Readable by anyone who opens the network tab, and that is accepted: this
       * is a self-check that grades nothing and gates nothing. The day a quiz
       * gates completion it needs its own table with this column revoked and
       * grading behind a SECURITY DEFINER function.
       */
      answer: string;
      why?: string;
    }[];
  };
  embed: { src: string; height?: number };
  exercise: { prompt: string; placeholder?: string };
  checklist: {
    steps: readonly { id: string; text: string }[];
    template?: StoragePath;
  };
};

export type LessonBlock = {
  [K in LessonBlockKind]: {
    id: string;
    lesson_id: string;
    /** Identity within the lesson. Never the slot — see LessonRow.slug. */
    key: string;
    /** Presentation order only. */
    position: number;
    kind: K;
    title: string | null;
    payload: BlockPayload[K];
    created_at: string;
    updated_at: string;
  };
}[LessonBlockKind];

/** A learner's answers to an `exercise` or `checklist` block. */
export type BlockResponse = {
  user_id: string;
  block_id: string;
  body: Record<string, unknown>;
  status: ArtifactStatus;
  updated_at: string;
};

/* ------------------------------------------------------------------ identity */

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  company: string | null;
  role_title: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
};

export type UserRoleRow = {
  user_id: string;
  role: AppRole;
  granted_at: string;
};

/* ------------------------------------------------------------- learner state */

export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  completed_at: string | null;
  last_module_id: string | null;
  /** The exact lesson to resume. See the enrollment_resume_pointer migration. */
  last_lesson_id: string | null;
  /** When they last did anything in this course. Orders the dashboard. */
  last_seen_at: string | null;
};

export type LessonProgress = {
  user_id: string;
  lesson_id: string;
  completed_at: string;
};

export type Artifact = {
  id: string;
  user_id: string;
  module_id: string;
  title: string | null;
  body: string;
  status: ArtifactStatus;
  submitted_at: string | null;
  instructor_feedback: string | null;
  feedback_by: string | null;
  feedback_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OutcomeSheet = {
  id: string;
  user_id: string;
  course_id: string;
  title: string;
  status: SheetStatus;
  measured_after_days: number | null;
  footnote: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

/* before_value / after_value are what the learner typed ("6 h 00"); before_n /
   after_n are the same figures as numbers. Both are kept because the existing
   outcome-sheet figure renders the text as written and sizes its bars from the
   number, and deriving one from the other would lose the unit or the ordering. */
export type OutcomeRow = {
  id: string;
  sheet_id: string;
  measure: string;
  before_value: string | null;
  after_value: string | null;
  before_n: number | null;
  after_n: number | null;
  position: number;
};

export type CompletionRecord = {
  id: string;
  user_id: string;
  course_id: string;
  reference: string;
  issued_at: string;
};

/* --------------------------------------------------- instruction and judging */

export type InstructorAssignment = {
  id: string;
  user_id: string;
  course_id: string;
  kind: AssignmentKind;
  scope: string | null;
};

/* `user_id` is nullable because a seat exists before anyone fills it — which is
   the state of all six today, since Seat.name in content.ts "is absent until the
   person AND their employer clear it".

   `reviews_course_id` is nullable for a different reason: the learning-design
   seat reads assessment across all five courses rather than one, and
   holds_seat() reads that null as "every course". */
export type JudgeSeat = {
  id: string;
  seat: string;
  reviews_course_id: string | null;
  reviews_label: string | null;
  checks: string;
  ground: string | null;
  position: number;
  /**
   * The learning-design seat reads assessment across all five courses.
   *
   * This started as an inference from `reviews_course_id IS NULL`, and that was
   * wrong in a way that only showed up on a delete: the foreign key was ON
   * DELETE SET NULL, so removing a course silently promoted every judge seated
   * on it from one course to all five. An absence is not a grant, so the grant
   * is now a column.
   */
  reads_all_courses: boolean;
  /**
   * Not selectable. SELECT on this column is revoked from anon and authenticated
   * — the seat is public on /review-judge-board, the person holding it is not —
   * so it is absent from every query in queries.ts and present here only because
   * policies and filters still reference it.
   */
  user_id?: string | null;
};

export type RubricCriterion = {
  id: string;
  course_id: string;
  label: string;
  description: string | null;
  weight: number;
  position: number;
};

export type Judgement = {
  id: string;
  sheet_id: string;
  judge_id: string;
  criterion_id: string;
  score: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CurriculumReview = {
  id: string;
  seat_id: string;
  judge_id: string;
  course_id: string;
  term: string;
  verdict: ReviewVerdict;
  notes: string;
  created_at: string;
  updated_at: string;
};
