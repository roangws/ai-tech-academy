import type { ReactNode } from "react";
import Link from "next/link";
import { CheckIcon, LockSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { Panel, StatusChip } from "@/components/ui";

/**
 * The four things the LMS needed that the marketing site did not have.
 *
 * Everything else these pages render is already in components/ui/index.tsx —
 * Container, Section, Panel, SectionHeader, ButtonLink, StatusChip, FactsLine,
 * CheckList — and is imported rather than reimplemented. This file is only what
 * genuinely did not exist, because progress is a concept a brochure has no use
 * for.
 *
 * All four are server components. Nothing here holds state; a tick is a form
 * submission and a lock is a fact about the row.
 */

/* ------------------------------------------------------------------- meter */

/**
 * Progress, as a bar and as a sentence.
 *
 * `role="img"` with an `aria-label` rather than `role="progressbar"`. A
 * progressbar describes a task running right now — a file uploading — and
 * screen readers announce changes to it as they happen. This is a static fact
 * about a course, and announcing "17 percent" on every page load is noise.
 *
 * The number is also in the text beside it, so the label is a fallback rather
 * than the only way to get at it.
 */
export function Meter({
  done,
  total,
  label,
  className = "",
}: {
  done: number;
  total: number;
  label?: string;
  className?: string;
}) {
  /* Guard the divide: a course with no lessons yet is 0%, not NaN%. */
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="t-meta text-ink-muted">{label ?? `${done} of ${total} lessons`}</span>
        <span className="t-meta text-ink-secondary">{pct}%</span>
      </div>
      <div
        role="img"
        aria-label={`${done} of ${total} lessons complete, ${pct} percent`}
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- lock state */

/**
 * What a module row says about itself: open, locked, started, or done.
 *
 * ------------------------------------------------------------ green is a word
 *
 * `--state-open` means one thing on this site and DESIGN-SPEC.md says so
 * outright: "Green is semantic only: a module that is open with no signup… It is
 * never used for success decoration, checkmarks, or emphasis."
 *
 * The first version of this used green for "Done", with a tick in it — the
 * literal example the rule names. Worse, both chips render in the same column of
 * the same list, so green meant "you have finished this" on one row and "no
 * account needed" on the next. That is not a style violation, it is a colour
 * that stopped carrying information.
 *
 * So completion is the accent, which is what the rest of the site uses for
 * progress, and green stays with `access === "open"` — the same chip the public
 * curriculum accordion puts on module 01, so a reader who has seen one has
 * learned the other.
 */
export function ModuleState({
  locked,
  done,
  total,
  open,
}: {
  locked: boolean;
  done: number;
  total: number;
  /** True when the module needs no account. The only thing green may mean. */
  open?: boolean;
}) {
  if (locked) {
    return (
      <span className="t-label inline-flex h-6 items-center gap-1 rounded-full bg-surface-subtle px-2.5 text-ink-muted">
        <LockSimpleIcon size={11} weight="bold" aria-hidden="true" />
        Account
      </span>
    );
  }
  if (total > 0 && done === total) {
    return (
      <span className="t-label inline-flex h-6 items-center gap-1 rounded-full bg-accent-tint px-2.5 text-accent">
        <CheckIcon size={11} weight="bold" aria-hidden="true" />
        Done
      </span>
    );
  }
  if (done > 0) {
    return <StatusChip>{`${done}/${total}`}</StatusChip>;
  }
  return open ? <StatusChip open>Open</StatusChip> : <StatusChip>Not started</StatusChip>;
}

/* ------------------------------------------------------------- locked panel */

/**
 * What a signed-out reader gets instead of a locked module.
 *
 * It is a whole panel rather than a disabled row, because this is the moment the
 * site has been building towards on every other surface and the offer has to be
 * legible at it. The copy is the promise made everywhere else, in the same
 * words: one free account, every module after the first, every course, stays free.
 *
 * The lesson list is NOT rendered behind this. The gate runs on the server
 * before the module body is read, so a locked module's contents never reach the
 * browser to be revealed by deleting an attribute.
 */
export function LockedPanel({
  href,
  moduleName,
  /*
    The heading level is a prop for the same reason `SectionHeader` has one.

    This was a hardcoded `h2`, and it is the only heading on the locked-module
    page — which is the most-visited page on the site for a signed-out reader
    following the free-module funnel. So that page had no `h1` at all and its
    outline started at level 2: pressing `1` to jump to the page title found
    nothing, and `H` landed on a heading whose parent did not exist.
  */
  as: Heading = "h2",
}: {
  href: string;
  moduleName: string;
  as?: "h1" | "h2";
}) {
  return (
    <Panel tone="dark">
      <span className="t-label inline-flex items-center gap-1.5 text-white/60">
        <LockSimpleIcon size={13} weight="bold" aria-hidden="true" />
        Free account
      </span>
      <Heading className="t-h3 mt-2.5 text-white">{moduleName} opens with an account</Heading>
      <p className="t-body mt-3 max-w-[52ch] text-white/75">
        Module 1 of every course runs with no account, and you have it. One free account
        opens every module after the first, in all five courses, and the account stays free: no
        certificate fee, no upgrade, no paid tier.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          href={href}
          className="t-button inline-flex h-12 items-center rounded-[var(--radius-control)] bg-white px-6 text-ink no-underline transition-colors hover:bg-white/90"
        >
          Create your free account
        </Link>
        <Link
          href={href.replace("/sign-up", "/sign-in")}
          className="t-button text-white/75 no-underline underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          I already have one
        </Link>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------- empty */

/** The nothing-here state, used by the dashboard and both consoles. */
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-feature)] border border-dashed border-line bg-surface-subtle p-8 text-center md:p-12">
      <p className="t-card-title text-ink">{title}</p>
      <p className="t-body-sm mx-auto mt-2 max-w-[46ch] text-ink-secondary">{children}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
