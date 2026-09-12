"use client";
import { useActionState, useState } from "react";
import { requestTraining } from "@/app/actions/team-training";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

export function TeamTrainingForm({ courses }: { courses: { slug: string; title: string }[] }) {
  const [state, action, pending] = useActionState(requestTraining, {});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const bind = (key: string) => ({ value: draft[key] ?? "", onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft((previous) => ({ ...previous, [key]: event.target.value })) });
  const field = "mt-1.5 min-h-11 w-full rounded-lg border border-white/30 bg-white px-3 py-2 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-white";
  if (state.ok) return <div role="status" className="mt-6 rounded-xl border border-white/25 p-6"><h3 className="t-h3 text-white">Request received</h3><p className="t-body-sm mt-2 text-white/80">Thank you. Our team will contact you by email to discuss the training.</p></div>;
  return <form action={action} className="mt-6 space-y-4">
    <fieldset disabled={pending} className="space-y-4 disabled:opacity-60">
      <legend className="sr-only">Request team training</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="t-body-sm text-white">Your name<input name="name" {...bind("name")} autoComplete="name" required maxLength={160} className={field} /></label>
        <label className="t-body-sm text-white">Work email<input name="email" {...bind("email")} type="email" autoComplete="email" required maxLength={254} className={field} /></label>
        <label className="t-body-sm text-white">Company<input name="company" {...bind("company")} autoComplete="organization" required maxLength={160} className={field} /></label>
        <label className="t-body-sm text-white">Number of learners<input name="size" {...bind("size")} type="number" min={1} max={100000} required className={field} /></label>
      </div>
      <fieldset><legend className="t-body-sm mb-2 text-white">Which courses? Select at least one.</legend>
        <div className="space-y-1">{courses.map((course) => <label key={course.slug} className="t-body-sm flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-white/15 px-3 py-2 text-white"><input type="checkbox" name="courses" value={course.slug} checked={selected.includes(course.slug)} onChange={(event) => setSelected((previous) => event.target.checked ? [...previous, course.slug] : previous.filter((slug) => slug !== course.slug))} className="size-4 shrink-0 accent-[#1645ff]" />{course.title}</label>)}</div>
      </fieldset>
      <label className="t-body-sm block text-white">Goals or preferred dates <span className="text-white/60">(optional)</span><textarea name="goals" {...bind("goals")} maxLength={2000} rows={2} className={field} /></label>
      <div hidden aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    </fieldset>
    {state.error && <p role="alert" className="t-body-sm rounded-lg bg-white p-3 text-red-800">{state.error}</p>}
    <LiquidButton type="submit" variant="onDark" disabled={pending} className="t-button">{pending ? "Sending…" : "Request team training"}</LiquidButton>
    <p className="t-meta text-white/65">No account needed. We’ll use these details to respond to your request.</p>
  </form>;
}
