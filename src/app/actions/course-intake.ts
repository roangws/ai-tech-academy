"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { OPEN_COURSE_SLUG, type IntakeStatus } from "@/lib/intake";
import { isValidCourseReferral } from "@/lib/referral-validation";

/** Checking a code does not submit an application or create an enrollment. */
export async function validateCourseReferral(code: string): Promise<{ valid: boolean; error?: string }> {
  const db = await createClient();
  const { data } = await db.auth.getClaims();
  if (!data?.claims?.sub) return { valid: false, error: "Please sign in again to validate your code. Your answers are saved." };
  if (!isValidCourseReferral(code)) return { valid: false, error: "That code is not valid. Check it and try again, or clear it to apply without a code." };
  return { valid: true };
}

export type IntakeResult = {
  status?: IntakeStatus | null;
  error?: string;
  signIn?: boolean;
};

export async function approveCourseApplication(form: FormData): Promise<void> {
  const { requireRole } = await import("@/lib/auth");
  await requireRole("admin", "/admin/applications");
  const db = await createClient();
  const { error } = await db.rpc("approve_course_application", {
    applicant: String(form.get("user_id") ?? ""),
    cid: String(form.get("course_id") ?? ""),
  });
  if (error)
    throw new Error(
      "Could not approve this application. Refresh and try again.",
    );
  revalidatePath("/admin/applications");
}

export async function updateCourseIntake(
  slug: string,
  intent: "join" | "leave" | "apply",
  form?: FormData,
): Promise<IntakeResult> {
  const db = await createClient();
  const { data: auth } = await db.auth.getClaims();
  if (!auth?.claims?.sub)
    return {
      error: "Please sign in again to continue. Your answers are still here.",
      signIn: true,
    };
  if (
    typeof slug !== "string" ||
    slug.length > 160 ||
    !["join", "leave", "apply"].includes(intent)
  )
    return { error: "That course action is not available." };
  let result;
  if (intent === "apply") {
    if (slug !== OPEN_COURSE_SLUG || !(form instanceof FormData))
      return { error: "That application is not available." };
    const values: Record<string, string> = {};
    for (const [name, label, max] of [
      ["company", "your company", 160],
      ["job_title", "your job title", 160],
      ["projects", "your current film or video projects", 4000],
      ["goals", "what you hope to create", 4000],
      ["referral_code", "a referral code", 80],
    ] as const) {
      const raw = form.get(name);
      const value = typeof raw === "string" ? raw.trim() : "";
      if (name !== "referral_code" && !value)
        return { error: `Please tell us ${label}.` };
      if (value.length > max)
        return { error: `Please keep ${label} to ${max} characters or fewer.` };
      values[name] = value;
    }
    result = await db.rpc("apply_to_filmmaking", {
      company_value: values.company,
      job_title_value: values.job_title,
      projects_value: values.projects,
      goals_value: values.goals,
      referral_value: values.referral_code,
    });
  } else {
    result = await db.rpc("set_course_waitlist", {
      course_slug: slug,
      joining: intent === "join",
    });
  }
  if (result.error) {
    if (result.error.message.includes("Invalid referral code"))
      return {
        error:
          "That referral code isn't valid. Check it, or leave it blank to submit for review.",
      };
    return {
      error:
        "We couldn't save this. Please try again. Your answers are still here.",
    };
  }
  revalidatePath("/dashboard");
  revalidatePath("/account");
  return { status: (result.data as IntakeStatus | null) ?? null };
}
