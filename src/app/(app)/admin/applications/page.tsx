import type { Metadata } from "next";
import { StatusChip } from "@/components/ui";
import { Empty } from "@/components/lms/ui";
import { Avatar } from "@/components/lms/avatar";
import { listApplications, type AdminApplication } from "@/lib/lms/admin";
import { decideApplication } from "@/app/actions/admin";
import { byId } from "@/lib/lms/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Applications", robots: { index: false, follow: false } };

/**
 * The advisory board's queue.
 *
 * ------------------------------------------------------------------- the order
 *
 * Waiting first, decided last, and within the waiting group the oldest
 * submission at the top. A queue sorted newest-first is a queue where the person
 * who has waited longest is the one nobody reaches, and the public pages promise
 * these are read "in the order they arrive".
 *
 * Drafts are shown and shown last, greyed by their own chip. They are somebody
 * halfway through an application, which is not the board's business to read and
 * IS the board's business to know about: an intake with eleven drafts and one
 * submission is a form with a problem in it rather than a thin field.
 *
 * ------------------------------------------------------- everything on one card
 *
 * No detail route. An application is about fifteen short fields and two
 * paragraphs, which fits on a card, and a list that makes a reviewer open
 * fourteen pages to compare fourteen people is a list that gets skimmed instead
 * of read. The decision controls are on the same card as the evidence for the
 * same reason.
 *
 * ---------------------------------------------------------- what it cannot do
 *
 * Edit an application. `applications_guard` pins every field the applicant wrote
 * when an admin updates the row, so the only things this page can change are the
 * status and the note. A reviewer who can rewrite the answers is a reviewer whose
 * decision means nothing, and that rule is in Postgres rather than in this file.
 */
export default async function AdminApplications() {
  const applications = await listApplications();

  const RANK: Record<AdminApplication["status"], number> = {
    submitted: 0,
    in_review: 1,
    accepted: 2,
    declined: 3,
    withdrawn: 4,
    draft: 5,
  };
  const queue = [...applications].sort((a, b) => RANK[a.status] - RANK[b.status]);

  const waiting = applications.filter(
    (a) => a.status === "submitted" || a.status === "in_review",
  ).length;

  return (
    <>
      <h1 className="t-h2 text-ink">Applications</h1>
      <p className="t-body-sm mt-1.5 max-w-[62ch] text-ink-secondary">
        Everyone who has applied to teach or to judge. Deciding here records the decision
        and shows it to the applicant on their own page. It does not grant a role: an
        instructor still needs a course in People, and a judge still needs a seat in Judge
        seats.
      </p>

      {applications.length === 0 ? (
        <div className="mt-6">
          <Empty title="Nobody has applied yet">
            Applications arrive from the bands at the foot of /instructors and
            /review-judge-board. A row appears here the moment somebody submits one; a
            draft appears as soon as they save one.
          </Empty>
        </div>
      ) : (
        <>
          <p className="t-meta mt-4 text-ink-muted">
            {waiting} waiting on the board &middot; {applications.length} in total
          </p>

          <ul className="mt-5 flex flex-col gap-4">
            {queue.map((a) => (
              <li
                key={a.id}
                className="rounded-[var(--radius-feature)] border border-line bg-surface p-5"
              >
                {/* ------------------------------------------------- who */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-4">
                    <Avatar
                      name={a.full_name}
                      email={a.email}
                      url={a.photo_url}
                      size={56}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <p className="t-card-title text-ink">{a.full_name || "Unnamed"}</p>
                      {a.headline ? (
                        <p className="t-body-sm mt-0.5 text-ink-secondary">{a.headline}</p>
                      ) : null}
                      <p className="t-meta mt-1 text-ink-muted">
                        {[a.org, a.location, a.email].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-none flex-wrap items-center gap-2">
                    <StatusChip>{a.track === "instructor" ? "Instructor" : "Judge"}</StatusChip>
                    <StatusChip>{LABEL[a.status]}</StatusChip>
                  </div>
                </div>

                {/* --------------------------------------------- the facts */}
                <dl className="mt-4 grid gap-x-8 border-t border-line pt-4 sm:grid-cols-2">
                  <Row label="Phone" value={a.phone} />
                  <Row label="WhatsApp" value={a.whatsapp} />
                  <Row label="LinkedIn" value={a.linkedin_url} href={a.linkedin_url} />
                  <Row label="Other link" value={a.site_url} href={a.site_url} />
                  <Row label="Sample" value={a.sample_url} href={a.sample_url} />
                  <Row
                    label="Course"
                    value={a.course_id ? (byId.get(a.course_id)?.title ?? a.course_id) : null}
                  />
                  <Row label="Focus" value={a.focus} />
                  <Row
                    label="In person"
                    value={a.in_person ? a.in_person_city || "Yes, city not given" : "No"}
                  />
                  <Row label="Reads curriculum" value={a.reviews_curriculum ? "Yes" : "No"} />
                  <Row
                    label="Submitted"
                    value={
                      a.submitted_at
                        ? new Date(a.submitted_at).toLocaleDateString("en-US")
                        : "Not yet"
                    }
                  />
                </dl>

                {/* A draft's answers are not read. Somebody halfway through a
                    form has not asked anybody to read anything, and the board
                    knowing the draft exists is the whole of what this row is
                    for. */}
                {a.status !== "draft" && a.evidence ? (
                  <div className="mt-4 rounded-[var(--radius-card)] border border-line bg-surface-subtle p-4">
                    <p className="t-meta text-ink-muted">Evidence</p>
                    <p className="t-body-sm mt-1.5 whitespace-pre-wrap text-ink">{a.evidence}</p>
                    {a.notes ? (
                      <>
                        <p className="t-meta mt-4 text-ink-muted">Anything else</p>
                        <p className="t-body-sm mt-1.5 whitespace-pre-wrap text-ink">{a.notes}</p>
                      </>
                    ) : null}
                  </div>
                ) : null}

                {/* --------------------------------------------- the decision */}
                {a.status === "submitted" || a.status === "in_review" ? (
                  <form action={decideApplication} className="mt-5 border-t border-line pt-4">
                    <input type="hidden" name="id" value={a.id} />
                    <label htmlFor={`note-${a.id}`} className="t-field block text-ink-secondary">
                      What the applicant is told
                    </label>
                    <textarea
                      id={`note-${a.id}`}
                      name="decision_note"
                      rows={3}
                      defaultValue={a.decision_note ?? ""}
                      placeholder="Shown on their own application page, in these words. Left blank, they get the default sentence."
                      className="t-body mt-1.5 w-full rounded-[var(--radius-card)] border border-line-control bg-surface p-3.5 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
                    />
                    {/*
                      Three submits on one form, distinguished by `value` on a
                      shared `name`. The accepting one is the only filled
                      control, because it is the only one of the three that puts
                      somebody in front of learners.
                    */}
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      <button
                        type="submit"
                        name="status"
                        value="accepted"
                        className="t-button h-11 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent transition-colors hover:bg-accent-hover"
                      >
                        Accept
                      </button>
                      <button
                        type="submit"
                        name="status"
                        value="declined"
                        className="t-button h-11 rounded-[var(--radius-control)] border border-line-control px-5 text-ink-secondary transition-colors hover:border-danger hover:text-danger"
                      >
                        Decline
                      </button>
                      {a.status === "submitted" ? (
                        <button
                          type="submit"
                          name="status"
                          value="in_review"
                          className="t-button h-11 rounded-[var(--radius-control)] border border-line-control px-5 text-ink-secondary transition-colors hover:border-line-strong hover:text-ink"
                        >
                          Mark as being read
                        </button>
                      ) : null}
                    </div>
                  </form>
                ) : a.decision_note ? (
                  <div className="mt-5 border-t border-line pt-4">
                    <p className="t-meta text-ink-muted">
                      Told to the applicant
                      {a.decided_at
                        ? ` on ${new Date(a.decided_at).toLocaleDateString("en-US")}`
                        : ""}
                    </p>
                    <p className="t-body-sm mt-1 whitespace-pre-wrap text-ink-secondary">
                      {a.decision_note}
                    </p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

const LABEL: Record<AdminApplication["status"], string> = {
  draft: "Draft",
  submitted: "Waiting",
  in_review: "Being read",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

function Row({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null;
  href?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-4 py-1.5">
      <dt className="t-meta w-[120px] flex-none text-ink-muted">{label}</dt>
      <dd className="t-body-sm min-w-0 break-words text-ink">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent no-underline hover:underline"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
