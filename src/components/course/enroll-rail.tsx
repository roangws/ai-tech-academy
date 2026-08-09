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

          {/* The page's one filled accent control. */}
          <div className="mt-4">
            <EnrollButton withDate href="/sign-up" className="w-full" />
          </div>

          {/*
            THE LINE THAT MAKES THE PROMISE REACHABLE.

            "Module 1 opens with no account" is stated above, on the catalog, on
            the homepage, in the FAQ and on the auth panel — and until this link
            existed there was no way to act on it. Every CTA on the site pointed
            at /sign-up; a grep for `/learn` outside the app group returned
            nothing. A reader who wanted the free module could only get it by
            typing the URL, which made the gate, the locked panel and the whole
            access model unreachable copy.

            A text action rather than a second button, deliberately. The argument
            in EnrollButton — that one label has to mean one thing, and "Enroll
            for free" starts the account everywhere — is right, and this does not
            touch it. The primary control still opens an account; this is the
            secondary path for somebody who wants to look first, which is exactly
            what the free module is for.
          */}
          <p className="t-meta mt-2.5 text-center">
            <TextAction href={`/learn/${course.slug}`}>
              or start module 1 without one
            </TextAction>
          </p>

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
