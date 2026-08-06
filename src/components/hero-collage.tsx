"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowRightIcon, PlayIcon } from "@phosphor-icons/react";
import { Photo, PosterChip, StatusChip } from "@/components/ui";
import { hero } from "@/lib/content";

/**
 * The fold's image collage: overlapping frames, a floating lesson card and two
 * soft shapes behind them, entering on a stagger.
 *
 * Adapted from a collage hero pattern, not copied. Four things in that pattern
 * do not survive contact with this project and were rebuilt rather than
 * imported:
 *
 *   1. Three stock photographs became two real ones. There are four
 *      photographs on this site and the studio band carries three of them, so a
 *      third frame here would have spent the whole library in one viewport.
 *      content.ts has the note.
 *   2. The third tile is the lesson card. The fold's job is to hand a visitor
 *      the free lesson, and the pattern's third image is decoration; swapping
 *      one for the other keeps the composition and keeps the offer. The card
 *      overlaps the main frame's lower edge, which is the collage move.
 *   3. The floating shapes are `--accent-tint` and `--state-open-surface`, two
 *      tokens already on the page, rather than the pattern's blue and purple
 *      washes. Nothing here introduces a hue the design system does not have,
 *      and neither shape sits under text.
 *   4. Only this column animates. The pattern staggers its headline in too, and
 *      the headline is this page's LCP element: fading it in delays the largest
 *      paint by the length of the animation to buy an effect the visitor is
 *      looking straight at anyway. The text renders on the server, at once.
 *
 * `useReducedMotion` collapses both the entrance and the drift to nothing. The
 * global reduced-motion rule in globals.css only reaches CSS transitions, and
 * these are JS-driven, so the hook is doing real work rather than repeating it.
 */

const stack: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const still: Variants = { hidden: { opacity: 1 }, visible: { opacity: 1 } };

/** Frame treatment shared by both photographs: white mat, feature radius. */
const frame =
  "overflow-hidden rounded-[var(--radius-feature)] border border-line bg-surface p-1.5 shadow-e2";

export function HeroCollage() {
  const reduced = useReducedMotion();
  const item = reduced ? still : rise;

  /* One drift keyframe, offset per shape by its own delay so the two never
     crest together. Off entirely under reduced motion. */
  const drift = (delay: number) =>
    reduced
      ? undefined
      : {
          y: [0, -10, 0],
          transition: { duration: 7, repeat: Infinity, ease: "easeInOut" as const, delay },
        };

  return (
    <motion.div
      variants={stack}
      initial="hidden"
      animate="visible"
      /* `isolate` matters. Without a stacking context here, the shapes' negative
         z-index resolves against the root and they paint behind the page
         background, which is to say not at all. */
      className="relative isolate mx-auto w-full max-w-[496px] lg:mx-0"
    >
      {/* Shapes. Behind everything, aria-hidden, and clear of every text run. */}
      <motion.span
        aria-hidden="true"
        animate={drift(0)}
        className="pointer-events-none absolute -right-7 -top-9 z-0 h-44 w-44 rounded-full bg-accent-tint"
      />
      <motion.span
        aria-hidden="true"
        animate={drift(1.4)}
        className="pointer-events-none absolute -bottom-8 left-[18%] z-0 h-32 w-32 rounded-full bg-state-open-surface"
      />

      {/* Fixed heights per breakpoint. The tiles are absolutely positioned, so
          the box has to state its own height or it collapses to nothing. */}
      <div className="relative h-[404px] sm:h-[442px]">
        {/* Main frame. The whole tile is the link to the open module. */}
        <motion.div variants={item} className="absolute left-[7%] top-0 z-10 w-[81%]">
          <Link
            href="/paths/gtm/module-1"
            aria-label={`Watch ${hero.lesson.label}: ${hero.lesson.title}`}
            className={`group relative block no-underline ${frame}`}
          >
            <span className="relative block aspect-video overflow-hidden rounded-[10px] bg-surface-sunken">
              <Photo
                image={hero.lesson.poster}
                width={1280}
                height={720}
                priority
                sizes="(max-width: 1024px) 90vw, 430px"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white pl-0.5 shadow-e2 transition-transform duration-150 group-hover:scale-105">
                  <PlayIcon size={18} weight="fill" className="text-ink" />
                </span>
              </span>
              {/* Bottom left, not bottom right. The second frame overlaps this
                  frame's lower-right corner, so a chip there is read against a
                  card edge 12px away. */}
              <PosterChip className="absolute bottom-2.5 left-2.5">
                {hero.lesson.duration}
              </PosterChip>
            </span>
          </Link>
        </motion.div>

        {/*
          Second frame, tucked under the main one's lower-right corner.

          It sits right and the card sits left, which is the opposite of the
          obvious arrangement and is driven by the photograph: Roan stands on
          the right of this frame, so a card overlapping from the right cropped
          him out and left a rectangle of foliage. Overlapping from the left
          takes the foliage instead. A collage overlap has to be chosen against
          the image under it, not against the grid.
        */}
        <motion.div variants={item} className="absolute bottom-[74px] right-0 z-20 w-[41%]">
          <div className={frame}>
            <span className="relative block aspect-[4/3] overflow-hidden rounded-[10px] bg-surface-sunken">
              <Photo
                image={hero.aside}
                width={900}
                height={675}
                sizes="(max-width: 1024px) 45vw, 215px"
              />
            </span>
          </div>
        </motion.div>

        {/*
          The lesson card, occupying the collage's third tile. It overlaps the
          main frame's lower edge, which is what makes the group read as a
          collage rather than as a column of three stacked objects.
        */}
        <motion.article
          variants={item}
          className="absolute bottom-0 left-0 z-30 w-[71%] rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-e2"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="t-label text-ink-muted">{hero.lesson.label}</p>
            <StatusChip open>{hero.lesson.status}</StatusChip>
          </div>

          <h2 className="t-card-title clamp-2 mt-1.5 text-ink">{hero.lesson.title}</h2>

          <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-line pt-2.5">
            <span className="t-meta text-ink-muted">{hero.lesson.access}</span>
            <Link
              href="/paths/gtm/module-1"
              className="t-button inline-flex items-center gap-1.5 text-accent no-underline transition-colors hover:text-accent-hover hover:underline"
            >
              {hero.lesson.action}
              <ArrowRightIcon size={14} weight="bold" />
            </Link>
          </div>
        </motion.article>
      </div>
    </motion.div>
  );
}
