import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowSquareOutIcon, StarIcon } from "@phosphor-icons/react/dist/ssr";
import { StatusChip } from "@/components/ui";
import { ActionForm, Area, Field, Save, Quiet, Danger, Text } from "@/components/lms/admin-form";
import { GroundPicker, ImageField } from "@/components/lms/roster-fields";
import { getRosterEntry } from "@/lib/roster";
import { listPeople, listSeats } from "@/lib/lms/admin";
import {
  deleteRosterEntry,
  saveRosterEntry,
  setRosterLead,
  setRosterStatus,
} from "@/app/actions/roster";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Roster entry", robots: { index: false, follow: false } };

/**
 * One person on one of the two public rosters.
 *
 * ------------------------------------------------------ the fields are the policy
 *
 * Every optional field on this form is optional in the data because content.ts
 * spent four paragraphs arguing that it has to be, and that argument survives the
 * move into Postgres unchanged: these are real, named people, and a role line or
 * a summary written by this site rather than by them is a misrepresentation, not
 * a placeholder. The hints under the inputs say so at the point somebody is about
 * to type — which is the only place the rule can actually be enforced, because
 * nothing in a database can tell an invented job title from a real one.
 *
 * So: leave it blank and the card renders nothing where it would go. That is the
 * designed outcome, not a degraded one.
 *
 * ---------------------------------------------------------- the two rosters differ
 *
 * Three fields each, and they are shown conditionally rather than all at once
 * with half of them inert. An instructor has `detail` (a sentence on the wide
 * lead card), `scope` (what they record) and a `site` link. A judge has `summary`
 * (the hover face), `location` and a `wordmark` fallback for an employer that
 * publishes no logo file. Showing a judge a "Records" field would invite somebody
 * to fill it in, and nothing would ever print it.
 */
export default async function AdminRosterEntry({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await getRosterEntry(id);
  if (!entry) notFound();

  const people = await listPeople();
  const isJudge = entry.kind === "judge";
  /* Only for a judge, and only fetched for one: an instructor row cannot hold a
     seat — `roster_seat_is_judge` refuses it — so a picker on that form would be
     a control whose only outcome is an error. */
  const seats = isJudge ? await listSeats() : [];
  const publicHref = isJudge ? `/review-judge-board#${entry.id}` : `/instructors#${entry.id}`;

  return (
    <>
      <nav aria-label="Breadcrumb" className="t-meta text-ink-muted">
        <Link href="/admin/roster" className="text-ink-secondary no-underline hover:underline">
          Instructors and judges
        </Link>
        <span className="px-1.5">/</span>
        {isJudge ? "Judge" : "Instructor"}
      </nav>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="t-h2 text-ink">{entry.name}</h1>
          <p className="t-meta mt-1 text-ink-muted">
            <code>{entry.id}</code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {entry.status === "published" ? <StatusChip open>Live</StatusChip> : <StatusChip>Draft</StatusChip>}

          {/* `ActionForm`, so "this card has no portrait yet" lands above the
              control instead of replacing the page with a 500. */}
          <ActionForm action={setRosterStatus}>
            <input type="hidden" name="id" value={entry.id} />
            <input type="hidden" name="status" value={entry.status === "published" ? "draft" : "published"} />
            <Quiet
              title={
                entry.status === "published"
                  ? "Take this card off the public page"
                  : "Put this card on the public page"
              }
            >
              {entry.status === "published" ? "Unpublish" : "Publish"}
            </Quiet>
          </ActionForm>

          {/* Only useful once it is live; a draft's anchor resolves to a page
              that does not contain it. */}
          {entry.status === "published" ? (
            <Link
              href={publicHref}
              className="t-meta inline-flex min-h-[36px] items-center gap-1.5 rounded-[var(--radius-control)] border border-line-control px-2.5 text-ink-secondary no-underline transition-colors hover:border-accent hover:text-accent"
            >
              <ArrowSquareOutIcon size={13} aria-hidden="true" />
              View on the site
            </Link>
          ) : null}
        </div>
      </div>

      {/* -------------------------------------------------------- the card */}
      <ActionForm action={saveRosterEntry} className="mt-6">
        <input type="hidden" name="id" value={entry.id} />

        <div className="rounded-[var(--radius-feature)] border border-line bg-surface p-4">
          <p className="t-card-title text-ink">Who they are</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Text name="name" defaultValue={entry.name} />
            </Field>
            <Field
              label="Role"
              hint="Their own headline, verbatim. Never a title written here. A job description under a real person's photograph is a claim about their employment."
            >
              <Text name="role" defaultValue={entry.role} placeholder="Staff AI engineer" />
            </Field>

            <Field label="Employer">
              <Text name="org_name" defaultValue={entry.org_name} placeholder="NVIDIA" />
            </Field>
            {isJudge ? (
              <Field label="Location">
                <Text name="location" defaultValue={entry.location} placeholder="Santa Clara, California" />
              </Field>
            ) : (
              <Field label="Their role at that employer" hint="Prints as “Co-founder, n-aible”.">
                <Text name="org_role" defaultValue={entry.org_role} placeholder="Co-founder" />
              </Field>
            )}

            {isJudge ? (
              <Field
                label="Summary"
                className="sm:col-span-2"
                hint="Shown on the card's hover face. Assembled from their own profile and nothing else: no assessment of them, no adjective they did not write."
              >
                <Area name="summary" defaultValue={entry.summary} rows={3} />
              </Field>
            ) : (
              <>
                <Field
                  label="Detail"
                  className="sm:col-span-2"
                  hint="A sentence about what they do. Blank renders nothing, which is correct when nobody has supplied one."
                >
                  <Area name="detail" defaultValue={entry.detail} rows={3} />
                </Field>
                <Field label="Records" hint="What they teach. Leave blank until somebody confirms it.">
                  <Text name="scope" defaultValue={entry.scope} placeholder="All five courses" />
                </Field>
                <Field label="Employer site">
                  <Text name="org_url" defaultValue={entry.org_url} placeholder="https://…" />
                </Field>
              </>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------ pictures */}
        <div className="mt-4 rounded-[var(--radius-feature)] border border-line bg-surface p-4">
          <p className="t-card-title text-ink">Portrait and mark</p>
          <p className="t-meta mt-1 max-w-[64ch] text-ink-muted">
            Upload straight from here. A card cannot be published without a portrait: an empty
            frame on the roster reads as a broken page.
          </p>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <ImageField
              label="Portrait"
              name="photo_file"
              pathName="photo_src"
              current={entry.photo_src}
              round
              hint="PNG, JPEG or WebP, under 2MB. A card cannot be published without one."
            />
            <ImageField
              label="Employer mark"
              name="logo_file"
              pathName="logo_src"
              current={entry.logo_src}
              hint="Their employer's own file, SVG or PNG. Leave empty if they publish none."
            />

            <Field label="Portrait alt" hint="Describes the picture. Blank falls back to their name.">
              <Text name="photo_alt" defaultValue={entry.photo_alt} placeholder="Studio portrait of Liz Zhang" />
            </Field>
            <Field label="Mark alt">
              <Text name="logo_alt" defaultValue={entry.logo_alt} placeholder="NVIDIA" />
            </Field>

            {isJudge ? (
              <Field
                label="Wordmark"
                className="sm:col-span-2"
                hint="For an employer that publishes no logo file at all: their name set in type, rather than a mark invented for them."
              >
                <Text name="wordmark" defaultValue={entry.wordmark} placeholder="a1mobile" />
              </Field>
            ) : null}
          </div>
        </div>

        {/* --------------------------------------------------------- links */}
        <div className="mt-4 rounded-[var(--radius-feature)] border border-line bg-surface p-4">
          <p className="t-card-title text-ink">Links and colour</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="LinkedIn" hint="The full profile URL. Every card links out to it.">
              <Text name="linkedin" defaultValue={entry.linkedin} placeholder="https://www.linkedin.com/in/…" />
            </Field>
            <div className="sm:col-span-2">
              <GroundPicker name="ground" value={entry.ground} />
            </div>
            {!isJudge ? (
              <>
                <Field label="Second link, label">
                  <Text name="site_label" defaultValue={entry.site_label} placeholder="roanweigert.com" />
                </Field>
                <Field label="Second link, URL">
                  <Text name="site_href" defaultValue={entry.site_href} placeholder="https://…" />
                </Field>
              </>
            ) : null}
          </div>
        </div>

        {/* ------------------------------------------------- account and seat */}
        {/*
          INSIDE THE FORM, and drawn like every other field group on the page.

          Roan: "on 'the account this card belongs to' put inside the form, no need to
          be highlighted."

          These were two separate `<section>` elements below the form, each wrapping
          its own `<form>` with its own action and its own button, and each on a tinted
          ground. Three saves on one screen and two of them looking like warnings, for
          what is a select and a select.

          HTML cannot nest forms, so "inside the form" meant merging the actions:
          `saveRosterEntry` writes `user_id` and `seat_id` now, and `bindRosterUser`
          and `setRosterSeat` are gone. That file has the note on what did NOT change,
          which is what either field means: linking an account grants no role and
          assigning a seat is only the public claim.
        */}
        <div className="mt-4 rounded-[var(--radius-feature)] border border-line bg-surface p-4">
          <p className="t-card-title text-ink">Account and seat</p>
          <p className="t-meta mt-1 max-w-[64ch] text-ink-muted">
            Both optional, and neither grants anything. Roles are granted on{" "}
            <Link href="/admin/people" className="text-accent no-underline hover:underline">
              People
            </Link>
            , and what actually lets a judge open their console is a seat bound to their
            account on{" "}
            <Link href="/admin/judging" className="text-accent no-underline hover:underline">
              Judging
            </Link>
            .
          </p>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field
              label="Linked account"
              hint="Says the person on the website and the person with this account are the same human being. It is what lets their console know which card is theirs."
            >
              <select
                name="userId"
                defaultValue={entry.user_id ?? ""}
                className="t-body-sm mt-1 h-10 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              >
                <option value="">Nobody</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {[person.first_name, person.last_name].filter(Boolean).join(" ") ||
                      person.email}{" "}
                    · {person.email}
                  </option>
                ))}
              </select>
            </Field>

            {isJudge ? (
              <Field
                label="Board seat"
                hint="Which course this judge reads each term. It prints on their card on /review-judge-board. One seat, one holder."
              >
                <select
                  name="seatId"
                  defaultValue={entry.seat_id ?? ""}
                  className="t-body-sm mt-1 h-10 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                >
                  {/* "No seat yet", not "None". The board is still being seated and an
                      unassigned card is a normal state, not a blank. */}
                  <option value="">No seat yet</option>
                  {seats.map((seat) => (
                    <option key={seat.id} value={seat.id}>
                      {seat.seat} ·{" "}
                      {seat.reads_all_courses || !seat.reviews_label
                        ? "Every course"
                        : seat.reviews_label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          <Save>Save this card</Save>
        </div>
      </ActionForm>

      {/* ------------------------------------------------------ lead, then delete */}
      {!isJudge && !entry.lead ? (
        <form action={setRosterLead} className="mt-6">
          <input type="hidden" name="id" value={entry.id} />
          <Quiet title="Make this the lead instructor: the wide card, first on the roster">
            <StarIcon size={13} aria-hidden="true" />
            Make this the lead instructor
          </Quiet>
        </form>
      ) : null}

      <form action={deleteRosterEntry} className="mt-6 border-t border-line pt-6">
        <input type="hidden" name="id" value={entry.id} />
        <Danger title="Removes this person from the roster entirely. Unpublishing is usually what you want instead.">
          Delete {entry.name}
        </Danger>
      </form>
    </>
  );
}
