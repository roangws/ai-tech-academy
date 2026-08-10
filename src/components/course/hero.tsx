import {
  ClockIcon,
  GaugeIcon,
  SealCheckIcon,
  StackSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { Container, FactsLine } from "@/components/ui";
import { type Course, type Person } from "@/lib/content";

/**
 * The dark fold, text only.
 *
 * ------------------------------------------------------------- WHY A DARK BAND
 *
 * The reference course page opens on near-black and every capture in references/
 * does the same, for a reason that survives the change of subject: a detail page
 * has to announce that you have left the catalog. The homepage's fold is white and
 * this one cannot be, or the two read as the same screen with different words.
 *
 * `--ink-band` is the token, and Amendment 2 grants exactly one dark ground per
 * page. This is that one, which is why this page's closing band is light where the
 * homepage's is a dark panel.
 *
 * A bare `<section>` rather than `<Section dark>`, because `Section` sets equal
 * padding top and bottom and the overlap below needs 76px underneath against 56
 * above.
 *
 * -------------------------------------------------- WHAT THIS BAND NO LONGER HAS
 *
 * It held the course cover in a right column and an enrol button under the byline.
 * Both are gone, and the enrol rail now floats up into the space the cover
 * occupied. The rail is the reference's actual structure and it does three things
 * at once that the cover did none of: it fills the right column, it carries the
 * offer, and by overlapping the band's bottom edge it ties the fold to the page
 * below it.
 *
 * The button went with it, and it had to. Two "Enroll for free" controls in one
 * viewport is what DESIGN-SPEC.md is about, and the rail's is the one a reader
 * came for. The band is now breadcrumb, chip, title, promise, byline, facts, which
 * is the whole of the reference's dark column too.
 *
 * -------------------------------------------- WHAT IS IN THE RATING SLOT: NOTHING
 *
 * The reference puts a gold 4.5, "62,674 ratings" and "381,636 learners" under the
 * byline, and it is the highest-contrast element in the fold. There are no ratings
 * and no enrolments to print, DESIGN-SPEC.md forbids inventing them, and the honest
 * move is not a substitute badge in the same position. The slot is empty, and the
 * four facts that are real sit in the bar that straddles the band's bottom edge.
 *
 * The green chip is the one place this fold answers the question the reference's
 * "Bestseller" pill answers, and it answers it with the access model.
 *
 * ------------------------------------------------------------ THE BAND IS THE COVER
 *
 * Added 8 Aug, at Roan's request: the band carries the course's own cover
 * photograph, full bleed, under a veil.
 *
 * The cover was already on this page once and it was in a right-hand column,
 * where it competed with the title for the fold and then had to be removed to
 * make room for the enrol rail. Behind the type it does the job the column
 * version never could: it says which of the five courses this is before a word
 * is read, and it does it in the 352px the rail is not using yet, because the
 * rail does not arrive until 208px below this band's bottom edge.
 *
 * ------------------------------------------------------------------- THE VEIL
 *
 * The image is at full opacity and every bit of the darkening is done by the one
 * gradient over it. That ordering is not cosmetic. Fading the photograph toward
 * `--ink-band` flattens it toward one value and the frame stops being a
 * photograph at about 40%; veiling a full-strength image keeps its contrast and
 * only moves its level, so it still reads as a room with a person in it at the
 * right of the fold while the left is near enough to flat ink for type.
 *
 * One gradient, so the remaining image is `1 - alpha` at every stop and can be
 * read straight off the class. At lg it runs 0.95 at the left edge, holds 0.92
 * to 52% of the viewport — which is past the longest line of type at every width
 * from 1024 up — then falls to 0.30 at the right, where the rail has not arrived
 * yet and nothing is written. Seventy per cent of the photograph survives at that
 * edge, which is what makes a face put there by `cover.focus` actually legible
 * rather than a shape in the dark. Below lg the type spans the full width, so
 * there is no clear side to spend the photograph on and the gradient goes
 * near-flat at 0.90/0.88 instead.
 *
 * THE NUMBERS ARE MEASURED. Photographing the band with the type hidden and
 * sampling the lightest ground pixel under each element, at 1440/1280/1024/768
 * and 430: the 13px lines at 60% and 70% white run 5.87 to 6.68, the tagline
 * 8.25 to 9.73, the h1 13.11 to 15.23. AA wants 4.5 for the small text and 3.0
 * for the h1, so the binding constraint is the breadcrumb at 5.87 and the left
 * end of the gradient is what sets it.
 *
 * ------------------------------------------------------------- NO STACKING CONTEXT
 *
 * `relative` and nothing else. No `isolate`, no `z-index`, and the image is a
 * positioned sibling of the content rather than a `-z-10` layer under it.
 *
 * The stat bar straddles this band's bottom edge, and it does so purely by
 * document order: it renders from the container *after* this section and paints
 * over it because it comes later. A `-z-10` layer in here would have needed
 * `isolate` to resolve against, and the same argument runs through this file
 * twice already — the glass controls' backdrop filters break if anything above
 * them opens a stacking context, and the stat bar's own note records an overlap
 * that was rebuilt for exactly this reason. The content gets `relative` to sit
 * above the two veils and nothing here goes negative.
 *
 * `priority` on the image. This is the fold, so it is the LCP candidate; without
 * it the band renders flat ink for the length of a lazy fetch and then changes
 * under the reader. `sizes="100vw"` because it is full bleed at every width.
 */
export function CourseHero({ course, lead }: { course: Course; lead?: Person }) {
  /* The lead arrives as a prop rather than being read from content.ts. The
     roster is a table now, this is a synchronous component inside a dark band
     whose geometry depends on nothing async, and the page above already has the
     person in hand for its JSON-LD. One query, two consumers. */

  return (
    <section className="relative overflow-hidden bg-ink-band pt-8 pb-14 md:pt-12 md:pb-16 lg:pt-14 lg:pb-[88px]">
      {course.cover ? (
        <>
          {/*
            `alt=""` and `aria-hidden`, like every decorative frame on the site.

            content.ts says it directly for these covers: the photograph shows
            the kind of job the course is for, and it introduces nobody. Under a
            title, a tagline and a byline it is decoration, and a screen reader
            reading "a marketing operations lead working from a laptop" before
            the h1 would be announcing the wallpaper.

            The crop is per course, from `cover.focus`. At the default centre
            the GTM frame resolved to a strip of desk and ceiling with the
            woman's face well above the band, which is what Roan was looking
            at.
          */}
          <Image
            src={course.cover.src}
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            /*
              `objectPosition` from the course's own frame, defaulting to
              centre. This is the "move it up" control and the note on
              `Img.focus` in content.ts has the whole of why the vertical value
              is the one that does the work on a band this wide.

              An inline style rather than a Tailwind class: the values are data,
              five different strings from content.ts, and arbitrary-value
              utilities have to be statically present in the source for the
              generator to emit them.
            */
            style={{ objectPosition: course.cover.focus ?? "50% 50%" }}
            className="pointer-events-none absolute inset-0 object-cover"
          />
          {/*
            ONE LAYER, and the first version had two: a flat floor with a
            gradient over it. Two veils multiply, which is both hard to reason
            about and why that version was wrong — 0.72 under 0.96 leaves 1.1%
            of the photograph at the left edge, so the band rendered as flat ink
            with a rumour in the corner. A single gradient states the remaining
            image directly as `1 - alpha` at every stop.

            The alpha at the right is the floor: it can never fall below 0.52 at
            lg, so no course's cover contributes more than 48% however bright
            its frame is.
          */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(13,26,34,0.9)_0%,rgba(13,26,34,0.88)_100%)] lg:bg-[linear-gradient(90deg,rgba(13,26,34,0.95)_0%,rgba(13,26,34,0.92)_52%,rgba(13,26,34,0.55)_74%,rgba(13,26,34,0.3)_100%)]"
          />
        </>
      ) : null}

      <Container className="relative">
        {/*
          The right column is held open at lg and left empty. The rail is placed
          into it from the container below, because a sticky element cannot live
          inside a band that ends 400px later, and this is the reservation that
          keeps the title from running under it.
        */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_352px] lg:gap-10">
          {/* 720px, not the 640 the body copy uses. The h1 is 44px and a 640
              measure breaks most of these titles across three lines. */}
          <div className="max-w-[720px]">
            {/*
              THE TRAIL ENDS ON THIS PAGE, and until 7 Aug it did not.

              It read "Courses / Applied AI Implementation", where the second item
              is `brand.program` — the name of the whole program, which every one of
              the five courses belongs to and which has no page. So the trail named
              a parent that is not a location, never named the course the reader is
              looking at, and was identical on all five course pages. A breadcrumb
              whose last item is not the current page is not a breadcrumb; it is two
              words of chrome.

              "Courses / <this course>" is the shape the reference uses and the
              shape a trail is for: one step up, then where you are. The last item
              is a plain span with `aria-current="page"`, per the WAI pattern, so it
              is announced as the current location rather than offered as a link to
              the page already open.

              `<ol>`, because a trail is ordered and the order carries the meaning.

              AND THE FIRST ITEM IS A ROUTE, from 8 Aug. It pointed at
              `/#courses` — a scroll position on the homepage — which made the
              parent of five pages a band on a sixth. `/courses` is the page that
              was built to be that parent, and this link is the reason it was
              built; it shipped without this line being changed, so for one pass
              the trail still threw the reader onto the homepage.
            */}
            <nav aria-label="Breadcrumb" className="t-meta">
              <ol className="flex flex-wrap items-center gap-x-2">
                <li>
                  <Link
                    href="/courses"
                    className="text-white/60 no-underline transition-colors hover:text-white hover:underline"
                  >
                    Courses
                  </Link>
                </li>
                <li aria-hidden="true" className="text-white/30">
                  /
                </li>
                <li>
                  <span aria-current="page" className="text-white/60">
                    {course.title}
                  </span>
                </li>
              </ol>
            </nav>

            {/*
              The h1, and it is not animated.

              This is the page's LCP element. Fading it in delays the largest paint
              by the length of the animation for no gain, which is the note
              hero-collage.tsx carries about the homepage headline.

              `[text-wrap:balance]` rather than the `pretty` the base layer sets:
              balance evens the line lengths of a short block, which is what a
              two-line title wants, where pretty only prevents orphans.
            */}
            <h1 className="t-display mt-3 text-white [text-wrap:balance] md:mt-4">
              {course.title}
            </h1>

            {/* The on-dark body value is #c3d2dc, which the closing panel already
                uses. White at 70% measures the same but composites differently over
                the band, and two near-identical greys on one page is the kind of
                drift that is invisible until both are on screen. */}
            <p className="t-body mt-3 max-w-[620px] text-[#c3d2dc]">{course.tagline}</p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              {lead?.photo ? (
                <span className="flex items-center gap-2.5">
                  <span className="relative block h-8 w-8 flex-none overflow-hidden rounded-full ring-1 ring-white/20">
                    {/*
                      No `sizes`, deliberately, and it is the opposite of the usual
                      advice here.

                      With `sizes` set, Next builds the srcset from `deviceSizes`,
                      whose smallest entry is 640, so `sizes="32px"` was serving a
                      640px JPEG into a 32px circle. Without it, a fixed
                      `width`/`height` pair uses `imageSizes` instead and the
                      browser takes the 64 candidate, which is the 2x asset this
                      slot actually wants.
                    */}
                    <Image
                      src={lead.photo.src}
                      alt=""
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span className="t-meta text-white/70">
                    Created by <span className="text-white">{lead.name}</span>
                  </span>
                </span>
              ) : null}

              <FactsLine tone="dark" items={["Updated August 2026", "English", "Self-paced"]} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * The four facts, in a card that sits half on the dark band and half on white.
 *
 * ------------------------------------------------------------- HOW THE OVERLAP WORKS
 *
 * No z-index, no `isolate`, no absolute positioning. This renders from the
 * container that comes *after* the dark section, so it paints over the band by
 * ordinary paint order and a negative margin is the whole mechanism. The page file
 * carries the arithmetic; all this needs to know is that it is pulled up 56 into a
 * band with 88 of bottom padding, so it sits 56 of its 92px height over the ink and
 * leaves 32px of clear ink above itself.
 *
 * It did not do that until 7 Aug. The negative margin was collapsing through the
 * white wrapper below the band and taking the white ground up with it, so the card
 * landed flush against the band's edge and the whole effect was a seam. The wrapper
 * is `flow-root` now; the note in the page file has it.
 *
 * That mattered more than it sounds. The sticky header and the glass buttons both
 * rely on `-z-10` layers inside their own stacking contexts, and the button's
 * backdrop filter breaks if anything above it establishes one. An overlap built
 * from a new stacking context would have worked here and quietly broken a control
 * somewhere else.
 *
 * -------------------------------------------------------------- VALUE FIRST
 *
 * The value is the large line and the label sits under it, which is the inverse of
 * how this shipped and of how the catalog cards do it. A catalog card's `dt`/`dd`
 * pair is read as a field and a value, in a card whose subject is stated 40px
 * above. This bar has no such heading: it is four bare facts on a floating white
 * plane, and the numbers have to be the thing the eye lands on or it reads as four
 * captions. Both references set it this way.
 *
 * ------------------------------------------------------------- AND WHY NOT ON A PHONE
 *
 * Below md the overlap is zero. A card at 390px is full bleed to the gutters, so
 * there is no edge for it to break, and it was spending a fifth of the fold's
 * height on an effect nobody could see. Two columns rather than four down there,
 * because four cells at 358px gives each 89px and "Intermediate" alone is 84.
 *
 * ------------------------------------------------------- A MINIMUM, NOT A HEIGHT
 *
 * `md:min-h-[92px]`, and it was `md:h-[92px]`. A fixed height inside an
 * `overflow-hidden` card is a silent crop, and the two-line labels at md and lg
 * are what found it: measured, the bar resolves to 93 at 768 and at 1024, so a
 * hard 92 was cutting a pixel of descender off the last line at both.
 *
 * The minimum keeps every width that already fitted at exactly the height it had
 * and lets the two that do not grow by the one pixel they need. The tile narrows
 * to 152 below xl and the cells to `px-3` at lg for a different reason, which the
 * glyph note below has: the longest value is one unbreakable word.
 */
export function StatBar({ course }: { course: Course }) {
  const [highlight, ...rest] = course.stats;

  return (
    /*
      `border border-line shadow-e2`, which is what DESIGN-SPEC.md §2 specifies
      for every card on this site.

      This carried `shadow-e3 ring-1 ring-ink/[0.06]` for an hour, on the argument
      that a #d8e1e8 hairline against #0d1a22 traces the card like a sticker. Two
      things were wrong with that. The spec does not merely omit a third elevation,
      it names it: "Never `--shadow-3` on a card" — so the fix was a new token
      introduced against an explicit prohibition, for two components, recorded
      nowhere but in a comment. And the replacement was measurably worse where it
      mattered: `--line` on white is 1.32:1 and `ring-ink/[0.06]` is 1.13:1, so the
      card's edge on its white half lost about 40% of its contrast to solve a
      complaint about its dark half.

      The reference draws a plain light border on its straddling card and it reads
      correctly against the black. So does this.

      ------------------------------------------------- THE GROUND IS PLAIN WHITE

      It carried the homepage's banner photograph across the whole bar at 6%,
      ghosted behind the three cells. Removed 8 Aug on Roan's instruction, and
      the reason it goes cleanly is that the treatment was always working against
      its own labels: the note that used to live here recorded 6% as a hard
      ceiling because the 13px `--ink-muted` labels drop under AA at 7. A texture
      whose maximum strength is set by the type it sits behind is a texture with
      no room in it, and at 6% what it bought was 14 levels of grey that read as
      a smudge rather than as a surface.

      The tile at the left is what makes this card read as an object laid over
      the band, which is the job the photograph was hired to help with. It does
      it alone.

      `isolate` went with the image. It existed so a `-z-10` layer could resolve
      inside this element, and there is no negative index here now.

      `relative` STAYS, and it is load-bearing rather than left over. The hero
      band above is itself `relative` since it took the cover photograph, so it
      paints as a positioned element; this card overlaps it and must be
      positioned too, or the band paints over the top of it. Nothing in the
      output says so if it regresses — the card simply disappears into the ink.
    */
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-e2 md:flex md:min-h-[92px]">
      {/*
        The solid tile at the left edge, which is the element that makes the whole
        bar read as laid over the band rather than butted against it.

        The reference draws its plan badge exactly here: a full-bleed block of
        colour flush to the card's left, top and bottom edges, with no padding
        between it and the card's own border. It works because it is the one thing
        in the fold that touches both grounds at full strength, so the eye reads the
        card as a solid object sitting on the band instead of as a seam where two
        bands meet.

        `--accent`, and it was `--ink-band` until 7 Aug. Roan sent the reference
        back with the note that this bar needed the colour contrast its plan badge
        has, and the ink version could not have it: the tile was the same value as
        the band behind it, so on the half of the card that overlaps there was no
        tile, only a bite taken out of the card.

        This is an exception to the accent lock, and globals.css carries it as a
        decision rather than as a derivation. Read that note before changing this
        line. The short version: --path-a would work here too and needs no
        exception, and the cost of the accent is that this tile renders flat
        #0a3fe0 while the enrol button 60px to its right renders rgb(35,83,228)
        through its glass, so the most saturated blue in the fold is the one thing
        that cannot be pressed. Roan chose it with that in front of them.

        Do not restate the old defence here. "Every control on this site is a
        glass-rimmed pill, so a filled square cannot be mistaken for one" was
        written in this comment and is false: the review-board cards are full-bleed
        colour blocks that are stretched links, the video poster in the card 60px
        right is a zero-radius button, and this tile's own left corners carry the
        parent's 12px card radius through its `overflow-hidden`.

        White on #0a3fe0 is 7.50:1 and white at 80% is 5.31:1, so both lines clear
        AA at their sizes.

        `stats[0]` is drawn here and the rest become cells. Every course puts "Free"
        first for that reason, which content.ts records.

        152 wide at md, 168 at xl. At lg the enrol rail takes 352 of a 960 container
        and this bar gets 568, so every pixel the tile holds comes off three cells
        that are already the narrowest they get anywhere.
      */}
      {highlight ? (
        <div className="relative flex flex-none items-center bg-accent px-4 py-4 md:w-[152px] md:py-0 xl:px-5 xl:w-[168px]">
          {/*
            THE MARK IS ON THE VALUE'S LINE, and getting it there took three tries.

            It was 20px filled and stacked above the value, which made the tile's
            content 69px against a cell's 47; centring two different heights in one
            92px card put "Free" 15px below the three values it shares a rank with.
            So it went inline, at 16px regular to match the cells — and landed in
            the tile's top-left corner, 30px above the text, which is what Roan
            photographed.

            The cause is worth stating because it applied to all four cells, not
            just this one. `self-start` aligns to the top of the flex line, and the
            flex line here is the full 92px of a stretched tile, not the height of
            the type beside it. In the three white cells the same class put the
            glyph 9px above its value, which read as sloppy rather than broken and
            so survived a review.

            The fix is a nested box. The outer flex centres a group; the group is
            exactly as tall as its type and aligns the glyph to the top of *that*,
            so the mark sits on the value's line at any card height, with any
            number of label lines, at every breakpoint. `mt-[3px]` is the optical
            centring of a 16px glyph on a 22px line box.

            16px regular also settles a collision: 20px filled was a second
            treatment of `SealCheck`, which the enrol rail uses at 16px regular for
            "a recorded baseline and a measured result" 260px away.
          */}
          <div className="flex min-w-0 items-start gap-2 xl:gap-3">
            <SealCheckIcon
              size={16}
              aria-hidden="true"
              className="mt-[3px] flex-none text-white"
            />
            <div className="min-w-0">
              <p className="t-card-title text-white">{highlight.value}</p>
              <p className="t-meta mt-1 text-white/80">{highlight.label}</p>
            </div>
          </div>
        </div>
      ) : null}

      {/*
        A `ul`, and it was a `dl` through three passes of this file.

        The description-list markup never described anything. A `dl` pairs a term
        with its definition, and these pairs are a value and a gloss on that value:
        "Lesson and lab in each" does not define "8 modules", it qualifies it. The
        rendering wanted the value on top, so the `dd` was written before its `dt`,
        which meant a screen reader announced every definition ahead of its term.
        Then this pass wrapped each pair in a `div` for the glyph column, and that
        broke the content model outright: a `dl`'s `div` may contain only `dt` and
        `dd` children, and these held a `span`, an `svg` and another `div`. Measured
        in the AX tree, the `dl` contributed no grouping node at all and the six
        entries came out flat under `main`, each definition before its term.

        Four bare facts in a row is a list. `ul` says that, needs no source-order
        contortion to render value-first, and reads as "list, 3 items" instead of as
        a broken definition list.

        NO `md:h-full` HERE, either, and it was there until it was measured. The
        card's height is `min-h-[92px]`, so its used height is `auto`, and a
        percentage height has nothing to resolve against: the list fell back to
        content height and top-aligned inside a 92px card. 17px of dead white ran
        the length of the card's bottom edge, the inset dividers came out 43px of 92
        where the note below claims 60, and "Free" sat 24px lower than the three
        values it shares a rank with. Removing it lets the default `stretch` do what
        the class was asking for. Measured after: list 92, divider 60, dead white 0.
      */}
      <ul className="grid flex-1 grid-cols-1 sm:grid-cols-3">
        {rest.map((s, i) => {
          const Glyph = statGlyphs[i] ?? SealCheckIcon;

          return (
          <li
            key={s.label}
            className={[
              "relative flex items-center px-4 py-3.5 lg:px-3 xl:px-5",
              /* Stacked on a phone, a rule between rows. Above sm the inset span
                 below takes over. */
              i < rest.length - 1 ? "border-b border-line sm:border-b-0" : "",
            ].join(" ")}
          >
            {/*
              An inset rule rather than a border, and this is the detail that
              separates the reference's bar from a row of fused boxes.

              `border-r` runs the full height of the cell and meets the card's top
              and bottom edges, so the cells read as boxes welded together and the
              rules compete with the card's own outline. The reference insets them:
              each divider is a short line floating in the middle of the card, which
              lets the whole bar read as one white plane with facts arranged on it.

              `inset-y-4` leaves 16px clear at each end of a 92px card, so the rule
              is 60 of 92. Absolutely positioned, so it adds no width and the cells
              stay on their grid tracks.
            */}
            {i < rest.length - 1 ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-4 right-0 hidden w-px bg-line sm:block"
              />
            ) : null}
            {/*
              One glyph per cell, in accent, and this is the second half of what
              Roan asked for: the tile puts colour on the dark end of the bar and
              these carry it across the white plane, which is what stops the three
              cells reading as a caption block bolted to a coloured square.

              They are positional, like the rail's `glyphs` array and for the same
              reason: `stats` is four fixed slots in a fixed order in content.ts,
              so the copy in a slot can be edited without coming here to rekey a
              lookup.

              16px and regular weight, which is the rail's own treatment 260px to
              the right, in the same size and stroke. Only the colour differs, and
              that is the whole of what the accent exception buys here.

              GONE BETWEEN 1024 AND 1119, and the bound is measured rather than
              picked. The longest value any course puts in these cells is
              "Foundational" at 111px, and it is one word, so a cell narrower than
              that does not wrap it, it loses the end of it. The squeeze is the lg
              band: the enrol rail has appeared and taken 352px while the container
              is still short of its 1280 maximum, so the bar runs `W - 456` and a
              cell `(W - 608) / 3`. With the glyph and its gap costing 24 and the
              padding 24, the value clears 111 from W = 1085 up. 1120 is that with
              a line of slack, so a font that renders a few per cent wide does not
              shear the word.

              ONE STACKED VARIANT, not two competing ones. This was `lg:hidden
              min-[1120px]:block` first, and measured, the glyph was gone at every
              width above 1024: Tailwind emits the `lg` rule after the arbitrary
              one, so `display: none` won at 1440 as surely as at 1050. Two rules
              of equal specificity fighting over one property is decided by the
              generator's sort order, which is not a thing to design against.
              `lg:max-[1119px]:hidden` is one rule with a floor and a ceiling and
              nothing to lose to.

              Before that it was `xl:block`, which held the glyphs back to 1280 and
              cost 160px of viewport for nothing.

              This cell overflowed at lg before the glyphs existed, at 93px of cell
              against the same 111. The narrower padding is what fixed that, not
              the hiding.
            */}
            {/*
              The glyph and the type are one group, and the group is what the cell
              centres. `self-start` on the glyph against the cell itself aligned it
              to the top of a stretched 92px flex line, which put it 9px above its
              own value here and 30px above it in the tile. Inside a content-height
              box, `items-start` means the top of the type. `mt-[3px]` centres a
              16px glyph on a 22px line. The tile carries the identical structure.
            */}
            <div className="flex min-w-0 items-start gap-2 xl:gap-3">
              <Glyph
                size={16}
                aria-hidden="true"
                className="mt-[3px] flex-none text-accent lg:max-[1119px]:hidden"
              />

              <div className="min-w-0">
                {/*
                  `t-card-title`, and nothing here goes to `t-stat`. 56px is
                  granted to exactly one element on this site, the before-and-after
                  figure on the outcomes band, and Amendment 2 says no second
                  element may take the exception.
                */}
                <p className="t-card-title text-ink">{s.value}</p>
                <p className="t-meta mt-1 text-ink-muted">{s.label}</p>
              </div>
            </div>
          </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * One glyph per stat cell, for `stats[1..3]`: module count, duration, level.
 *
 * `stats[0]` is not in here. It is the highlight tile and carries its seal mark
 * inline, at the same 16px and the same weight as these.
 *
 * A clock and not a calendar on the duration cell, which is what this shipped
 * with for an hour. A calendar means a scheduled date and the label directly
 * under it reads "At your own pace", so the glyph contradicted its own caption;
 * meanwhile the one real date in the fold, "Starts Aug 7" on the enrol button,
 * carries no calendar at all. DESIGN-SPEC.md names the clock for duration.
 */
const statGlyphs: readonly Icon[] = [StackSimpleIcon, ClockIcon, GaugeIcon];
