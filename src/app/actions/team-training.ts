"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type TrainingState = { error?: string; ok?: boolean };
export async function requestTraining(_state: TrainingState, form: FormData): Promise<TrainingState> {
  const value = (key: string) => String(form.get(key) ?? "").trim();
  if (value("website")) return { ok: true };
  const name = value("name"), email = value("email"), company = value("company"), goals = value("goals");
  const size = Number(value("size"));
  const courses = [...new Set(form.getAll("courses").map(String))];
  if (!name || name.length > 160 || !company || company.length > 160) return { error: "Enter your name and company (up to 160 characters each)." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { error: "Enter a valid email address." };
  if (!Number.isInteger(size) || size < 1 || size > 100000) return { error: "Enter a team size between 1 and 100,000." };
  if (!courses.length || courses.length > 30) return { error: "Select at least one course." };
  if (goals.length > 2000) return { error: "Keep your training goals under 2,000 characters." };
  try {
    const db = await createClient();
    const { error } = await db.rpc("request_team_training", { p_name: name, p_email: email, p_company: company, p_size: size, p_courses: courses, p_goals: goals });
    if (error) return { error: error.message.includes("wait an hour") ? "Please wait an hour before sending another request." : "We couldn’t save your request. Please try again." };
    revalidatePath("/admin/applications");
    return { ok: true };
  } catch { return { error: "We couldn’t connect. Your answers are still here—please try again." }; }
}
