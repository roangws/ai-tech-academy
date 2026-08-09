import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, FactsLine, StatusChip } from "@/components/ui";
import { ApplyForm } from "@/components/apply-form";
import { requireUser } from "@/lib/auth";
import { getMyApplication } from "@/lib/lms/queries";
import { reopenApplication, withdrawApplication } from "@/app/actions/apply";
import { advisors, apply } from "@/lib/content";
import { getCatalog } from "@/lib/catalog";
import type { Application, ApplicationTrack } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Apply",
  robots: { index: false, follow: false },
};

const TRACKS: readonly ApplicationTrack[] = ["instructor", "judge"];

/**
 * The second half of an application, behind the login.
 *
 * ------------------------------------------------------------------ the gate
 *
 * `requireUser` with the current path as `next`, so the three-step flow the
 * public pages describe is enforced by the routing rather than narrated by it:
 * a signed-out reader pressing "Apply to teach" lands on /sign-in, makes an
 * account, and is returned here. There is no separate landing page in between
 * to keep in sync.
 *
 * That the form is behind a login is a real decision and not a formality. It
 * collects a phone number, a WhatsApp number and a portrait, and a public form
 * that collects those is a public form collecting those.
 *
 * -------------------------------------------------------------- five screens
 *
 * One route renders five states, because they are five stages of one thing and
 * splitting them into routes would mean an applicant's bookmark stops working
 * the moment they submit:
 *
 *   nothing yet / draft   the form
 *   submitted             what was sent, and the way to pull it back
 *   in_review             the same, and the board has it open
 *   accepted / declined   the decision, and what happens next
 *   withdrawn             what was sent, and the way to reopen it as a draft
 *
 * Which one renders is read off `status`, which is a column only Postgres and
 * the board can move past 'submitted'. The page never infers state from the
 * absence of something.
 */
export default async function ApplyPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track: raw } = await params;
  /* Not a redirect and not a fallback to one of the two. An unknown track is a
     URL that was never valid, and quietly serving the instructor form to
     somebody who asked for /apply/mentor is worse than a 404. */
  if (!TRACKS.includes(raw as ApplicationTrack)) notFound();
  const track = raw as ApplicationTrack;

  const copy = apply[track];
  const viewer = await requireUser(copy.href);
  const application = await getMyApplication(track);
  /* Published only. An applicant picks the course they want to teach, and a
     draft is a course that does not exist yet as far as the site is concerned. */
  const catalog = await getCatalog();
  const titles = new Map(catalog.map((c) => [c.id, c.title]));

  const status = application?.status ?? "none";
  const editable = status === "none" || status === "draft";

  return (
    <Container className="py-12 md:py-16">
      <nav aria-label="Breadcrumb" className="t-meta text-ink-muted">
        <Link
          href={track === "instructor" ? "/instructors" : "/review-judge-board"}
          className="text-ink-muted no-underline hover:text-accent hover:underline"
        >
          {track === "instructor" ? "Instructors" : "Review Judge Board"}
        </Link>
        <span className="px-1.5 text-line-strong">/</span>
        <span className="text-ink-secondary">{copy.cta}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="t-display text-ink">{copy.cta}</h1>
        {application ? <Status status={application.status} /> : null}
      </div>

      <FactsLine
        className="mt-4"
        items={[
          copy.seats ?? "Read against the bar",
          "Read by the advisory board",
          application?.submitted_at
            ? `Submitted ${new Date(application.submitted_at).toLocaleDateString("en-US")}`
            : "Nothing sent yet",
        ]}
      />

      {/* --------------------------------------------------------- the states */}

      {editable ? (
        <>
          <p className="t-body mt-6 max-w-[62ch] text-ink-secondary">
            {status === "draft"
              ? "Your draft is below, exactly as you left it. Nothing has been sent."
              : "You are signed in, so this is step two. It saves as a draft every time, and nothing reaches the board until you submit it."}
          </p>
          <ApplyForm
            track={track}
            application={application}
            courses={catalog.map((c) => ({ id: c.id, badge: c.badge, title: c.title }))}
            profile={{
              firstName: viewer.profile?.first_name ?? "",
              lastName: viewer.profile?.last_name ?? "",
              company: viewer.profile?.company ?? "",
              email: viewer.email ?? "",
              avatarUrl: viewer.profile?.avatar_url ?? null,
            }}
          />
        </>
      ) : null}

      {application && (status === "submitted" || status === "in_review") ? (
        <>
          <Panel
            title={
              status === "in_review"
                ? "The board has your application open"
                : "Your application is with the advisory board"
            }
          >
            <p className="t-body-sm text-ink-secondary">
              {status === "in_review"
                ? "An advisor is reading it now. If it goes further somebody will be in touch on the number below."
                : "It is in the queue, read in the order applications arrive. Nothing is required from you in the meantime."}{" "}
              {advisors.footnote}
            </p>
          </Panel>

          <Summary application={application} titles={titles} />

          {/*
            Withdrawing rather than deleting, which is revoked at the table. The
            control is deliberately quiet and deliberately not a second submit:
            it is the only way back from here, and it should be findable without
            being the thing a reader's eye lands on.
          */}
          <form action={withdrawApplication} className="mt-8 border-t border-line pt-6">
            <input type="hidden" name="track" value={track} />
            <p className="t-body-sm text-ink-secondary">
              Need to change something? Withdraw it, edit the draft, and send it again. The
              board keeps no copy of a withdrawn application in its queue.
            </p>
            <button
              type="submit"
              className="t-button mt-3 h-11 rounded-[var(--radius-control)] border border-line-control px-5 text-ink-secondary transition-colors hover:border-danger hover:text-danger"
            >
              Withdraw my application
            </button>
          </form>
        </>
      ) : null}

      {application && status === "withdrawn" ? (
        <>
          <Panel title="You withdrew this application">
            <p className="t-body-sm text-ink-secondary">
              It is out of the board&rsquo;s queue and nobody is reading it. Everything you
              wrote is still here. Reopening it puts it back to a draft so you can edit it,
              and it goes to the back of the queue when you send it again.
            </p>
            <form action={reopenApplication} className="mt-4">
              <input type="hidden" name="track" value={track} />
              <button
                type="submit"
                className="t-button h-11 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent transition-colors hover:bg-accent-hover"
              >
                Reopen as a draft
              </button>
            </form>
          </Panel>
          <Summary application={application} titles={titles} />
        </>
      ) : null}

      {application && (status === "accepted" || status === "declined") ? (
        <>
          <Panel
            title={
              status === "accepted"
                ? `The board has accepted you as ${track === "instructor" ? "an instructor" : "a judge"}`
                : "The board has not taken this one forward"
            }
          >
            {application.decision_note ? (
              <p className="t-body-sm whitespace-pre-wrap text-ink-secondary">
                {application.decision_note}
              </p>
            ) : (
              <p className="t-body-sm text-ink-secondary">
                {status === "accepted"
                  ? "Somebody will be in touch on the number on this application to agree what you record and when."
                  : "No note was left with the decision."}
              </p>
            )}
            {status === "declined" ? (
              <p className="t-body-sm mt-3 text-ink-secondary">
                A decline is about this intake rather than about you permanently. Applying
                again is a message away once there is something new to read.
              </p>
            ) : null}
          </Panel>
          <Summary application={application} titles={titles} />
        </>
      ) : null}

      <p className="t-body-sm mt-12 border-t border-line pt-6 text-ink-secondary">
        The bar, the commitment and who reads this are all on{" "}
        <Link
          href={`${track === "instructor" ? "/instructors" : "/review-judge-board"}#how-it-works`}
          className="text-accent no-underline hover:underline"
        >
          the public page
        </Link>
        .
      </p>
    </Container>
  );
}

/* ------------------------------------------------------------------- pieces */

function Status({ status }: { status: Application["status"] }) {
  const label: Record<Application["status"], string> = {
    draft: "Draft",
    submitted: "With the board",
    in_review: "Being read",
    accepted: "Accepted",
    declined: "Not taken forward",
    withdrawn: "Withdrawn",
  };
  return <StatusChip>{label[status]}</StatusChip>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-6 md:p-8">
      <h2 className="t-h3 text-ink">{title}</h2>
      <div className="mt-2.5 max-w-[62ch]">{children}</div>
    </section>
  );
}

/**
 * What was sent, read-only.
 *
 * Rendered from the application row rather than from the profile, which is the
 * whole reason the row carries its own copy of these fields: an applicant has to
 * be able to see the document the board is reading, not a re-render of it
 * against whatever their profile says today.
 *
 * The phone number is shown back to them in full. It is their own number, they
 * typed it, and a masked value would leave them unable to check the digit they
 * are worried about.
 */
function Summary({
  application: a,
  titles,
}: {
  application: Application;
  titles: Map<string, string>;
}) {
  const items: readonly { label: string; value: string | null }[] = [
    { label: "Name", value: a.full_name || null },
    { label: "Headline", value: a.headline },
    { label: "Organisation", value: a.org },
    { label: "Where", value: a.location },
    { label: "LinkedIn", value: a.linkedin_url },
    { label: "Other link", value: a.site_url },
    { label: "Phone", value: a.phone },
    { label: "WhatsApp", value: a.whatsapp },
    /* The title, never the id. `course_id` is 'gtm' in the column and the summary
       printed it raw, so an applicant reviewing what they sent read "Course gtm"
       — a database key shown back to a person as if it were the answer they
       gave. The titles arrive as a prop rather than being looked up here: the
       catalogue is a query now, and this is a synchronous render helper. */
    {
      label: "Course",
      value: a.course_id ? (titles.get(a.course_id) ?? a.course_id) : null,
    },
    { label: "Focus", value: a.focus },
    { label: "Sample", value: a.sample_url },
    { label: "In person", value: a.in_person ? a.in_person_city || "Yes" : "No" },
    { label: "Curriculum review", value: a.reviews_curriculum ? "Yes" : "No" },
  ];

  return (
    <section aria-labelledby="sent-heading" className="mt-10">
      <h2 id="sent-heading" className="t-h3 text-ink">
        What you sent
      </h2>

      <dl className="mt-4 grid gap-x-8 border-t border-line sm:grid-cols-2">
        {items
          .filter((i) => i.value)
          .map((i) => (
            <div key={i.label} className="flex gap-4 border-b border-line py-2.5">
              <dt className="t-meta w-[128px] flex-none text-ink-muted">{i.label}</dt>
              <dd className="t-body-sm min-w-0 break-words text-ink">{i.value}</dd>
            </div>
          ))}
      </dl>

      {a.evidence ? (
        <div className="mt-6">
          <h3 className="t-meta text-ink-muted">Your evidence</h3>
          <p className="t-body-sm mt-1.5 max-w-[68ch] whitespace-pre-wrap text-ink">{a.evidence}</p>
        </div>
      ) : null}

      {a.notes ? (
        <div className="mt-6">
          <h3 className="t-meta text-ink-muted">Anything else</h3>
          <p className="t-body-sm mt-1.5 max-w-[68ch] whitespace-pre-wrap text-ink">{a.notes}</p>
        </div>
      ) : null}
    </section>
  );
}
