import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowSquareOutIcon, StarIcon } from "@phosphor-icons/react/dist/ssr";
import { StatusChip } from "@/components/ui";
import { ActionForm, Area, Field, Save, Quiet, Danger, Text } from "@/components/lms/admin-form";
import { getRosterEntry } from "@/lib/roster";
import { listPeople } from "@/lib/lms/admin";
import {
  bindRosterUser,
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
              hint="Their own headline, verbatim. Never a title written here — a job description under a real person's photograph is a claim about their employment."
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
                hint="Shown on the card's hover face. Assembled from their own profile and nothing else — no assessment of them, no adjective they did not write."
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
            Paths under <code>/public</code>, not URLs. A card cannot be published without a
            portrait: an empty frame on the roster reads as a broken page.
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-[80px_minmax(0,1fr)]">
            <span className="relative block size-20 overflow-hidden rounded-full bg-surface-sunken ring-1 ring-line">
              {entry.photo_src ? (
                <Image
                  src={entry.photo_src}
                  alt=""
                  width={160}
                  height={160}
                  className="size-full object-cover"
                />
              ) : null}
            </span>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Portrait path">
                <Text name="photo_src" defaultValue={entry.photo_src} placeholder="/images/people/liz-zhang.jpg" />
              </Field>
              <Field label="Portrait alt" hint="Describes the picture. Blank falls back to their name.">
                <Text name="photo_alt" defaultValue={entry.photo_alt} placeholder="Studio portrait of Liz Zhang" />
              </Field>
              <Field label="Employer mark path">
                <Text name="logo_src" defaultValue={entry.logo_src} placeholder="/images/logos/nvidia.svg" />
              </Field>
              <Field label="Mark alt">
                <Text name="logo_alt" defaultValue={entry.logo_alt} placeholder="NVIDIA" />
              </Field>
              {isJudge ? (
                <Field
                  label="Wordmark"
                  className="sm:col-span-2"
                  hint="For an employer that publishes no logo file at all — their name set in type, rather than a mark invented for them."
                >
                  <Text name="wordmark" defaultValue={entry.wordmark} placeholder="a1mobile" />
                </Field>
              ) : null}
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------- links */}
        <div className="mt-4 rounded-[var(--radius-feature)] border border-line bg-surface p-4">
          <p className="t-card-title text-ink">Links and colour</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="LinkedIn" hint="The full profile URL. Every card links out to it.">
              <Text name="linkedin" defaultValue={entry.linkedin} placeholder="https://www.linkedin.com/in/…" />
            </Field>
            <Field
              label="Ground"
              hint="A hue token from globals.css: var(--accent), var(--path-a) … var(--path-e)."
            >
              <Text name="ground" defaultValue={entry.ground} placeholder="var(--path-a)" />
            </Field>
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

        <div className="mt-4">
          <Save>Save this card</Save>
        </div>
      </ActionForm>

      {/* ----------------------------------------------------- the account */}
      <section aria-labelledby="bind" className="mt-8 rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-4">
        <h2 id="bind" className="t-card-title text-ink">
          The account this card belongs to
        </h2>
        <p className="t-body-sm mt-1.5 max-w-[64ch] text-ink-secondary">
          Optional, and it grants nothing. Linking says the person on the website and the person
          with this account are the same human being — it is what lets their console know which
          card is theirs. Roles are granted on{" "}
          <Link href="/admin/people" className="text-accent no-underline hover:underline">
            People
          </Link>
          , and a judge seat is bound on{" "}
          <Link href="/admin/judging" className="text-accent no-underline hover:underline">
            Judging
          </Link>
          .
        </p>

        <form action={bindRosterUser} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={entry.id} />
          <label className="min-w-[260px] flex-1">
            <span className="t-label text-ink-muted">Account</span>
            <select
              name="userId"
              defaultValue={entry.user_id ?? ""}
              className="t-body-sm mt-1 h-10 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            >
              <option value="">Nobody</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email} · {p.email}
                </option>
              ))}
            </select>
          </label>
          <Quiet>Link</Quiet>
        </form>
      </section>

      {/* ------------------------------------------------------ lead, then delete */}
      {!isJudge && !entry.lead ? (
        <form action={setRosterLead} className="mt-6">
          <input type="hidden" name="id" value={entry.id} />
          <Quiet title="Make this the lead instructor — the wide card, first on the roster">
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
