import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { approveCourseApplication } from "@/app/actions/course-intake";

export async function IntakeReview() {
  await requireRole("admin", "/admin/applications");
  const db = await createClient();
  const { data, error } = await db
    .from("course_intakes")
    .select("*")
    .eq("status", "applied")
    .order("created_at");
  if (error) throw new Error("Could not load course applications.");
  const { data: profiles, error: profileError } = data?.length
    ? await db
        .from("profiles")
        .select("id,email,first_name,last_name")
        .in(
          "id",
          data.map((r) => r.user_id),
        )
    : { data: [], error: null };
  if (profileError) throw new Error("Could not load applicant names.");
  return (
    <section
      className="mt-8 border-t border-line pt-6"
      aria-labelledby="course-applications"
    >
      <h2 id="course-applications" className="t-h3 text-ink">
        Filmmaking applications
      </h2>
      <p className="t-body-sm mt-2 text-ink-secondary">
        {data?.length
          ? "Review the answers below. Approving an application opens the course in the learner's account."
          : "No filmmaking applications are waiting for review."}
      </p>
      <div className="mt-4 space-y-4">
        {data?.map((row) => {
          const profile = profiles?.find((p) => p.id === row.user_id);
          return (
            <article
              key={row.user_id}
              className="rounded-xl border border-line bg-surface p-5"
            >
              <h3 className="t-h3 text-ink">
                {[profile?.first_name, profile?.last_name]
                  .filter(Boolean)
                  .join(" ") || "Applicant"}
              </h3>
              <p className="t-meta mt-1 text-ink-muted">{profile?.email}</p>
              <dl className="t-body-sm mt-4 space-y-3 text-ink">
                {[
                  ["Company", row.company],
                  ["Job title", row.job_title],
                  ["Current projects", row.projects],
                  ["What they hope to create", row.goals],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="font-medium">{label}</dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words text-ink-secondary">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <form action={approveCourseApplication} className="mt-5">
                <input type="hidden" name="user_id" value={row.user_id} />
                <input type="hidden" name="course_id" value={row.course_id} />
                <button className="t-button min-h-11 rounded-lg bg-accent px-5 py-2 text-on-accent hover:bg-accent-hover">
                  Approve and unlock course
                </button>
              </form>
            </article>
          );
        })}
      </div>
    </section>
  );
}
