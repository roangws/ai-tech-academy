import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCatalog } from "@/lib/catalog";

export async function TeamTrainingReview() {
  await requireRole("admin", "/admin/applications");
  const db = await createClient();
  const { data, error } = await db.from("team_training_requests").select("id,full_name,email,company,team_size,courses,goals,created_at").order("created_at", { ascending: false }).limit(100);
  const titles = new Map((await getCatalog()).map((c) => [c.slug, c.title]));
  return <section className="mt-10" aria-labelledby="training-requests"><h2 id="training-requests" className="t-h3 text-ink">Team training requests</h2>
    <p className="t-body-sm mt-2 text-ink-secondary">Requests from the public homepage. Contact the organizer by email. Showing the latest 100.</p>
    {error ? <p role="alert" className="mt-4 text-red-700">Training requests could not be loaded.</p> : !data?.length ? <p className="t-body-sm mt-4 text-ink-muted">No requests yet.</p> : <ul className="mt-4 space-y-4">{data.map((request) => <li key={request.id} className="rounded-xl border border-line p-5">
      <h3 className="t-card-title">{request.company} · {request.team_size} learners</h3>
      <p className="t-body-sm mt-2">{request.full_name} · <a className="text-accent underline" href={`mailto:${request.email}`}>{request.email}</a></p>
      <ul className="t-body-sm mt-3 list-inside list-disc">{(request.courses as string[]).map((slug) => <li key={slug}>{titles.get(slug) ?? slug}</li>)}</ul>
      {request.goals && <p className="t-body-sm mt-3 whitespace-pre-wrap break-words text-ink-secondary">{request.goals}</p>}
      <p className="t-meta mt-3 text-ink-muted">{new Date(request.created_at).toLocaleDateString("en-US")}</p>
    </li>)}</ul>}
  </section>;
}
