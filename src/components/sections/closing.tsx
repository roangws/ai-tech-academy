import { ArrowRightIcon, PlayCircleIcon, SquaresFourIcon, UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { EnrollButton, Panel, Section } from "@/components/ui";
import { closing } from "@/lib/content";

/**
 * The close, as one inset dark panel. This was two sections.
 *
 * "Three ways to begin" was three tiles on white whose first tile read "Watch
 * the open module / 14 minutes, open to everyone", and the section immediately
 * below it opened "Module 1 is open. It takes 14 minutes." The same fourteen
 * minutes, twice, 200px apart, on two grounds, under two headings. Whichever of
 * the two a reader stopped at, the other one was the page repeating itself at
 * the exact moment it was asking for a decision.
 *
 * So the decision takes the left column and the three routes take the right, in
 * the panel shape the teams section introduced 1,400px above. Two panels is
 * what makes it a shape rather than a one-off, and it puts the page's darkest
 * ground under its single most important control, which is the arrangement
 * every one of the reference captures uses to close a band.
 *
 * The first route no longer restates the headline's duration. It carries the
 * one thing the headline does not say, which is what watching costs: nothing,
 * and no account.
 *
 * The button stays white on ink. The accent lock reserves the saturated fill
 * for controls on light ground, and on this ground white is the primary.
 */
const glyphs: Record<string, Icon> = {
  module: PlayCircleIcon,
  courses: SquaresFourIcon,
  teams: UsersThreeIcon,
};

export function Closing() {
  /*
    `hairlineTop`, restored 7 Aug. The FAQ above was a tinted band, and a tint
    draws its own bottom rule, so asking for one here stacked two into a 2px
    line. The method merge pushed the FAQ back to white — its own note has the
    chain — so the only rule between two white bands is this one again.
  */
  return (
    <Section hairlineTop ariaLabelledBy="closing-heading">
      <Panel tone="dark">
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,470px)] lg:gap-14">
          <div>
            {/* 22ch, not 15. At 15 the headline broke as "Start free, in 14 /
                minutes", which splits a duration across two lines and leaves a
                widow that reads as a fragment. */}
            <h2 id="closing-heading" className="t-h2 max-w-[22ch] text-white">
              {closing.headline}
            </h2>
            <p className="t-body mt-3 max-w-[46ch] text-[#c3d2dc]">{closing.body}</p>

            {/* No arrow beside the label any more. The control carries two
                lines now, and a glyph vertically centred against a two-line
                block has no line of its own to sit on: it landed in the gutter
                between "Enroll for free" and the date under it. */}
            <EnrollButton withDate tone="onDark" className="mt-7" />

            <p className="t-meta mt-3 text-[#9db0bd]">{closing.reassurance}</p>
          </div>

          {/*
            The routes as rows rather than tiles. Three tiles side by side is
            what this block was before, and at this width inside a panel they
            would each be 140px of card holding two lines of text. Stacked, the
            titles share a left edge and the column reads as a list of
            destinations, which is what it is.
          */}
          <div>
            <p className="t-label text-white/60">{closing.routesLabel}</p>
            <ul className="mt-3 flex flex-col">
              {closing.routes.map((route) => {
                const Glyph = glyphs[route.id];
                return (
                  <li key={route.id} className="border-t border-white/18 last:border-b last:border-b-white/18">
                    <Link
                      href={route.href}
                      className="group flex items-center gap-4 py-4 no-underline"
                    >
                      {Glyph ? (
                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[var(--radius-control)] bg-white/10 text-white transition-colors group-hover:bg-white/[0.18]">
                          <Glyph size={20} weight="regular" aria-hidden="true" />
                        </span>
                      ) : null}

                      <span className="min-w-0 flex-1">
                        <span className="t-card-title block text-white group-hover:underline">
                          {route.title}
                        </span>
                        <span className="t-meta mt-0.5 block text-[#9db0bd]">{route.detail}</span>
                      </span>

                      <ArrowRightIcon
                        size={16}
                        weight="bold"
                        aria-hidden="true"
                        className="flex-none text-white/40 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-white"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Panel>
    </Section>
  );
}
