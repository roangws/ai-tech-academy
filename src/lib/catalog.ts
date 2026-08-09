import { cache } from "react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Course, CourseModule, Lesson } from "@/lib/content";

/**
 * The catalogue, read from Postgres.
 *
 * ------------------------------------------------------------- what changed
 *
 * `content.ts` used to export a `courses` array and everything imported it: the
 * homepage, the five marketing pages, the sitemap, the LMS reader, the admin
 * console. It was the source of truth for every word of the catalogue, and the
 * admin console's own docstring defended that as a deliberate split — prose in
 * code, structure in the database.
 *
 * The split is what made the console read-only. Creating a course meant editing
 * a 3,500-line TypeScript file and deploying; renaming a module meant the same.
 * An instructor cannot do either, so "managed by the LMS" was not true of the
 * one thing an LMS is for.
 *
 * So this file replaces that export. `content.ts` keeps the homepage copy, the
 * method, the FAQs, the instructor roster and the legal pages — all genuinely
 * editorial, all still code — and stops owning courses. Its `Course` type stays
 * exactly where it is and is re-exported below, because it is a good description
 * of what a course is and the components are all written against it. What moved
 * is where the VALUES come from, not what shape they have.
 *
 * ------------------------------------------------------------------ caching
 *
 * There is none here, deliberately, and two layers above it.
 *
 * The public pages (`/`, `/courses`, `/courses/[slug]`) are `revalidate = 3600`
 * static renders, so on those this query runs at build and once an hour, not per
 * visitor. Every admin write calls `revalidateCatalog()` below, which busts them
 * immediately — an edit is live on the marketing pages within one navigation
 * rather than within an hour.
 *
 * Within a single request `cache()` from React dedupes it, which matters because
 * a lesson page asks for the catalogue from `generateMetadata` and again from
 * the page body.
 *
 * `use cache` + `cacheTag` would be the better tool and is not available: it
 * needs `cacheComponents: true`, which changes the rendering model for all 21
 * routes at once. That is its own change, and this one is already large.
 *
 * -------------------------------------------------------------- draft courses
 *
 * `getCatalog()` returns published courses only. Nothing public, and nothing in
 * `/learn`, can reach a draft — which is what makes it safe to build a course on
 * the live site in front of real visitors. The admin console reads through
 * `getAdminCatalog()` instead, which returns drafts too.
 */

export type { Course, CourseModule, Lesson } from "@/lib/content";

/** A course as the console sees it: drafts included, and the state is visible. */
export type AdminCourse = Course & { status: "draft" | "published"; featured: boolean };

type CourseRow = {
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
  status: "draft" | "published";
  featured: boolean;
  cover_src: string | null;
  cover_alt: string | null;
  cover_width: number | null;
  cover_height: number | null;
  cover_focus: string | null;
  cover_build: string | null;
  audience: string | null;
  build: string | null;
  tagline: string | null;
  seo_title: string | null;
  seo_description: string | null;
  keywords: string[] | null;
  skills: string[] | null;
  what_learn: string[] | null;
  requirements: string[] | null;
  description: string[] | null;
  facts: { label: string; value: string }[] | null;
  stats: { value: string; label: string }[] | null;
  preview: Course["preview"] | null;
  modules: {
    id: string;
    n: string;
    name: string;
    summary: string | null;
    step: number | null;
    artifact: string | null;
    access: "open" | "account";
    position: number;
    lessons: { id: string; slug: string; name: string; kind: Lesson["kind"]; minutes: number | null; position: number }[];
  }[];
};

const SELECT =
  "id, slug, badge, title, level, duration, workload_hours, ground, summary, position, status, featured," +
  " cover_src, cover_alt, cover_width, cover_height, cover_focus, cover_build," +
  " audience, build, tagline, seo_title, seo_description," +
  " keywords, skills, what_learn, requirements, description, facts, stats, preview," +
  " modules(id, n, name, summary, step, artifact, access, position," +
  " lessons(id, slug, name, kind, minutes, position))";

/**
 * One row, in the shape the components already expect.
 *
 * Every `??` here is a real decision rather than defensive noise: these columns
 * are nullable because a course being written has not been filled in yet, and a
 * half-written course has to render rather than crash. The marketing page is the
 * one surface where that matters, and it is why a new course is a draft until
 * somebody publishes it.
 */
function toCourse(row: CourseRow): AdminCourse {
  const modules = [...(row.modules ?? [])].sort((a, b) => a.position - b.position);

  return {
    id: row.id,
    slug: row.slug,
    badge: row.badge,
    title: row.title,
    status: row.status,
    featured: row.featured,
    coverBuild: row.cover_build ?? "",
    ground: row.ground ?? "var(--path-a)",
    cover: row.cover_src
      ? {
          src: row.cover_src,
          alt: row.cover_alt ?? "",
          width: row.cover_width ?? undefined,
          height: row.cover_height ?? undefined,
          focus: row.cover_focus ?? undefined,
        }
      : undefined,
    level: row.level ?? "",
    duration: row.duration ?? "",
    workloadHours: row.workload_hours ?? 0,
    facts: row.facts ?? [],
    summary: row.summary ?? "",
    audience: row.audience ?? "",
    build: row.build ?? "",
    skills: row.skills ?? [],
    tagline: row.tagline ?? "",
    stats: row.stats ?? [],
    whatLearn: row.what_learn ?? [],
    requirements: row.requirements ?? [],
    description: row.description ?? [],
    preview: row.preview ?? undefined,
    seoTitle: row.seo_title ?? row.title,
    seoDescription: row.seo_description ?? row.summary ?? "",
    keywords: row.keywords ?? [],
    curriculum: modules.map(
      (m): CourseModule => ({
        n: m.n,
        name: m.name,
        summary: m.summary ?? "",
        step: (m.step ?? 1) as CourseModule["step"],
        artifact: m.artifact ?? "",
        access: m.access,
        lessons: [...(m.lessons ?? [])]
          .sort((a, b) => a.position - b.position)
          .map(
            (l): Lesson => ({
              slug: l.slug,
              name: l.name,
              kind: l.kind,
              minutes: l.minutes ?? undefined,
            }),
          ),
      }),
    ),
  } satisfies AdminCourse;
}

/**
 * A client with no session, for reads that happen outside a request.
 *
 * `generateStaticParams` and `sitemap()` run at build time, where there is no
 * HTTP request and `cookies()` throws — Next names this specifically:
 * "used `cookies()` inside `generateStaticParams`". The request-scoped client in
 * `supabase/server.ts` cannot be used there.
 *
 * Reading the catalogue does not need a session. `catalog_courses_read` is
 * `using (true)` for `anon`, so the publishable key sees exactly the same rows a
 * signed-out visitor would — which is the right answer for a list of public
 * URLs. Drafts are excluded by the caller, not by the policy, so
 * `getAdminCatalog` must never route through this.
 */
async function requestOrAnonClient() {
  try {
    return await createClient();
  } catch {
    /* No request context. The only thing `createClient` does that can throw here
       is `await cookies()`, and the fallback reads the same public rows. */
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
}

async function read(includeDrafts: boolean): Promise<AdminCourse[]> {
  /*
    Drafts are only ever readable by an admin, and only a request has one — so
    the draft path always takes the request-scoped client and lets RLS decide.
    The published path falls back to the anonymous client when there is no
    request, which is what makes this callable from `generateStaticParams`.
  */
  const supabase = includeDrafts ? await createClient() : await requestOrAnonClient();
  let query = supabase.from("courses").select(SELECT).order("position");
  if (!includeDrafts) query = query.eq("status", "published");

  const { data, error } = await query;
  /* Throwing rather than returning [] is the same rule the LMS reader states at
     length: a failed read that becomes an empty catalogue renders "no courses"
     as fact on the homepage. A visible failure is the correct outcome. */
  if (error) throw new Error(`catalog: ${error.message}`);
  return (data as unknown as CourseRow[]).map(toCourse);
}

/** Every published course, in display order. The public catalogue. */
export const getCatalog = cache((): Promise<AdminCourse[]> => read(false));

/** Every course including drafts. Admin surfaces only — this is not a public list. */
export const getAdminCatalog = cache((): Promise<AdminCourse[]> => read(true));

/** One published course by its public slug, or null. */
export async function getCourseBySlug(slug: string): Promise<AdminCourse | null> {
  return (await getCatalog()).find((c) => c.slug === slug) ?? null;
}

/** One published course by id, or null. */
export async function getCourseById(id: string): Promise<AdminCourse | null> {
  return (await getCatalog()).find((c) => c.id === id) ?? null;
}

/** One course by id, drafts included. Admin surfaces only. */
export async function getAdminCourseById(id: string): Promise<AdminCourse | null> {
  return (await getAdminCatalog()).find((c) => c.id === id) ?? null;
}

/** The courses the homepage leads with, in display order. */
export async function getFeatured(): Promise<AdminCourse[]> {
  return (await getCatalog()).filter((c) => c.featured);
}

/* ------------------------------------------------------------------ helpers

   Re-exported, not defined here. They are pure functions of the `Course` type
   and three client components call them; defining them in this module — which
   imports the request-scoped Supabase client, which imports `next/headers` —
   put `next/headers` in the browser graph and 500'd every course page. They live
   in content.ts beside the type, and server code still gets them from here. */

export { moduleCount, lessonCount, totalLessons } from "@/lib/content";

/** `/courses/<slug>` for a course id. Async now that slugs live in Postgres. */
export async function courseHref(id: string, hash?: string): Promise<string> {
  const course = await getCourseById(id);
  if (!course) throw new Error(`courseHref: no published course with id "${id}"`);
  return `/courses/${course.slug}${hash ? `#${hash}` : ""}`;
}
