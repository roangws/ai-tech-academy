import type { Metadata } from "next";
import {
  CheckIcon,
  MegaphoneIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ActionForm, Area, Field, Save, Quiet, Danger, Text } from "@/components/lms/admin-form";
import { StatusChip } from "@/components/ui";
import type { FormState } from "@/lib/form-state";
import { listEventsForAdmin, countJudges, type EventForAdmin } from "@/lib/lms/events";
import { EVENT_ZONES, formatEventTime, instantToWallClock } from "@/lib/lms/time";
import { saveEvent, issueEvent, closeEvent, deleteEvent } from "@/app/actions/events";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Judging events",
  robots: { index: false, follow: false },
};

const select =
  "t-body-sm mt-1 h-10 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

/**
 * Where a judging opportunity is written and issued.
 *
 * ------------------------------------------------------------------ the gap
 *
 * "They sit on the panel that judges the events where learners present the
 * workflows they deployed" has been on /review-judge-board since content.ts was
 * written, and there was no event in the schema, no screen that made one, and a
 * [FILL: events.] note at the top of the judge console admitting it. The one
 * thing the site tells a prospective judge they will be asked to do was the one
 * thing the product could not ask them to do.
 *
 * ------------------------------------------------------- draft, then issue
 *
 * Two steps, deliberately. Saving writes a draft that no judge can read — the
 * `judge_events_read_as_judge` policy tests `status <> 'draft'` — and issuing is
 * a separate press that notifies everybody holding the judge role. An admin
 * half way through typing a date has not already told the board about it.
 *
 * Issuing again is safe and is sometimes the point: it notifies exactly the
 * judges who were not notified the first time, which is how somebody appointed
 * after an event went out still hears about it.
 */
export default async function AdminEvents() {
  const [events, judges] = await Promise.all([listEventsForAdmin(), countJudges()]);

  const live = events.filter((e) => e.status !== "closed");
  const closed = events.filter((e) => e.status === "closed");

  return (
    <>
      <h1 className="t-h2 text-ink">Judging events</h1>
      <p className="t-body-sm mt-1.5 max-w-[68ch] text-ink-secondary">
        A hackathon, a demo day, a review panel. Write it here, issue it, and everybody holding the
        judge role is notified in their console and answers whether they are available.
      </p>

      <p className="t-meta mt-3 inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-line-control px-2.5 py-1.5 text-ink-secondary">
        {judges === 0 ? (
          <>
            <WarningCircleIcon size={13} aria-hidden="true" className="text-[var(--state-closed)]" />
            Nobody holds the judge role, so issuing would notify nobody.
          </>
        ) : (
          <>
            <MegaphoneIcon size={13} aria-hidden="true" />
            {judges} judge{judges === 1 ? "" : "s"} would be notified.
          </>
        )}
      </p>

      {/* ------------------------------------------------------------- write */}
      <section aria-labelledby="new-event" className="mt-8">
        <h2 id="new-event" className="t-h3 text-ink">
          New event
        </h2>
        <div className="mt-4 rounded-[var(--radius-feature)] border border-line bg-surface p-5">
          <EventFields action={saveEvent} submit="Save as draft" />
        </div>
      </section>

      {/* -------------------------------------------------------------- live */}
      <section aria-labelledby="live-events" className="mt-12">
        <h2 id="live-events" className="t-h3 text-ink">
          Drafts and issued
        </h2>
        {live.length === 0 ? (
          <p className="t-body-sm mt-4 rounded-[var(--radius-card)] border border-dashed border-line-control bg-surface-subtle p-4 text-ink-secondary">
            No events yet. The form above writes the first one.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {live.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {closed.length > 0 ? (
        <section aria-labelledby="closed-events" className="mt-12">
          <h2 id="closed-events" className="t-h3 text-ink">
            Closed
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {closed.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------- card */

function EventCard({ event }: { event: EventForAdmin }) {
  const issued = event.status !== "draft";

  return (
    <div className="rounded-[var(--radius-feature)] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="t-card-title text-ink">{event.title}</p>
          <p className="t-meta mt-0.5 text-ink-muted">
            {[
              event.host,
              formatEventTime(event.starts_at, event.timezone),
              event.location,
              FORMAT_LABEL[event.format],
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <StatusChip>{event.status === "draft" ? "Draft" : event.status === "issued" ? "Issued" : "Closed"}</StatusChip>
      </div>

      {/* ------------------------------------------------------- who answered */}
      {issued ? (
        <div className="mt-4 rounded-[var(--radius-card)] border border-line bg-surface-subtle p-4">
          <p className="t-label text-ink-muted">
            {event.notified} notified
            {event.judges_needed ? ` · ${event.judges_needed} needed` : ""}
          </p>
          {event.responses.length === 0 ? (
            <p className="t-body-sm mt-1.5 text-ink-secondary">Nobody has been notified yet.</p>
          ) : (
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {event.responses.map((r, i) => {
                const name =
                  [r.judge?.first_name, r.judge?.last_name].filter(Boolean).join(" ") ||
                  r.judge?.email ||
                  "A judge";
                return (
                  <li key={r.judge?.id ?? i} className="t-body-sm flex flex-wrap items-baseline gap-x-2 text-ink">
                    <span className="inline-flex items-center gap-1.5">
                      {r.response === "available" ? (
                        <CheckIcon size={12} weight="bold" aria-hidden="true" className="text-accent" />
                      ) : r.response === "unavailable" ? (
                        <XIcon size={12} weight="bold" aria-hidden="true" className="text-ink-muted" />
                      ) : (
                        <span aria-hidden="true" className="inline-block size-1.5 rounded-full bg-line-strong" />
                      )}
                      {name}
                    </span>
                    <span className="t-meta text-ink-muted">
                      {r.response === "available"
                        ? "available"
                        : r.response === "unavailable"
                          ? "cannot make it"
                          : "no answer yet"}
                      {r.note ? `: ${r.note}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {/* ---------------------------------------------------------- controls */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/*
          `ActionForm`, so "issued, 4 judges notified", or "everybody had already
          been told", lands beside the button that did it rather than being a
          page that silently re-renders identically.

          NOT ON A CLOSED CARD. This form used to render on every card, and
          `issue_judge_event` had no status guard, so "Notify anyone new" on a
          closed event reopened it and said nothing. Reopening is the control
          below, and it now goes through the same fan-out.
        */}
        {event.status !== "closed" ? (
          <ActionForm action={issueEvent}>
            <input type="hidden" name="id" value={event.id} />
            <Save>{issued ? "Notify anyone new" : "Issue and notify judges"}</Save>
          </ActionForm>
        ) : null}

        {event.status === "issued" ? (
          <form action={closeEvent}>
            <input type="hidden" name="id" value={event.id} />
            <Quiet>Close</Quiet>
          </form>
        ) : null}

        {/* Reopening is issuing again, deliberately: an event shut for a month
            and then reopened has to reach anybody appointed in the meantime. */}
        {event.status === "closed" ? (
          <ActionForm action={issueEvent}>
            <input type="hidden" name="id" value={event.id} />
            <input type="hidden" name="reopen" value="1" />
            <Save>Reopen and notify</Save>
          </ActionForm>
        ) : null}

        {/* Only a draft. Deleting an issued event takes every answer with it,
            and judges who cleared an afternoon would find no record of what
            they cleared it for. Closing is what an issued event gets. */}
        {event.status === "draft" ? (
          <form action={deleteEvent}>
            <input type="hidden" name="id" value={event.id} />
            <Danger title="Delete this draft">
              <TrashIcon size={13} aria-hidden="true" />
              Delete
            </Danger>
          </form>
        ) : null}
      </div>

      <details className="group mt-4">
        <summary className="t-meta cursor-pointer text-ink-secondary">Edit details</summary>
        <div className="mt-3">
          <EventFields action={saveEvent} submit="Save changes" event={event} />
        </div>
      </details>
    </div>
  );
}

/* ------------------------------------------------------------------ fields */

const FORMAT_LABEL: Record<string, string> = {
  online: "Online",
  in_person: "In person",
  hybrid: "Hybrid",
};

/**
 * One set of fields, used to create and to revise.
 *
 * The times are `datetime-local` and the zone is a field beside them, because
 * `datetime-local` submits a wall clock with no zone attached and the runtime on
 * Vercel is UTC — so an event typed as 9am would be stored as 9am UTC and read
 * back to a judge in California as 1 in the morning. `wallClockToInstant` in
 * lib/lms/time.ts does the conversion and explains it.
 */
function EventFields({
  action,
  submit,
  event,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submit: string;
  event?: EventForAdmin;
}) {
  const tz = event?.timezone ?? "America/Los_Angeles";

  return (
    <ActionForm action={action}>
      {event ? <input type="hidden" name="id" value={event.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2">
          <Text name="title" defaultValue={event?.title} placeholder="Bay Area AI hackathon, final judging" />
        </Field>

        <Field label="Host" hint="Who is running it. Blank if we are.">
          <Text name="host" defaultValue={event?.host} placeholder="GMI Cloud" />
        </Field>

        <Field label="Location" hint="A room, a city, or a link.">
          <Text name="location" defaultValue={event?.location} placeholder="San Francisco" />
        </Field>

        <Field label="Format">
          <select name="format" defaultValue={event?.format ?? "online"} className={select}>
            <option value="online">Online</option>
            <option value="in_person">In person</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </Field>

        <Field label="Time zone" hint="Every time on this event is entered and shown in it.">
          <select name="timezone" defaultValue={tz} className={select}>
            {EVENT_ZONES.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Starts">
          <input
            type="datetime-local"
            name="starts_at"
            defaultValue={instantToWallClock(event?.starts_at, tz)}
            className={select}
          />
        </Field>

        <Field label="Ends" hint="Optional.">
          <input
            type="datetime-local"
            name="ends_at"
            defaultValue={instantToWallClock(event?.ends_at, tz)}
            className={select}
          />
        </Field>

        <Field label="Answer by" hint="Optional. When an answer stops being useful.">
          <input
            type="datetime-local"
            name="respond_by"
            defaultValue={instantToWallClock(event?.respond_by, tz)}
            className={select}
          />
        </Field>

        <Field label="Judges needed" hint="Optional.">
          <Text name="judges_needed" type="number" defaultValue={event?.judges_needed} placeholder="4" />
        </Field>

        <Field label="Summary" className="sm:col-span-2" hint="One or two sentences, shown on the card.">
          <Area name="summary" rows={2} defaultValue={event?.summary} />
        </Field>

        <Field
          label="The brief"
          className="sm:col-span-2"
          hint="What a judge is being asked to do, and anything they need to bring or read first."
        >
          <Area name="brief" rows={5} defaultValue={event?.brief} />
        </Field>
      </div>

      <div className="mt-4">
        <Save>{submit}</Save>
      </div>
    </ActionForm>
  );
}
