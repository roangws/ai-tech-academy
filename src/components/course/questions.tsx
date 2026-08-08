"use client";

import Image from "next/image";
import Link from "next/link";
import { CaretDownIcon } from "@phosphor-icons/react";
import { AccordionItem, useDisclosureSet } from "@/components/ui/accordion";
import { Panel, Section } from "@/components/ui";
import { faqs, instructors } from "@/lib/content";

/**
 * Questions and the instructor, as one two-column dark panel.
 *
 * --------------------------------------------------------------- WHY THIS SHAPE
 *
 * Straight from the Google AI Essentials page Roan sent, which closes on exactly
 * this: an FAQ accordion on the left and an instructor card on the right, both on
 * one dark ground. It is the best structure on that page and it solves two
 * problems here at once.
 *
 * The first is that this page had no questions at all. Eleven of them exist in
 * content.ts and six answer things a reader asks precisely at this point in a
 * course page: what it costs, when they can start, what the account wants, what
 * they need access to. They were a scroll and a page-load away on the homepage.
 *
 * The second is that the instructor block was a capped tile on a white band with
 * 340px of empty ground to the right of it, because one person's name, role and
 * two-line bio does not fill a 1216px band. As a column beside the questions it
 * fills its own width and stops being a slab with a gap next to it.
 *
 * ------------------------------------------------------------------- THE GROUND
 *
 * A `Panel`, not a `Section dark`. Amendment 2 grants one dark *ground* per page
 * and the hero has it. A panel is inset and rounded, so it is a card, which is the
 * same reasoning the closing panel and the old instructor tile ran on.
 *
 * The two dark panels on this page are separated by the tinted cross-sell band, so
 * they never share a viewport.
 *
 * ------------------------------------------------------------------ THE QUESTIONS
 *
 * Six of eleven, chosen rather than sliced. The full set covers the program; these
 * six are the ones a reader asks with a specific course open in front of them, and
 * the rest are one link away. `mode: "single"` and nothing open on first paint,
 * because six open answers on a dark ground is a wall.
 *
 * This is a second accordion on the same document as the curriculum, which is what
 * `idPrefix` on the primitive is for.
 */
const COURSE_QUESTIONS = [0, 2, 3, 4, 5, 6];

export function Questions() {
  const items = COURSE_QUESTIONS.map((i) => faqs[i]).filter(Boolean);
  const ids = items.map((_, i) => String(i));
  const { isOpen, toggle } = useDisclosureSet({ ids, mode: "single" });
  const lead = instructors.people[0];

  return (
    <Section id="faq">
      <Panel tone="dark">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
          <div>
            <h2 className="t-h3 text-white">Common questions</h2>

            <div className="mt-4">
              {items.map((f, i) => {
                const open = isOpen(String(i));
                return (
                  <AccordionItem
                    key={f.q}
                    id={String(i)}
                    idPrefix="course-faq"
                    open={open}
                    onToggle={() => toggle(String(i))}
                    className="border-b border-white/10"
                    header={() => (
                      <span className="flex w-full items-start gap-4 py-3.5">
                        <span
                          className={`t-body min-w-0 flex-1 font-medium transition-colors duration-200 ${
                            /* 78% white is 9.2:1 on this ground; the closed state
                               stays legible rather than becoming a watermark, which
                               is the same call the homepage FAQ made at 55% ink. */
                            open ? "text-white" : "text-white/78 hover:text-white"
                          }`}
                        >
                          {f.q}
                        </span>
                        <CaretDownIcon
                          size={16}
                          aria-hidden="true"
                          className={`mt-1 flex-none text-white/50 transition-transform duration-150 ${
                            open ? "rotate-180" : ""
                          }`}
                        />
                      </span>
                    )}
                  >
                    <p className="t-body-sm max-w-[62ch] pb-4 text-[#c3d2dc]">{f.a}</p>
                  </AccordionItem>
                );
              })}
            </div>

            <Link
              href="/#faq"
              className="t-button mt-4 inline-flex min-h-[44px] items-center text-white no-underline transition-colors hover:underline lg:min-h-0"
            >
              All questions
            </Link>
          </div>

          {/*
            The instructor column.

            It cannot say who teaches this particular course. `Person.scope` is the
            field for that and it is set on Roan and deliberately empty on the four
            specialists, because nobody supplied it: content.ts records that naming
            a real person does not license describing them. So this is the lead
            instructor, which the FAQ answer on the site already states, and a link
            to the roster.
          */}
          <div className="lg:border-l lg:border-white/10 lg:pl-14">
            <h2 className="t-h3 text-white">Instructor</h2>

            <div className="mt-4 flex items-center gap-4">
              {lead.photo ? (
                <span className="relative block h-16 w-16 flex-none overflow-hidden rounded-full ring-1 ring-white/15">
                  {/* No `sizes` on a fixed box: with it, Next builds the srcset from
                      deviceSizes whose smallest is 640, and this slot wants the 128
                      candidate from imageSizes. */}
                  <Image
                    src={lead.photo.src}
                    alt={lead.photo.alt}
                    width={128}
                    height={128}
                    className="h-full w-full object-cover object-top"
                  />
                </span>
              ) : null}
              <div className="min-w-0">
                <p className="t-card-title text-white">{lead.name}</p>
                {lead.role ? <p className="t-meta mt-1 text-white/70">{lead.role}</p> : null}
              </div>
            </div>

            {lead.scope ? (
              <p className="t-field mt-4 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-white/80">
                Records {lead.scope.toLowerCase()}
              </p>
            ) : null}

            {lead.detail ? (
              <p className="t-body-sm mt-4 text-[#c3d2dc]">{lead.detail}</p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {lead.linkedin ? (
                <Link
                  href={lead.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="t-button text-white no-underline hover:underline"
                >
                  LinkedIn
                </Link>
              ) : null}
              <Link
                href="/#instructors"
                className="t-button text-white/70 no-underline hover:text-white hover:underline"
              >
                The full roster
              </Link>
            </div>
          </div>
        </div>
      </Panel>
    </Section>
  );
}
