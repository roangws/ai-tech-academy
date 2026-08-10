import Link from "next/link";
import {
  ClipboardTextIcon,
  FlaskIcon,
  IdentificationBadgeIcon,
  PlayCircleIcon,
  SealCheckIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { VideoPlayer } from "@/components/video-player";
import { EnrollButton, TextAction } from "@/components/ui";
import { TrustSeal } from "@/components/trust-seal";
import { moduleFormat, type Course } from "@/lib/content";

/**
 * The reference's purchase card, with every commerce slot replaced by a fact.
 *
 * ------------------------------------------------------------------- THE SWAPS
 *
 * Slot by slot, since the geometry is copied and the content is not:
 *
 *   video preview            -> the same, VideoPlayer unmodified
 *   $18.99 struck from $79.99 -> "Free", and one line saying what that opens
 *   "76% off"                 -> gone
 *   "10 hours left at this price!" -> gone, and this is the important one
 *   Add to cart / Buy now     -> one Enroll control
 *   30-Day Money-Back Guarantee -> what a free account actually does for you
 *   "This course includes"    -> the same, from moduleFormat.includes
 *   Share / Gift / Apply Coupon -> one link to the teams section
 *
 * The scarcity line has no honest occupant and is therefore absent rather than
 * substituted. Module 1 opens at the same price forever, so any countdown here
 * would be a fabrication, and a softened version ("enrolling now") is the same
 * fabrication with better manners. Two slots came out and the card is shorter for
 * it, which is the correct outcome.
 *
 * "Free" runs at `t-h3`, 20px. The reference sets its price at 32 and it is the
 * loudest thing on the page. Free is the easiest fact in this whole card to
 * believe and it is already stated in the hero's stat bar 200px above, so
 * shouting it a second time spends height on agreement. What a reader does not
 * know is what free gets them, and that is the line under it.
 *
 * --------------------------------------------------------------------- STICKY
 *
 * `lg:sticky lg:top-[88px]`. 88 is the 72px header plus 16 of air, and it is the
 * same constant site-header.tsx uses as the line under the chrome for its own
 * section tracking, so the rail's resting edge and the nav's read-line agree.
 *
 * Two things silently kill this and both are one word: any ancestor with
 * `overflow` other than visible, which rules out putting this inside a `Panel`,
 * and `items-start` on the parent grid, which stops the `<aside>` stretching and
 * so removes the tall area this sticks within. The grid in the page file carries
 * the same warning.
 */
export function EnrollRail({ course }: { course: Course }) {
  return (
    <div className="lg:sticky lg:top-[88px]">
      {/* `border border-line shadow-e1`, per DESIGN-SPEC.md §2, which is what this
          has always been. It spent an hour on `shadow-e3` and a ring to match the
          stat bar; both went back when the token turned out to be one the spec
          forbids on a card by name. The note in course/hero.tsx has it. */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-e1">
        {course.preview ? (
          <VideoPlayer
            src={course.preview.src}
            poster={course.preview.poster}
            posterAlt={course.preview.posterAlt}
            card={course.preview.card}
          />
        ) : null}

        <div className="p-5">
          <p className="t-h3 text-ink">Free</p>
          <p className="t-meta mt-1 text-ink-muted">Module 1 opens with no account</p>

          {/*
            THE PAGE'S ONE FILLED ACCENT CONTROL, AND IT OPENS A LESSON.

            `href` is this course's own `/courses/<slug>/start`: one GET and a 303
            into a real lesson. It works signed out, because module 1 does; it
            enrols and resumes for somebody signed in; and it is a URL, so the
            sign-up link below can carry it as `next` and finish an account inside
            the lesson instead of on a dashboard.

            That replaced `/sign-up`, which was the single highest-friction
            decision on the site: a reader who had read this whole page, decided,
            and reached for the one obvious control was answered with an account
            form, and after the form a dashboard, which is a list of courses shown
            to somebody who has just picked one.

            ------------------------------------------------- the label, and the date

            "Enroll for free", with the date under it, restored 9 Aug on Roan's
            instruction: "all the cta on /courses/applied-ai-for-gtm-teams has to
            be 'Enroll for free / Starts <today>'".

            It spent a pass on `cta.start` — "Start the course" — on the argument
            recorded in content.ts: a reader on a course page has already chosen, so
            the label should say what the control does rather than offer them a list
            to join. That argument was about a button that opened an account form,
            and it stopped applying the moment every other instance of "Enroll for
            free" on the site started opening a lesson too. One label for one act,
            and it is the same act everywhere now.

            The date came off in the same pass, as "a countdown to a press that has
            already happened". That reads well and is wrong about who is looking:
            this is the control a reader meets while still deciding, and it is the
            only line on the card saying there is no cohort to wait for.

            `EnrollButton`, not `ButtonLink` with a hand-written second line — that
            component owns the two-line geometry, the released fixed height and the
            contrast-checked subtitle, and a second spelling of it drifts.
          */}
          <div className="mt-4">
            <EnrollButton
              withDate
              href={`/courses/${course.slug}/start`}
              className="w-full"
            />
          </div>

          {/* The trustmark, directly under the enrol control, which is the slot the
              reference card spends on a payment-method row. It is the one place on this
              page a reader is deciding whether to trust the site rather than the
              course. trust-seal.tsx has the note. */}
          <div className="mt-3 flex justify-center">
            <TrustSeal />
          </div>

          {/* The account, offered second and as a reason rather than as a gate.
              This is where "Enroll for free" belongs on this page: after the
              reader has been told they do not need it. */}
          <p className="t-meta mt-2.5 text-center text-ink-muted">
            No account needed to begin.{" "}
            <Link
              href={`/sign-up?next=${encodeURIComponent(`/courses/${course.slug}/start`)}`}
              className="text-accent no-underline hover:underline"
            >
              Create one
            </Link>{" "}
            to save your progress.
          </p>

          {/*
            "or start module 1 without one" was here and is gone on Roan's
            instruction. The card asks one thing now. The free first module is
            still reachable, from the curriculum's own call to action further
            down the page, which is where a reader who wants to look first is
            already heading.
          */}

          {/*
            "A free account keeps your work and opens modules 2 to 8" was here,
            under the button, and it is gone on Roan's instruction.

            It was the third statement of the access model inside one card. The
            price line says "Free", the line under it says "Module 1 opens with
            no account", and this said the same fact a third time with a module
            number in it. The button is the thing a reader is deciding about and
            it had two lines of qualification stacked beneath it.

            The module count it printed was derived from `curriculum`, so nothing
            is now going stale by being deleted — there is no hand-kept number
            left behind.
          */}
          <div className="mt-5 border-t border-line pt-4">
            <p className="t-field text-ink-muted">{moduleFormat.includesLabel}</p>
            <ul className="mt-2.5">
              {moduleFormat.includes.map((item, i) => {
                const Glyph = glyphs[i] ?? SealCheckIcon;
                return (
                  <li key={item} className="flex items-start gap-2.5 py-1.5">
                    {/* `aria-hidden`, like every other decorative glyph in this
                        fold. Without it the AX tree announced five nameless
                        images inside this card. */}
                    <Glyph
                      size={16}
                      aria-hidden="true"
                      className="mt-0.5 flex-none text-ink-muted"
                    />
                    <span className="t-body-sm text-ink-secondary">{item}</span>
                  </li>
                );
              })}
            </ul>

            {/* Under the list rather than in it. The rows above are what a module
                contains and this happens once, for the course, after the eighth
                one — so it sat in "Every module includes" saying something that
                was not true of every module. The rule and the badge glyph keep it
                attached to the list without being a sixth row of it. */}
            <p className="mt-3 flex items-start gap-2.5 border-t border-line pt-3">
              <IdentificationBadgeIcon
                size={16}
                aria-hidden="true"
                className="mt-0.5 flex-none text-ink-muted"
              />
              <span className="t-body-sm text-ink">{moduleFormat.completion}</span>
            </p>
          </div>

          <div className="mt-3 border-t border-line pt-2">
            <TextAction href="/#teams">Run this course with your team</TextAction>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * One glyph per includes row, in the order the rows are written.
 *
 * Monochrome and at one size, per the icon rule in DESIGN-SPEC.md: no duotone, no
 * coloured tiles, no gradient chips. They are positional rather than keyed by
 * string, because the copy in content.ts should be editable without coming here.
 */
const glyphs: readonly Icon[] = [
  PlayCircleIcon,
  FlaskIcon,
  ClipboardTextIcon,
  SealCheckIcon,
  IdentificationBadgeIcon,
  UsersThreeIcon,
];
