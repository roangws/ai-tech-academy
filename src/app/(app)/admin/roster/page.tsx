import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  LinkSimpleIcon,
  PlusIcon,
  StarIcon,
} from "@phosphor-icons/react/dist/ssr";
import { StatusChip } from "@/components/ui";
import { ActionForm, Field, Save, Quiet, Text } from "@/components/lms/admin-form";
import { getRoster, type RosterEntry } from "@/lib/roster";
import { createRosterEntry, moveRosterEntry, setRosterStatus } from "@/app/actions/roster";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Instructors and judges",
  robots: { index: false, follow: false },
};

/**
 * The two public rosters, from the authoring side.
 *
 * ------------------------------------------------------------------- why it exists
 *
 * Roan's report: "I have a list of the judges already that are on the website,
 * but they're not in here." Both halves of that were true and the second was the
 * problem. `/instructors` and `/review-judge-board` were rendering five people
 * each, and the console that runs the school had no page that admitted either
 * list existed — because both were `as const` arrays in `content.ts`, and adding
 * a judge was a commit and a deploy.
 *
 * They are rows now. This is where they are edited.
 *
 * --------------------------------------------------------- one page, two lists
 *
 * Instructors and judges are separate sections here rather than separate routes,
 * because the job somebody comes to this page to do is usually about one person
 * and they do not always know which list that person is on. Two tabs would make
 * "is Liz on the site yet" a two-page question.
 *
 * ------------------------------------------------------------ draft and bound
 *
 * Two states, and they answer different questions — the same split the catalogue
 * makes, for the same reason.
 *
 * `status` is whether this card is on the public page. A new entry is a draft,
 * so somebody's half-typed name and a missing portrait are never live while they
 * are being typed. Publishing checks there is a portrait first.
 *
 * `user_id` is whether this person has an account in the product. It is
 * deliberately NOT a role grant — see the note at the head of
 * `app/actions/roster.ts` — because publishing a judge's photograph and handing
 * them read access to learners' submitted work are two different decisions, and
 * one button doing both means the only way to put a judge on the website is to
 * give them the console.
 */
export default async function AdminRoster() {
  const roster = await getRoster();
  const instructors = roster.filter((r) => r.kind === "instructor");
  const judges = roster.filter((r) => r.kind === "judge");

  return (
    <>
      <h1 className="t-h2 text-ink">Instructors and judges</h1>
      <p className="t-body-sm mt-1.5 max-w-[64ch] text-ink-secondary">
        The two rosters the website shows. A new entry starts as a draft — invisible on
        /instructors and /review-judge-board — so a card can be written before anyone sees it.
        Linking an account is separate from granting a role.
      </p>

      {/* ------------------------------------------------------------- new */}
      <ActionForm
        action={createRosterEntry}
        className="mt-6 rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-4"
      >
        <p className="t-card-title text-ink">Add somebody</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px_180px_auto] sm:items-end">
          <Field label="Name" hint="Everything else is filled in on the next screen.">
            <Text name="name" placeholder="Liz Zhang" />
          </Field>
          <Field label="Roster">
            <select
              name="kind"
              defaultValue="judge"
              className="t-body-sm mt-1 h-10 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            >
              <option value="judge">Judge</option>
              <option value="instructor">Instructor</option>
            </select>
          </Field>
          <Field label="Id (optional)" hint="Built from the name when blank.">
            <Text name="id" placeholder="liz-zhang" />
          </Field>
          <Save>
            <PlusIcon size={15} weight="bold" aria-hidden="true" />
            Add as draft
          </Save>
        </div>
      </ActionForm>

      <RosterList
        title="Instructors"
        blurb="Shown on /instructors and in the homepage band. The lead writes the curriculum and gets the wide card."
        entries={instructors}
      />
      <RosterList
        title="Judges"
        blurb="Shown on /review-judge-board and in the homepage rail."
        entries={judges}
      />
    </>
  );
}

function RosterList({
  title,
  blurb,
  entries,
}: {
  title: string;
  blurb: string;
  entries: RosterEntry[];
}) {
  return (
    <section aria-labelledby={`roster-${title}`} className="mt-8">
      <h2 id={`roster-${title}`} className="t-h3 text-ink">
        {title}
      </h2>
      <p className="t-meta mt-1 max-w-[64ch] text-ink-muted">{blurb}</p>

      {entries.length === 0 ? (
        <p className="t-body-sm mt-4 rounded-[var(--radius-card)] border border-dashed border-line-control bg-surface-subtle p-4 text-ink-secondary">
          Nobody on this roster yet. The public page renders nothing rather than an empty grid.
        </p>
      ) : null}

      <ul className="mt-4 flex flex-col gap-2">
        {entries.map((entry, i) => (
          <li
            key={entry.id}
            style={{ borderLeftColor: entry.ground }}
            className="rounded-[var(--radius-card)] border border-line border-l-[3px] bg-surface p-3"
          >
            <div className="flex flex-wrap items-center gap-3">
              {/*
                The portrait, at the size the console needs to recognise a face
                and no larger. A plain `<Image>` with a fixed box: these are
                repo-local files under /images/people, so next/image can reason
                about them, unlike the avatars in `lms/avatar.tsx`.

                A missing one draws an empty ring rather than a placeholder,
                which is the console's way of showing what publishing will
                refuse — `setRosterStatus` will not publish a card with no
                portrait.
              */}
              <span className="relative block size-10 flex-none overflow-hidden rounded-full bg-surface-sunken ring-1 ring-line">
                {entry.photo_src ? (
                  <Image
                    src={entry.photo_src}
                    alt=""
                    width={80}
                    height={80}
                    className="size-full object-cover"
                  />
                ) : null}
              </span>

              <Link href={`/admin/roster/${entry.id}`} className="min-w-0 flex-1 no-underline">
                <span className="t-card-title block text-ink">{entry.name}</span>
                <span className="t-meta mt-0.5 block clamp-1 text-ink-muted">
                  {[entry.role, entry.org_name].filter(Boolean).join(" · ") || "No role yet"}
                </span>
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                {entry.lead ? (
                  <span className="t-meta inline-flex min-h-[32px] items-center gap-1.5 rounded-[var(--radius-control)] border border-accent px-2 text-accent">
                    <StarIcon size={12} weight="fill" aria-hidden="true" />
                    Lead
                  </span>
                ) : null}

                {/* Whether this card is somebody's account. The console's
                    shorthand for the whole point of the table. */}
                {entry.user_id ? (
                  <span
                    title="Linked to an account"
                    className="t-meta inline-flex min-h-[32px] items-center gap-1.5 rounded-[var(--radius-control)] border border-line-control px-2 text-ink-secondary"
                  >
                    <LinkSimpleIcon size={12} aria-hidden="true" />
                    Linked
                  </span>
                ) : null}

                {/* `ActionForm` on both, so a refused publish — a card with no
                    portrait — prints its reason on this row rather than throwing
                    the whole page away. */}
                {entry.status === "published" ? (
                  <ActionForm action={setRosterStatus}>
                    <input type="hidden" name="id" value={entry.id} />
                    <input type="hidden" name="status" value="draft" />
                    <button type="submit" className="border-0 bg-transparent p-0">
                      <StatusChip open>Live</StatusChip>
                    </button>
                  </ActionForm>
                ) : (
                  <ActionForm action={setRosterStatus}>
                    <input type="hidden" name="id" value={entry.id} />
                    <input type="hidden" name="status" value="published" />
                    <Quiet title="Put this card on the public page">Publish</Quiet>
                  </ActionForm>
                )}

                {/* Order is what the public grid prints, so it is edited where
                    the order is visible. Rendered only where the move exists,
                    like the catalogue's — a disabled arrow on the first row is a
                    control that says no. */}
                <form action={moveRosterEntry} className="flex gap-1">
                  <input type="hidden" name="id" value={entry.id} />
                  <input type="hidden" name="direction" value="up" />
                  {i > 0 ? (
                    <Quiet ariaLabel={`Move ${entry.name} up`}>
                      <ArrowUpIcon size={13} aria-hidden="true" />
                    </Quiet>
                  ) : null}
                </form>
                <form action={moveRosterEntry} className="flex gap-1">
                  <input type="hidden" name="id" value={entry.id} />
                  <input type="hidden" name="direction" value="down" />
                  {i < entries.length - 1 ? (
                    <Quiet ariaLabel={`Move ${entry.name} down`}>
                      <ArrowDownIcon size={13} aria-hidden="true" />
                    </Quiet>
                  ) : null}
                </form>

                <Link
                  href={`/admin/roster/${entry.id}`}
                  className="t-meta inline-flex min-h-[32px] items-center gap-1.5 rounded-[var(--radius-control)] border border-line-control px-2.5 text-ink-secondary no-underline transition-colors hover:border-accent hover:text-accent"
                >
                  Edit
                  <ArrowRightIcon size={12} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
