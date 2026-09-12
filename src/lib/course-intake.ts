import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  courseIntakeHref,
  type IntakeSnapshot,
  type IntakeStatus,
} from "@/lib/intake";

export const getIntakeSnapshot = cache(async (): Promise<IntakeSnapshot> => {
  const db = await createClient();
  const { data: auth } = await db.auth.getClaims();
  const userId = auth?.claims?.sub;
  const { data: courses, error } = await db
    .from("courses")
    .select("id,slug,title")
    .eq("status", "published")
    .order("position");
  if (error) throw new Error("Could not load courses.");
  const result = userId
    ? await db
        .from("course_intakes")
        .select("course_id,status,company,job_title,projects,goals")
        .eq("user_id", userId)
    : { data: [], error: null };
  if (result.error) throw new Error("Could not load your course status.");
  const rows = new Map((result.data ?? []).map((r) => [r.course_id, r]));
  return {
    signedIn: Boolean(userId),
    userId,
    courses: (courses ?? []).map((c) => {
      const row = rows.get(c.id);
      return {
        slug: c.slug,
        title: c.title,
        status: (row?.status as IntakeStatus) ?? null,
        ...(row?.company
          ? {
              application: {
                company: row.company,
                job_title: row.job_title,
                projects: row.projects,
                goals: row.goals,
              },
            }
          : {}),
      };
    }),
  };
});

export async function requireCourseAccess(slug: string, courseId: string) {
  const db = await createClient();
  const { data, error } = await db.rpc("course_has_access", { cid: courseId });
  if (error)
    throw new Error("Could not check course access. Please try again.");
  if (!data) redirect(courseIntakeHref(slug));
}
