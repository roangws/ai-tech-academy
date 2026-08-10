import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarBlankIcon,
  CaretRightIcon,
  CheckCircleIcon,
  MapPinIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Container, FactsLine, StatusChip } from "@/components/ui";
import { Empty } from "@/components/lms/ui";
import { requireRole } from "@/lib/auth";
import { listInvitations, type InvitationWithEvent } from "@/lib/lms/events";
import { formatEventTime, formatEventDate } from "@/lib/lms/time";
import { respondToEvent } from "@/app/actions/events";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Judging opportunities",
  robots: { index: false, follow: false },
};

/**
 * The judge console.
 *
 * ------------------------------------------------------------- what it is now
 *
 * Events, and only events. Roan: "for judge I'll pivot internally, only judge
 * has access to this page, and I want to focus only on events for phase 1. I
 * want to issue an event, and all the judges receive a notification, it will be
 * opportunities for hackathon judging."
 *
 * So this page is one question asked well — are you available for this — and
 * everything else that used to be on it moved to /judge/curriculum rather than
 * being deleted. Both of those features work, both are read by other screens,
 * and neither is what a judge opens this console for in phase one.
 *
 * The [FILL: events.] note that stood at the top of this file for the whole life
 * of the project is gone with it. content.ts:2562 says a judge "sits on the
 * panel that judges the events where learners present the workflows they
 * deployed", and until this week that sentence described nothing. It describes
 * this.
 *
 * ------------------------------------------------------------- the role, fixed
 *
 * `requireRole("judge")` — it was `requireRole("admin")`, which is the argument
 * order right and the role wrong, so for as long as this page has existed a
 * judge holding the judge role and a bound seat was redirected to /dashboard by
 * their own console. Only the owner could open it. Same defect, same line, on
 * /instructor and /judge/review.
 *
 * ------------------------------------------------------------- no seat needed
 *
 * A seat says which course's curriculum somebody reads each term. Being asked to
 * a hackathon panel is not that, and there are six seats in existence — gating
 * events on one would mean six people can ever be invited to anything. The role
 * is the whole condition, which is also what `issue_judge_event` fans out to.
 */
export default async function JudgePage() {
  const viewer = await requireRole("judge", "/judge");
  /*
    The viewer's id is passed, and it is not decoration: an administrator can
    read every judge's invitation, and every account on this site holds both
    roles — so without it this page renders the same event once per judge
    notified, which is exactly what QA saw. `listInvitations` has the note.

    Split at the present moment inside the query, too. A component that reads the
    clock is a component that can render two different answers to one question.
  */
  const { upcoming, past } = await listInvitations(viewer.id);

  /* "Upcoming" is about the event, not the answer. A judge who said yes still
     needs the date in front of them, and one who said no should be able to
     change their mind while it is still ahead. */
  const waiting = upcoming.filter((i) => i.response === null);

  return (
    <Container className="py-12 md:py-16">
      <h1 className="t-display text-ink">Judging opportunities</h1>
      <p className="t-body mt-3 max-w-[62ch] text-ink-secondary">
        Hackathons, demo days and review panels you have been invited to judge. Answering tells the
        organiser whether to count on you.
      </p>
      <FactsLine
        className="mt-4"
        items={[
          `${upcoming.length} upcoming`,
          waiting.length
            ? `${waiting.length} waiting on your answer`
            : upcoming.length
              ? "All answered"
              : "",
        ].filter(Boolean)}
      />

      {/* ---------------------------------------------------------- upcoming */}
      <section aria-labelledby="upcoming-heading" className="mt-12">
        <h2 id="upcoming-heading" className="t-h3 text-ink">
          Upcoming
        </h2>

        {upcoming.length === 0 ? (
          <div className="mt-5">
            <Empty title="Nothing to judge yet">
              When an event is issued you are notified here, with what it is, when it runs and what
              the panel is being asked to do. Nothing is sent by email, so this page is where to
              look.
            </Empty>
          </div>
        ) : (
          <ul className="mt-5 grid gap-5">
            {upcoming.map((invitation) => (
              <li key={invitation.id}>
                <EventCard invitation={invitation} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* -------------------------------------------------------------- past */}
      {past.length > 0 ? (
        <section aria-labelledby="past-heading" className="mt-16">
          <h2 id="past-heading" className="t-h3 text-ink">
            Been and gone
          </h2>
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {past.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <span className="min-w-0">
                  <span className="t-body-sm block text-ink">{invitation.event.title}</span>
                  <span className="t-meta block text-ink-muted">
                    {formatEventDate(invitation.event.starts_at, invitation.event.timezone)}
                    {invitation.event.host ? ` · ${invitation.event.host}` : ""}
                  </span>
                </span>
                <StatusChip>{answerLabel(invitation.response)}</StatusChip>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/*
        The rest of the seat's work, one link away.

        It was the whole of this page and it is not gone — a curriculum review is
        still filed here and a submitted outcome sheet is still scored here. It is
        one line at the bottom because phase one is events, and because a console
        that opens on two unrelated jobs is a console where neither reads as the
        job.
      */}
      <p className="t-body-sm mt-14 border-t border-line pt-6 text-ink-secondary">
        The work that comes with a seat on the board is on its own page:{" "}
        <Link href="/judge/curriculum" className="text-accent no-underline hover:underline">
          curriculum review and outcome sheets
        </Link>
        .
      </p>
    </Container>
  );
}

function answerLabel(response: InvitationWithEvent["response"]): string {
  if (response === "available") return "You were available";
  if (response === "unavailable") return "You could not make it";
  return "Never answered";
}

/* ------------------------------------------------------------------- card */

function EventCard({ invitation }: { invitation: InvitationWithEvent }) {
  const { event, response, note } = invitation;
  const answered = response !== null;

  return (
    <article className="rounded-[var(--radius-feature)] border border-line bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          {event.host ? <p className="t-label text-ink-muted">{event.host}</p> : null}
          <h3 className="t-card-title mt-0.5 text-ink">{event.title}</h3>
        </div>
        {/* The accent, not green. Green on this site means "open with no
            account" and nothing else — the note on ModuleState has the rule. */}
        {answered ? (
          <span
            className={`t-label inline-flex h-6 items-center gap-1 rounded-full px-2.5 ${
              response === "available" ? "bg-accent-tint text-accent" : "bg-surface-subtle text-ink-muted"
            }`}
          >
            {response === "available" ? (
              <CheckCircleIcon size={12} weight="fill" aria-hidden="true" />
            ) : null}
            {response === "available" ? "You are on the panel" : "You said no"}
          </span>
        ) : (
          <StatusChip>Awaiting your answer</StatusChip>
        )}
      </div>

      <ul className="t-body-sm mt-4 flex flex-col gap-1.5 text-ink-secondary">
        <li className="flex items-center gap-2">
          <CalendarBlankIcon size={15} aria-hidden="true" className="flex-none text-ink-muted" />
          {formatEventTime(event.starts_at, event.timezone)}
          {event.ends_at ? ` to ${formatEventTime(event.ends_at, event.timezone)}` : ""}
        </li>
        {event.location || event.format ? (
          <li className="flex items-center gap-2">
            <MapPinIcon size={15} aria-hidden="true" className="flex-none text-ink-muted" />
            {[event.location, FORMAT_LABEL[event.format]].filter(Boolean).join(" · ")}
          </li>
        ) : null}
        {event.judges_needed ? (
          <li className="flex items-center gap-2">
            <UsersThreeIcon size={15} aria-hidden="true" className="flex-none text-ink-muted" />
            {event.judges_needed} judge{event.judges_needed === 1 ? "" : "s"} needed
          </li>
        ) : null}
      </ul>

      {event.summary ? (
        <p className="t-body mt-4 max-w-[62ch] text-ink">{event.summary}</p>
      ) : null}

      {/* Folded, because a brief is a page of reading and the question on this
          card is one word long. `<details>` is native, needs no JavaScript and
          announces its own state. */}
      {event.brief ? (
        <details className="group mt-4">
          <summary className="t-body-sm flex cursor-pointer list-none items-center gap-1.5 text-accent">
            <CaretRightIcon
              size={13}
              weight="bold"
              aria-hidden="true"
              className="transition-transform group-open:rotate-90"
            />
            What the panel is asked to do
          </summary>
          <p className="t-body-sm mt-2.5 max-w-[62ch] whitespace-pre-wrap text-ink-secondary">
            {event.brief}
          </p>
        </details>
      ) : null}

      {/* ---------------------------------------------------------- answering */}
      <form action={respondToEvent} className="mt-5 border-t border-line pt-5">
        <input type="hidden" name="eventId" value={event.id} />

        <label htmlFor={`note-${event.id}`} className="t-field block text-ink-secondary">
          Anything the organiser should know
          <span className="t-meta text-ink-muted"> (optional)</span>
        </label>
        <textarea
          id={`note-${event.id}`}
          name="note"
          rows={2}
          defaultValue={note ?? ""}
          className="t-body-sm mt-1.5 w-full rounded-[var(--radius-card)] border border-line-control bg-surface p-3 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
          placeholder="I can do the morning only."
        />

        {/*
          Two submits on one form, told apart by `value` on the buttons — the
          same shape the module hand-in used, and for the same reason: they are
          two different answers to one question, not a state toggle.

          The one you have already given is the outlined control and the other is
          filled, so the card always offers the change rather than re-offering
          what you already said.
        */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            name="response"
            value="available"
            className={
              response === "available"
                ? "t-button h-11 rounded-[var(--radius-control)] border border-line-control px-5 text-ink-secondary transition-colors hover:border-line-strong hover:text-ink"
                : "t-button h-11 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent transition-colors hover:bg-accent-hover"
            }
          >
            {response === "available" ? "Update my note" : "I am available"}
          </button>
          <button
            type="submit"
            name="response"
            value="unavailable"
            className="t-button h-11 rounded-[var(--radius-control)] border border-line-control px-5 text-ink-secondary transition-colors hover:border-line-strong hover:text-ink"
          >
            {response === "unavailable" ? "Still cannot make it" : "I cannot make it"}
          </button>

          {event.respond_by ? (
            <span className="t-meta text-ink-muted">
              Answer by {formatEventDate(event.respond_by, event.timezone)}
            </span>
          ) : null}
        </div>
      </form>
    </article>
  );
}

const FORMAT_LABEL: Record<string, string> = {
  online: "Online",
  in_person: "In person",
  hybrid: "Hybrid",
};
