import Link from "next/link";
import { ButtonLink, CheckList, Panel, Section, SectionHeader } from "@/components/ui";
import type { ApplyTrack } from "@/lib/content";

/**
 * The application band, rendered once at the foot of /instructors and once at
 * the foot of /review-judge-board.
 *
 * ------------------------------------------------------------- two sections
 *
 * The offer, then how it works, in that order and as two separate bands. That
 * split is Roan's instruction and it is also the right shape: the first band has
 * one job, which is to state what is open and give a reader the control that
 * starts it, and burying a control under four hundred words of process is how a
 * page collects readers who never find the button. Everything that qualifies the
 * offer sits below it, where somebody who has decided to keep reading is.
 *
 * ------------------------------------------------ the same component, twice
 *
 * One component taking a track, rather than two hand-written bands. The two
 * tracks differ in every sentence and in nothing structural, and the failure
 * mode of two copies is not that they look different: it is that one of them
 * silently loses a section six months from now and nobody notices, because
 * nobody reads both pages in one sitting.
 *
 * `seats` is the one genuinely optional slot. The instructor track publishes a
 * number and the judge track does not, which is a decision recorded in
 * content.ts rather than an accident, so the chip renders or it does not.
 *
 * -------------------------------------------------------------- the gate
 *
 * The CTA points straight at `/apply/<track>`, which lives under `(app)` and
 * calls `requireUser`. So a signed-out reader is sent to `/sign-in?next=...` and
 * arrives at the form the moment they have an account, and a signed-in reader
 * goes directly to it. There is no separate "sign up first" step to keep in sync
 * with the auth routes, and the button says what it does rather than what has to
 * happen first.
 */
export function ApplyBand({ track }: { track: ApplyTrack }) {
  const headingId = `apply-${track.id}-heading`;
  const stepsId = `apply-${track.id}-steps`;

  return (
    <>
      {/* ------------------------------------------------------- the offer */}
      <Section tint id="apply" ariaLabelledBy={headingId}>
        {/*
          Two columns from lg, and the reason is measured rather than stylistic.
          The prose in this panel is capped at the site's 62ch measure, which at
          1216px leaves roughly 550px of empty ink to the right of it: the widest
          single block of nothing on either page. Moving the controls into that
          space fills it with the thing the panel exists to get pressed, and it
          is the arrangement the instructor lead card already uses one section up
          — the facts on the left, the ways out on the right.

          Stacked below lg, where the column would be too narrow to hold a
          48px control and a sentence beside it.
        */}
        <Panel tone="dark">
          <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              <p className="t-label text-white/60">{track.label}</p>

              <h2 id={headingId} className="t-h2 mt-2 text-white [text-wrap:balance]">
                {track.headline}
              </h2>

              <p className="t-body mt-3 max-w-[62ch] text-white/80">{track.intro}</p>

              {/* The reason it is hard, on its own rule, because it is the
                  paragraph a serious applicant is actually reading and the one
                  an unserious one should be stopped by. */}
              <p className="t-body mt-5 max-w-[62ch] border-t border-white/15 pt-5 text-white/75">
                {track.scarcity}
              </p>
            </div>

            {/* A rule between the columns at lg, and a rule above the block when
                it is stacked, so the controls read as a separate object from the
                argument either way round. */}
            <div className="flex flex-col justify-center border-t border-white/15 pt-7 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              {/*
                The count, as a chip rather than as a clause in the headline.

                A numeral written into prose is a numeral that has to be edited by
                hand the day it changes, and a headline is the worst place on a
                page to leave a stale one. As a chip it is visibly a piece of
                current state, which is what it is.
              */}
              {track.seats ? (
                <span className="t-label inline-flex h-6 w-fit items-center rounded-full bg-white/12 px-2.5 text-white ring-1 ring-inset ring-white/20">
                  {track.seats}
                </span>
              ) : null}

              <ButtonLink href={track.href} tone="onDark" className={track.seats ? "mt-4" : ""}>
                {track.cta}
              </ButtonLink>

              {/*
                The same destination, said the other way round.

                The page behind it knows whether there is a draft, a submitted
                application or nothing at all, and shows the right one. A reader
                who has already started has no way to guess that from a button
                labelled "Apply", so the second affordance is a sentence rather
                than a second route.
              */}
              <Link
                href={track.href}
                className="t-button mt-4 w-fit text-white/75 no-underline underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                {track.resume}
              </Link>

              <p className="t-micro mt-4 text-white/55">{track.note}</p>
            </div>
          </div>
        </Panel>
      </Section>

      {/* --------------------------------------------------- how it works */}
      <Section id="how-it-works" ariaLabelledBy={stepsId}>
        <SectionHeader
          id={stepsId}
          label="How it works"
          heading="Three steps, and the board reads the third one"
          intro="The first half of an application is public information about you. The second half is not, which is why it is finished inside your account rather than in a form on this page."
        />

        {/*
          A real `<ol>`. These are steps in a sequence, the numbers are part of
          the content rather than decoration, and a screen reader announcing
          "list of three items" and then "1 of 3" is the whole affordance for
          free. The visible numerals are `aria-hidden` so the position is not
          read out twice.
        */}
        <ol className="grid gap-4 md:grid-cols-3">
          {track.steps.map((step) => (
            <li
              key={step.n}
              className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5"
            >
              <span
                aria-hidden="true"
                className="t-label grid size-8 flex-none place-items-center rounded-full bg-accent-tint text-accent"
              >
                {step.n}
              </span>
              <p className="t-card-title mt-3.5 text-ink">{step.title}</p>
              <p className="t-body-sm mt-1.5 text-ink-secondary">{step.body}</p>
            </li>
          ))}
        </ol>

        {/*
          The bar and the cost, side by side and at equal weight.

          Deliberately not one list of ten. They answer two different questions
          that a reader asks in a fixed order — can I get in, and do I want to —
          and running them together lets somebody skim the first four items and
          never reach the fact that a seat is eight modules of recording.
        */}
        <div className="mt-10 grid gap-8 border-t border-line pt-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h3 className="t-h3 text-ink">What the board looks for</h3>
            <p className="t-body-sm mt-2 max-w-[52ch] text-ink-secondary">
              Every one of these is something a stranger can verify without taking your
              word for it, which is the standard the rest of this site holds itself to.
            </p>
            <CheckList className="mt-5" items={track.bar} />
          </div>

          <div>
            <h3 className="t-h3 text-ink">What it asks of you</h3>
            <p className="t-body-sm mt-2 max-w-[52ch] text-ink-secondary">
              Stated before you apply rather than after you are accepted. It is a
              commitment across a term, not a credit line.
            </p>
            <CheckList className="mt-5" items={track.asked} />
          </div>
        </div>
      </Section>
    </>
  );
}
