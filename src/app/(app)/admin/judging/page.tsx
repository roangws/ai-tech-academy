import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Quiet } from "@/components/lms/admin-form";
import { listSeats, listPeople } from "@/lib/lms/admin";
import { getRoster } from "@/lib/roster";
import { bindSeat } from "@/app/actions/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Judging", robots: { index: false, follow: false } };

/**
 * Judging, in one place, with the three things it is made of named.
 *
 * -------------------------------------------------------------- what was wrong
 *
 * Roan: "/admin/seats is confusing. Have this, and then they also have the
 * judging section, which is not clear."
 *
 * He is describing a real structural problem, not a layout one. Being a judge on
 * this site is THREE separate facts that live in three different tables, and
 * nothing anywhere said so:
 *
 *   1. A CARD on /review-judge-board. Public, and purely a claim: this person
 *      judges here. `roster`, edited on /admin/roster.
 *   2. The `judge` ROLE. What lets somebody open /judge at all. `user_roles`,
 *      granted on /admin/people.
 *   3. A SEAT. Which course's curriculum they read and whose sheets they score.
 *      `judge_seats`, bound here.
 *
 * The old page showed only the third, called it "Judge seats", and gave no hint
 * that the other two existed — so binding a seat to somebody without the role
 * produced a judge who could see nothing, with no way to find out why. The seat
 * binder does grant the role in the same transaction (`bind_seat` does it,
 * because `holds_seat()` tests `has_role` first), which papered over half of it
 * and made the remaining half harder to reason about, not easier.
 *
 * ------------------------------------------------------------------ the fix
 *
 * This page states all three, per person, and shows which are missing. It does
 * not merge them into one control: they are genuinely separate decisions —
 * publishing somebody's photograph is not the same act as giving them read
 * access to learners' submitted work — and a single "make this person a judge"
 * button would be the console pretending otherwise.
 *
 * What it does do is stop each one being invisible from the other two. A judge
 * with a card and no seat now reads as an unfinished setup rather than as
 * nothing at all.
 */
export default async function AdminJudging() {
  const [seats, people, roster] = await Promise.all([listSeats(), listPeople(), getRoster("judge")]);

  /* The three facts, keyed by account. A card with no `user_id` is a judge on
     the website who has never signed in, which is the common case today and is
     not a fault — it is why the "linked" column exists. */
  const cardByUser = new Map(roster.filter((r) => r.user_id).map((r) => [r.user_id!, r]));
  const seatByUser = new Map(seats.filter((s) => s.user_id).map((s) => [s.user_id!, s]));
  const judgesWithRole = people.filter((p) => p.roles.includes("judge"));

  const unlinkedCards = roster.filter((r) => !r.user_id);

  return (
    <>
      <h1 className="t-h2 text-ink">Judging</h1>
      <p className="t-body-sm mt-1.5 max-w-[68ch] text-ink-secondary">
        Being a judge here is three separate things, and somebody can have any of them without the
        others. This page shows all three so a half-finished setup is visible rather than silent.
      </p>

      <ol className="t-body-sm mt-4 grid gap-2 sm:grid-cols-3">
        {[
          {
            n: "1",
            title: "A card",
            body: "Their photograph and employer on /review-judge-board. Public, and a claim about them.",
            href: "/admin/roster",
            hrefLabel: "Instructors and judges",
          },
          {
            n: "2",
            title: "The judge role",
            body: "What lets them open the judge console at all. Granted per account.",
            href: "/admin/people",
            hrefLabel: "People",
          },
          {
            n: "3",
            title: "A seat",
            body: "Which course they read each term, and whose outcome sheets they score. Bound below.",
            href: null,
            hrefLabel: null,
          },
        ].map((step) => (
          <li
            key={step.n}
            className="rounded-[var(--radius-card)] border border-line bg-surface-subtle p-3"
          >
            <p className="t-label text-ink-muted">Step {step.n}</p>
            <p className="t-card-title mt-0.5 text-ink">{step.title}</p>
            <p className="t-meta mt-1 text-ink-secondary">{step.body}</p>
            {step.href ? (
              <Link
                href={step.href}
                className="t-meta mt-1.5 inline-block text-accent no-underline hover:underline"
              >
                {step.hrefLabel}
              </Link>
            ) : null}
          </li>
        ))}
      </ol>

      {/* ------------------------------------------------------ who is set up */}
      <section aria-labelledby="who" className="mt-8">
        <h2 id="who" className="t-h3 text-ink">
          Who is set up
        </h2>
        <p className="t-meta mt-1 max-w-[64ch] text-ink-muted">
          Everyone holding the judge role, and which of the three they have.
        </p>

        {judgesWithRole.length === 0 ? (
          <p className="t-body-sm mt-4 rounded-[var(--radius-card)] border border-dashed border-line-control bg-surface-subtle p-4 text-ink-secondary">
            Nobody holds the judge role yet. Binding a seat below grants it, or grant it directly on{" "}
            <Link href="/admin/people" className="text-accent no-underline hover:underline">
              People
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {judgesWithRole.map((p) => {
              const card = cardByUser.get(p.id);
              const seat = seatByUser.get(p.id);
              const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email;

              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="t-card-title block text-ink">{name}</span>
                    <span className="t-meta block text-ink-muted">{p.email}</span>
                  </span>

                  <Have
                    yes={Boolean(card)}
                    label={card ? `Card: ${card.name}` : "No public card"}
                    href="/admin/roster"
                  />
                  <Have yes label="Judge role" />
                  <Have yes={Boolean(seat)} label={seat ? `Seat: ${seat.seat}` : "No seat"} />
                </li>
              );
            })}
          </ul>
        )}

        {/* The other direction: a published judge nobody has connected to an
            account. Not an error — most of the board has never signed in — but
            it is the thing somebody comes to this page not knowing. */}
        {unlinkedCards.length > 0 ? (
          <p className="t-body-sm mt-3 rounded-[var(--radius-card)] border border-line bg-surface-subtle p-3 text-ink-secondary">
            <span className="text-ink">
              {unlinkedCards.length} judge{unlinkedCards.length === 1 ? "" : "s"} on the website
            </span>{" "}
            {unlinkedCards.length === 1 ? "has" : "have"} no account linked, so nothing here applies
            to {unlinkedCards.length === 1 ? "them" : "them"} yet:{" "}
            {unlinkedCards.map((r) => r.name).join(", ")}.{" "}
            <Link href="/admin/roster" className="text-accent no-underline hover:underline">
              Link an account
            </Link>
            .
          </p>
        ) : null}
      </section>

      {/* ----------------------------------------------------------- the seats */}
      <section aria-labelledby="seats" className="mt-10">
        <h2 id="seats" className="t-h3 text-ink">
          The seats
        </h2>
        <p className="t-body-sm mt-1.5 max-w-[66ch] text-ink-secondary">
          One seat per course, plus a learning-design seat that reads them all. Binding somebody
          grants the judge role at the same time, because <code>holds_seat()</code> tests for it first, so
          a seat bound to an account without it would silently do nothing.
        </p>

        <ul className="mt-4 flex flex-col gap-3">
          {seats.map((seat) => (
            <li
              key={seat.id}
              className="rounded-[var(--radius-feature)] border border-line bg-surface p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="t-card-title text-ink">{seat.seat}</p>
                  <p className="t-meta text-ink-muted">
                    {seat.reads_all_courses ? "Reads every course" : seat.reviews_label}
                  </p>
                </div>
                <p className="t-meta text-ink-secondary">
                  {seat.user_id ? (
                    <>
                      <span className="text-ink">{seat.holder_name ?? "Unnamed"}</span>
                      <span className="text-ink-muted"> · {seat.holder_email}</span>
                    </>
                  ) : (
                    <span className="text-ink-muted">Nobody yet</span>
                  )}
                </p>
              </div>

              <form action={bindSeat} className="mt-4 flex flex-wrap items-end gap-3">
                <input type="hidden" name="seatId" value={seat.id} />
                <label className="min-w-[240px] flex-1">
                  <span className="t-label text-ink-muted">Bind to</span>
                  <select
                    name="userId"
                    defaultValue={seat.user_id ?? ""}
                    className="t-body-sm mt-1 h-10 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                  >
                    <option value="">Nobody</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email} ·{" "}
                        {p.email}
                      </option>
                    ))}
                  </select>
                </label>
                <Quiet>Save seat</Quiet>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/** One of the three facts, present or not. */
function Have({ yes, label, href }: { yes: boolean; label: string; href?: string }) {
  const body = (
    <span
      className={`t-meta inline-flex min-h-[32px] items-center gap-1.5 rounded-[var(--radius-control)] border px-2 ${
        yes ? "border-line-control text-ink-secondary" : "border-dashed border-line-control text-ink-muted"
      }`}
    >
      {yes ? (
        <CheckIcon size={12} weight="bold" aria-hidden="true" className="text-accent" />
      ) : (
        <WarningCircleIcon size={12} aria-hidden="true" />
      )}
      {label}
    </span>
  );

  return href && !yes ? (
    <Link href={href} className="no-underline">
      {body}
    </Link>
  ) : (
    body
  );
}
