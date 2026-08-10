/**
 * All homepage copy and data.
 *
 * Three standing copy rules:
 *   1. Every claim traces back to the program brief in
 *      mockups/uploads/aitecheducationacademy/aitecheducation-academy-brief.md.
 *   2. Copy is written affirmatively. State what is true rather than what is
 *      absent, and keep negation words out of visible strings.
 *   3. Punctuation stays to hyphens, commas, colons and full stops.
 *
 * One canonical vocabulary, adopted after the 6 Aug 2026 copy review. The
 * mechanic had six different names across the page, which is how a
 * differentiator becomes forgettable. From here on:
 *   - the mechanic is "completion by deployment"
 *   - the canonical sentence is "A course completes when your workflow runs live
 *     and you have measured it."
 *   - the module 1 artifact is the "baseline and brief"
 *   - the final artifact is the "completion record", never a "deployment
 *     record" or a "shareable record"
 *
 * Imagery policy, revised 6 Aug 2026 (second pass).
 *
 * The rule used to be that every image on the page is a frame of Roan, on the
 * grounds that a photograph of somebody the page will never introduce is the
 * same fabrication as invented copy, made of pixels. That is still true, and it
 * is still the rule. What the earlier version got wrong was treating it as a
 * rule about pictures of people, when it is a rule about claims.
 *
 * The question a picture has to answer here is whether it asserts something the
 * program cannot back. Split that way it decides every slot on the page:
 *
 *   Photographs of the work. Allowed. A field technician with a tablet on a
 *   path cover asserts "this path is for people who do this job", which is what
 *   the audience line printed on top of it says in words. It introduces nobody
 *   and names nobody. These are the five path covers.
 *
 *   Photographs of a specific person. Only where the page names them. This is
 *   what removed the studio frame of an unnamed person from the hero.
 *
 *   The instructor roster now clears this rule outright. As of 7 Aug it is five
 *   named practitioners with five real studio portraits and five public profile
 *   links, so the illustration workaround that used to fill it is gone: no
 *   faceless figures, no path-hue grounds standing in for people, no GMI mark.
 *   Every frame in that section is a photograph of somebody the page names and
 *   links to.
 *
 *   The rule has a second half that the roster now runs into, and it is the
 *   live constraint on that section: naming a real person does not license
 *   describing them. Job titles for four of the five have not been supplied, so
 *   their cards carry a name and a link and no role line. A fabricated title
 *   under a real face is the same failure as a fabricated face, in words.
 *
 *   A stand-in photograph, used knowingly and identically. This is what the six
 *   board seats still carry, at Roan's instruction: one studio portrait, the
 *   same frame on all six cards. It is the one arrangement of a photographic
 *   placeholder that cannot be mistaken for a claim, because six identical
 *   faces are self-evidently a placeholder rather than six practitioners. The
 *   moment two different faces appear there it stops being obvious and starts
 *   asserting a roster, so if these are varied before real portraits exist, the
 *   footnote has to do that work instead.
 *
 * What stays banned is the thing that actually failed before, which was neither
 * of these: grey monogram tiles in a photograph's frame, which read as three
 * broken images rather than three pending ones.
 *
 * The organization mark on the board is the GMI wordmark, also a placeholder,
 * in white on those dark cards. It stands in for whichever employer eventually
 * clears each seat. The instructor roster no longer uses it.
 *
 * Everything generated lives under public/images/paths and
 * public/images/placeholders, and scripts/generate-images.mjs holds the prompts
 * that produced it, so any of it can be redrawn or replaced with a real frame by
 * changing one line here.
 */

export type Img = {
  src: string;
  alt: string;
  /**
   * Where the subject is, as a CSS `object-position` value.
   *
   * Added 8 Aug because the course hero band crops these hard and was cropping
   * past the person in them. The band is full-viewport and about 340px tall,
   * which is roughly 4.2:1, and every one of these frames is 16:9 or taller, so
   * `object-fit: cover` scales to the width and throws away most of the height.
   * At the default `50% 50%` the GTM frame resolved to a strip of desk and
   * ceiling with the woman's face a long way above it.
   *
   * WHAT EACH AXIS ACTUALLY DOES HERE, because they are not symmetrical and it
   * is the first thing that will confuse the next person to tune one. `cover`
   * only leaves overflow on the axis where the image is proportionally larger,
   * and position only moves the image along an axis that has overflow:
   *
   *   - The vertical value is the one that works on the hero band at every
   *     desktop width. That is the "move it up" control.
   *   - The horizontal value does nothing on that band above about 700px,
   *     because no frame here is proportionally wider than 4.2:1, so there is
   *     no horizontal overflow to pan through. It does take effect on a phone,
   *     where the band is nearer 1.2:1, and on the catalog covers, which are
   *     16:9 and 16:6. Both values are written for that reason.
   *
   * Percentages, not keywords: `top` and `center` cannot say "a third of the
   * way down", which is where most of these faces are.
   */
  focus?: string;
  /**
   * The file's real pixel dimensions, for `openGraph.images`.
   *
   * Three call sites were declaring `width: 1600, height: 900` over whatever
   * file they happened to be pointing at, and not one of the assets is that
   * size: the four landscape covers are 1400x781, `gtm.jpg` is 1127x1400 — a
   * portrait — and the site-wide poster is 1600x886. A social card renderer
   * lays out against the declared numbers before it has the bytes, so the four
   * that were close came out slightly wrong and the GTM course, which is the
   * image on both its own page and the /courses index, was declared landscape
   * and is not.
   *
   * Carried on the image rather than at the call sites so the number lives next
   * to the `src` it describes and cannot drift from it again.
   */
  width?: number;
  height?: number;
};

/*
  One name for the thing, everywhere.

  The page was calling itself three things at once. The metadata, the footer
  copyright and the footer blurb all said "AI Tech Education Academy"; the
  lockup in the header and the footer said "AI Tech Education"; and below sm the
  lockup dropped its wordmark entirely, so the top-left of a phone screen was an
  unlabelled cyan shield. A visitor who arrived from a search result reading
  "AI Tech Education Academy" met a mark that agreed with it nowhere.

  `name` is the legal name and the only one allowed to stand for the brand in
  running text. `short` exists for one job, which is the phone lockup: the full
  name at 18px measures about 230px, and at 390px it fights the CTA and the
  menu button for a 72px bar. Neither of them may say anything the other does
  not, which is why the short form is a truncation rather than a nickname.
*/
export const brand = {
  name: "AI Tech Education Academy",
  short: "AI Tech",
  tagline: "free courses by Roan Weigert",
  domain: "AITechEducation.academy",
  program: "Applied AI Implementation",
} as const;

/**
 * The one origin, for everything that has to print an absolute URL.
 *
 * It was a `const siteUrl` inside app/layout.tsx, which was the only file that
 * needed it until three others did: the sitemap, the robots policy and the
 * JSON-LD graph all emit absolute URLs, and structured data in particular is
 * silently wrong rather than broken if its `@id` origin drifts from the
 * canonical the same page declares.
 *
 * `brand.domain` is the human spelling, capitalised for display. This is the
 * machine one and they are deliberately separate values rather than one derived
 * from the other: a URL that is case-folded and protocol-prefixed at three call
 * sites is a URL that will be assembled differently at the fourth.
 */
export const site = {
  url: "https://aitecheducation.academy",
  description:
    "A free, project-based applied AI course. Five role-based courses. Build an AI workflow on your own data, deploy it, and measure the result. Module 1 is open.",
} as const;

/**
 * Three rungs, and one label per rung.
 *
 * The page used to carry seven labels for three intents, including two
 * different destinations sharing the label "See the curriculum". `primary`
 * repeats on purpose: repeating one primary label builds recognition, while
 * four synonyms for it spends that recognition.
 */
/*
  Renamed with the vocabulary, 7 Aug. The brief calls each track "a standalone
  course" (section 6), so the five things this site sells are courses and the
  word "path" is gone from visible copy.

  Two keys had to move rather than just their strings. `path` became `view`,
  because the obvious rename collided with the `course` key that was already
  here, and `course` became `howItWorks`, which is what that string has always
  said. Renaming the keys rather than shuffling the strings between them keeps
  the diff readable at the call sites.
*/
export const cta = {
  primary: "Enroll for free",
  /*
    THE LABEL ON THE COURSE PAGE'S OWN CONTROL, added 9 Aug.

    "Enroll for free" is right everywhere it is a reader's first contact with the
    program — the header, the homepage, a catalog card — because there the
    decision being offered is whether to have anything to do with this at all.

    On a course page it is the wrong promise by one step. That reader has already
    chosen; what they want to know is what the button does, and "enroll" is a
    word for joining a list. It also described what the control actually did,
    which was open an account form: pressing the primary action on a course page
    took you to a form, then to a dashboard, then back to the same course. This
    label goes with the fix — the control opens a lesson now — and it has to say
    so, because a button that says "enroll" and starts playing a video is a
    surprise even when the surprise is the good one.
  */
  start: "Start the course",
  resume: "Resume the course",
  view: "View course",
  compare: "Compare every course",
  howItWorks: "See how the course works",
  watch: "Watch now",
} as const;

/**
 * The start date, which is always today.
 *
 * Module 1 opens with no account and no cohort, so there is no future date to
 * announce and never was: whenever somebody reads this page, the thing starts
 * the moment they click. "Starts Aug 7" on 7 August is therefore a fact rather
 * than a scarcity device, and it is the one line that turns "Enroll for free"
 * from an offer into an appointment.
 *
 * Which is exactly why it cannot be a string in this file. A hardcoded date is
 * true for one day and then quietly becomes a page advertising a start date in
 * the past, which is worse than saying nothing. It is derived from the clock, in
 * the reader's own timezone, every time the page is opened.
 *
 * `en-US` is pinned rather than left to the reader's locale. The rest of the
 * page is written in one voice and one language, so a German visitor getting
 * "7. Aug." inside an English button would be the only localised string on the
 * site. See components/start-date.tsx for the half of this that runs on the
 * client, and why it has to.
 *
 * ------------------------------------------------- THE SERVER RENDERS IN CALIFORNIA
 *
 * `timeZone` exists for one reason and it is a bug QA found on production: the
 * button was alternating between "Starts Aug 9" and "Starts Aug 10" on reloads
 * seconds apart.
 *
 * That looked like a caching race and it was not. Vercel runs in UTC, and at 20:20
 * in California it is already 03:20 the next day in UTC — so the server was
 * rendering tomorrow's date, and which of the two a reader got depended on whether
 * the ISR entry serving them had been built before or after midnight UTC. The
 * `revalidate = 3600` on the pages means both entries can be alive at once, which
 * is what produced the flicker.
 *
 * The prerendered string is therefore computed in `REFERENCE_ZONE` rather than in
 * the server's own. Two consequences, both wanted:
 *
 *   - It stops being wrong for most readers. This is a San Francisco program — the
 *     partner events are in San Francisco and every judge on the board is in the
 *     Bay Area — so Pacific is the closest thing to "the program's own day", and it
 *     is the right day for the whole of the Americas rather than the wrong one.
 *   - It stops flickering. Every cache entry built within one Pacific day now
 *     produces the same string, whatever hour UTC thought it was.
 *
 * `StartDate` still corrects it to the reader's own zone on mount, which is what
 * makes it right for a reader in Berlin too. This only decides what the HTML says
 * before their browser has had a chance to say otherwise — which is also what a
 * crawler and a reader with no JavaScript get, and neither of those was being
 * served a correct date before.
 */
export const REFERENCE_ZONE = "America/Los_Angeles";

export function startsOn(date: Date, timeZone?: string): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(timeZone ? { timeZone } : {}),
  });
}

/*
  In document order, which is the only order this list can be in. The header
  underlines whichever section is on screen, so a nav whose items run in a
  different sequence from the page makes that underline jump backwards as a
  reader scrolls forwards. Methodology moved to fourth when the method section
  moved down the page to sit above the FAQ.
*/
/*
  Six items, all six at every width from lg up.

  Instructors joined this list on 7 Aug at Roan's request, and a sixth item did not
  fit at 1024. Measured: the lockup is 268px, six links at the old padding are 497,
  and the two controls are 266, which is 1,055px of content inside a 960px column,
  and the document grew a 63px horizontal scrollbar at exactly the width where a
  reader is most likely to be using the nav.

  The first fix was to hide the widest label below xl, and it was wrong. Between
  1024 and 1280 the desktop nav had dropped Methodology and the mobile panel that
  carries all six is gated at lg, so there was no route to that section from the
  chrome at all in a 256px band. The note that fix was written under rejected
  hiding Sign in for exactly that reason and then did the same thing to a nav item
  anyway, which is the sort of thing a comment is supposed to prevent.

  So the 95px came out of the row instead, in four places, none of which is a
  route to anywhere: the container gap from 24 to 12, the nav's own gap from 2 to
  0, link padding from 12 to 8 a side below xl, and 8px a side off each of the two
  controls below xl. That is 78px, against 95 needed once Methodology is back at
  its tighter 108px, so at 1024 there are 31px of clear air between the last nav
  item and the first control, measured.

  Which is thin, and it is why the numbers above are written down. Anything added
  to this row at lg has to be measured first, and the next thing that needs 40px
  will have to take it from the lockup rather than from the nav.
*/
/*
  ROOT-ABSOLUTE as of 7 Aug, and this was a live bug rather than a tidy-up.

  These were six bare hashes, which is correct on the one page that has all six
  ids and broken everywhere else: from /courses/gtm, `#outcomes` resolves to
  /courses/gtm#outcomes, an anchor to nothing. The site had two non-home routes
  already, so the whole primary nav did nothing from either of them. `/#outcomes`
  navigates home and then scrolls, which is what the label promises.

  site-header.tsx reads the fragment off these to track the active section, so it
  splits on "#" now rather than stripping it.

  TWO LABELS CHANGED with the path-to-course rename, and the width note below
  applies to both. Measured at t-nav, 14px/500:

    "Paths" 44 -> "Courses" 63      +19
    "Course" 50 -> "Modules" 62     +12
    "Methodology" 108 -> "Method" 54  -54

  Net 23px back, against the 31px of clear air the note below measured at 1024.
  So the row is looser than it was, not tighter, which is the only reason two
  labels were allowed to grow.

  "Modules" rather than keeping "Course": with the catalog now called Courses, a
  nav reading "Courses, Course" is two items one letter apart pointing at
  different things. That section is about the format every module follows, which
  is what it is now called, and it matches `moduleFormat` in this file.

  "Method" rather than "Methodology": the section's own eyebrow says "The
  method", so the longer word was the odd one out, and the 54px it gives back is
  what pays for the two labels above. This is not the earlier fix that hid the
  item below xl, which was wrong for the reason recorded below and stays gone.
*/
/*
  SIX ITEMS, from seven, 7 Aug: "Modules" and "Method" pointed at two sections
  that are now one, so they are one item.

  It keeps the *second* slot rather than the sixth, because the merged section
  sits where the module section sat, third on the page, and a nav out of
  document order makes the underline travel backwards as a reader scrolls
  forwards — the note under "Review board" below is the long version of that.

  "Method" is the label that survived. The section's eyebrow says "The method"
  and its heading names the five steps; "Modules" now describes the strip at its
  foot rather than the band. It is also the shorter of the two, which the row's
  6px of clear air at 1024 does not mind at all.
*/
/**
 * `menu` is optional and only one item sets it.
 *
 * The array carried `as const` and the type was inferred, which made `menu` a
 * property of exactly one member of a six-way union — so `item.menu` was a type
 * error on the other five and the header could not branch on it. An explicit
 * element type says once that a nav item may have a menu, which is the fact,
 * and costs the literal-type narrowing nothing here depends on.
 */
export type NavItem = { label: string; href: string };

export const nav: readonly NavItem[] = [
  /*
    A ROUTE AND A MENU, from 8 Aug, and it was `/#courses` until then.

    Two things were wrong with the fragment and the second is the one that
    mattered. The obvious one: the first item of the primary nav was the only
    one that scrolled the homepage instead of going somewhere, so from any other
    route it navigated home and then jumped two thirds of the way down. The
    other: the five course pages had no parent, so their own breadcrumb — which
    reads "Courses / <this course>" — pointed its first item at a scroll
    position. `/courses` is a real page now and this is what points at it.

    `menu` is the only field in this array that changes how an item renders.
    Five courses behind one label is the difference between a nav that admits
    the catalog exists and one that makes a reader load a page to find out what
    is in it, and the header builds the panel from `courses` rather than from a
    second list written here — a menu that can disagree with the catalog is a
    menu that eventually will.

    IT COSTS 14px AT 1024, which is the width this row is always decided at: the
    label is unchanged and the caret is 12px plus a 2px gap. The note below
    measured 54px of clear air after "Judges", so the row finishes with 40. That
    is still the tightest item in the chrome and the next thing added to it has
    to be measured before it is written, exactly as before.
  */
  { label: "Courses", href: "/courses" },
  { label: "Method", href: "/#method" },
  { label: "Outcomes", href: "/#outcomes" },
  /*
    A ROUTE FROM 8 AUG, when the roster got its own page, and it moves for the
    same reason the board item did: the homepage band is one screen of five
    cards in a column of nine other bands, and the page is the thing a reader
    who clicked "Instructors" wants — five full cards, each with a profile to
    check, on a URL that can be shared, indexed and landed on.

    It keeps its slot. The band it used to point at is still the fourth one
    under the hero, so the item stays fourth in this list and the underline
    still travels forwards as a reader scrolls down the homepage; the note under
    "Judges" below is the long version of why that matters.

    The band keeps `id="instructors"` and its own place in the page. Nothing on
    the site points a fragment at it now, but an id costs nothing and a section
    that has always been addressable should stay addressable.
  */
  { label: "Instructors", href: "/instructors" },
  /*
    A NEW ITEM, and the first one that is a route rather than a section.

    Placed after Instructors because that is where the board sits on the
    homepage, and the note above is right that a nav out of document order makes
    the underline travel backwards as a reader scrolls forwards. It points at the
    page rather than at `/#board`: the homepage band is a six-card teaser and the
    footer already points at the route, so a nav item aiming at the teaser would
    be the one place on the site that sends you to the summary instead of the
    thing.

    "Judges", set by Roan: the board is being set up as judges, so the chrome
    says the word the program uses.

    MEASURED AT 1024, which is the width this row has always been decided at.
    The label is 81px there and the row finishes with 54px of clear air.

    It was chosen under a tighter budget than the one that now applies. When this
    item was added the nav still carried Modules, so it was a seventh label: at
    1024 the row had 12px of clear air, "Review board" is 103px and put the
    document 18px over, and the alternative on the table was shrinking the lockup
    to `brand.short` between 1024 and 1280, which is what the note above says the
    next 40px should come from. Roan chose the shorter label over the shorter
    brand name.

    Modules has since gone and the room came back, so "Review board" would now
    fit. The short label stays anyway: at 6 characters "Judges" is the narrowest
    item in the row bar FAQ, and it reads next to "Instructors" as the other half
    of one idea, who teaches and who judges.

    site-header.tsx does the rest: a route item cannot be found by the scroll
    tracker, so it is marked from `pathname` instead.
  */
  { label: "Judges", href: "/review-judge-board" },
  /*
    FAQ CAME OUT OF THE MAIN MENU on Roan's instruction, 9 Aug.

    It was the one item in the row that pointed at a band rather than at a
    subject, and the band it pointed at is the last one on the homepage — so the
    shortcut it offered was "scroll to the bottom of the page you are already
    on". The questions themselves are unmoved: the homepage band keeps
    `id="faq"`, `/courses/[slug]` renders its own `Questions` block, and the
    footer still links the section by name.

    That leaves four items in the bar, which also gives back the 40px of clear
    air the note above spends four paragraphs accounting for. The next item
    added here does not have to be measured against a full row.
  */
];

export const hero = {
  /*
    One word. "Free first module" restated the third fact row and the lesson
    card's own status chip, so the chip that opens the page was spending four
    words to say what the two elements under it already say. The cost claim is
    the only thing this slot is for.
  */
  eyebrow: "Free",
  /*
    Rewritten 7 Aug at Roan's request.

    It read "Deploy one AI workflow and measure what it changed", which is what
    the program does and not what it is. A headline in the imperative describes
    an action a reader has not agreed to take yet; naming the thing lets them
    decide whether they want it. "Practical AI training" is the category, and
    "ends with a deployed workflow" is the differentiator, so the sentence does
    both jobs the old one split between itself and the two paragraphs that used
    to sit under it.

    The deploy-and-measure mechanic is not lost: it is the method section's whole
    headline, the last two of the five module rows, and the outcomes band.
  */
  headline: "Practical AI training that ends with a deployed workflow",
  subtext:
    "Five role-based courses for operators and technical teams. You build on your own data, then launch it where the work happens.",
  /*
    TWO PARAGRAPHS CAME OUT of this fold on 7 Aug, at Roan's instruction, and
    since both were argued for in comments that are now gone, here is what they
    were and where their facts went.

    `structure` read "Choose one of five role-based paths. Every path contains
    five modules and follows the same deployment method." It was added because
    the page's three different fives (paths, modules, steps) were 2,000px apart
    and a first-time reader had to assemble the shape from all three. The
    subtext above still says five role-based paths, the second stat still says
    five modules, and the catalog immediately below the fold shows both, so the
    shape is now carried by the elements rather than narrated above them.

    `access` read "The first module opens without an account. A free account
    saves your work and unlocks modules 2-5." It was the only statement of the
    access model beside the button. That model is still on the page four times:
    the "Free" chip that opens the fold, the "Open" chip on the lesson card in
    this same fold, the course outline's own note, and two FAQ answers.

    Between them they were 209 characters of explanation standing between the
    subtext and the three stats, which is the part of a fold a reader scans
    rather than reads. Worth knowing if either is ever proposed again: the fold
    is now chip, headline, subtext, stats, control, byline, and there is no room
    in that sequence for a paragraph that explains the sequence.
  */
  /*
    Three stats with a glyph each, rather than three bulleted rows.

    Same three facts, restructured. A bullet row puts the value inline with its
    qualifier, so "Free", "5 modules" and "Module 1 is open" were each buried
    mid-sentence at the same weight as the words around them. Split into a value
    over a label, the three numbers land as three numbers.

    The labels are shorter than the old `rest` strings because the row is
    horizontal now and a two-line label breaks the baseline across three cells.
    Nothing dropped that the page does not state elsewhere: the mechanic is the
    Method section's whole headline, and the free-account unlock is stated twice
    in the course outline.

    The third stat used to read "14 min / Module 1, open to everyone", which
    sized the offer by its smallest piece: a reader scanning three numbers saw
    Free, five modules, and fourteen minutes, and the last one undercut the
    first two. It now states the volume instead. The fourteen-minute figure is
    still on the page twice, on the lesson card in this fold and in the final
    call to action, which is where a duration belongs.

    Its label was then wrong for one release: "5+ hours / Of content, open to
    everyone" claimed the whole library needs no signup, when "open" means
    exactly one thing everywhere else on this page, and the module outline four
    sections down marks four of the five rows "Free account". The label states
    what the hours are instead, and the access model is carried by the chip
    above, the lesson card beside it and the outline itself.

    `id` selects the glyph in hero.tsx.
  */
  stats: [
    { id: "cost", value: "Free", label: "Every course, every module" },
    { id: "modules", value: "8 modules", label: "Build, launch, then measure it" },
    /*
      "Of lessons and guided labs" became "Of instruction, plus your
      implementation work" on 6 Aug.

      The old label sized the whole program by its video runtime, which is the
      number this course is least about. Five hours of lessons is a small
      course; five hours of lessons plus a workflow you deploy at your own job
      is a different object, and the second half is the part a reader is
      actually buying. It also stops the figure from reading as a promise about
      how long the path takes, which it never was.

      Shortened again on 7 Aug, to fit two lines. The three stats are a fixed
      three-column grid and each label gets about 148px, so "implementation" on
      its own is 87px of a 148px line and forced this one to three lines while
      its neighbours sat on two: three cells, three different depths, in the row
      that exists so the numbers land as numbers. "Build time" is the same claim
      in words that fit.
    */
    { id: "open", value: "5+ hours", label: "Of instruction, plus your build time" },
  ],
  /*
    The byline under the fold's controls.

    It was one avatar and a line reading "Taught by Roan Weigert . Applied AI
    educator, San Francisco", sitting under a hairline that separated it from
    nothing: the control row above it already ends, and a rule there drew a
    boundary between the offer and the person making it. Both are gone.

    A facepile replaces it, built from the instructor roster, so the fold shows
    that this is a room of practitioners rather than one person. The count comes
    from the roster length rather than being typed, since the day a specialist
    is added or dropped the sentence should follow.
  */
  instructor: {
    name: "Roan Weigert",
    role: "Applied AI educator, San Francisco",
    /** The second line under the facepile. The first is generated. */
    rosterNote: "Practitioners who run these systems in production",
    image: { src: "/images/people/roan-weigert-studio.jpg", alt: "Portrait of Roan Weigert" },
  },
  /*
    The card in the third slot of the fold, and every field on it is a claim
    about one specific lesson: it says "Module 1, lesson 1", it says "14 min",
    and its action links to `courseHref("gtm", "curriculum")`.

    So it has to name that lesson. It said "Profile the workflow you want to
    improve", which is the method's first step rather than a lesson title, and
    no course on this site has a lesson called that — a reader who pressed Watch
    now landed on an outline whose first row said something else. The body had
    drifted a row further: "record how long it takes today, and write the brief"
    describes lesson 3, the lab "Record your baseline on time, cost or quality".

    Both now come from `courses[0].curriculum[0]`, where `lessons[0]` carries
    `minutes: 14` — which is where the duration on this card comes from too.
    Typed rather than derived because `hero` is declared above `courses` in this
    file and reading it here would hit the temporal dead zone; if the GTM
    course's first lesson is ever renamed, this card is the other half of that
    edit.
  */
  lesson: {
    label: "Module 1, lesson 1",
    status: "Open",
    title: "Map your customer journey end to end",
    body: "A working session. Map the revenue process you own from first touch to renewal, mark every handoff, and pick the one part of it you will rebuild.",
    duration: "14 min",
    access: "Open to everyone",
    action: "Watch now",
    poster: {
      src: "/images/scenes/lesson-recording.jpg",
      alt: "Roan Weigert recording a lesson at the studio microphone",
    },
  },
  /*
    The second frame in the fold's collage.

    Two photographs, not three. The reference layout this was built from runs a
    three-image collage, and there are only four photographs on this site. A
    third frame here would have put the entire library in one viewport. The
    third slot is a card instead, which is the better trade anyway: the lesson
    card is the thing the fold is for.

    The studio band that repeated these two frames plus the course poster,
    6,000px lower, is gone. page.tsx has the note.
  */
  aside: {
    src: "/images/people/roan-weigert-speaking.jpg",
    alt: "Roan Weigert holding a microphone and speaking to a room",
  },
} as const;

/*
  The credibility band under the fold is gone, and the four records it listed
  with it: the review board, the book, the keynote and the USPTO filing.

  Two of the four still have a home. The review board has its own section, with
  a seat-by-seat account of what each one reads, which is more than a chip
  saying it exists ever conveyed. Roan authoring on applied AI in media
  production belongs on a biography rather than in the second screen of a course
  page. The keynote and the patent number were the two the band was really for,
  and a conference name and a serial number are the least persuasive things a
  reader meets per pixel spent: they ask a visitor to be impressed rather than
  to be shown, 200px after a headline promising to show them.

  If these come back, they belong on an about page or in the footer, where a
  reader who wants credentials goes to look for them.
*/

/*
  The heading and the intro were both rewritten on 6 Aug, and the reason is the
  same for both: they were written in the program's own vocabulary.

  "Completion by deployment, in five steps" is a term of art this page invents.
  It is a good term and the FAQ defines it, but a section heading is not where a
  reader should meet a definition for the first time, and it named the
  *criterion* rather than the work. The new heading names the three verbs
  someone will actually do. The intro then walks the five steps in one sentence,
  so the diagram below it is a picture of a sentence the reader has already
  read, rather than the other way round.

  "Completion by deployment" is still the canonical name for the mechanic and
  still appears in the FAQ, which is where a term belongs.
*/
/*
  MERGED WITH `moduleFormat` ON 7 AUG, at Roan's request, and this object is now
  the one that carries the section.

  The page stated the five steps twice, 5,000px apart: this method section as a
  five-node timeline near the foot of the page, and the module section's outline
  card as five rows beside the course video near the top. Two lists of Profile,
  Build, Deploy, Measure, Document, differing in that the timeline carried the
  sentence explaining each step and the card carried the access state against
  it. Neither was complete on its own, which is the tell that they were one
  object that had been cut in half.

  So the timeline moved up into the module section and the two halves became one
  list: the step name, the sentence, the artifact it produces, and the chip on
  the one step that is open without an account. The standalone method section is
  gone, along with `moduleFormat.outline` and its label.

  What that costs is the argument order the page note in page.tsx set out, where
  the method sat *after* the catalog so a reader met five concrete paths before
  the abstraction that describes them. That trade was made deliberately: the
  method now reads immediately under the catalog rather than 5,000px later, and
  it reads with the video and the access model attached, which is what the
  timeline never had.

  `intro` is two sentences and neither of them walks the five steps any more.
  The old one did — "you establish a baseline, build the workflow, launch it in
  context, measure the result, and document what changed" — and it earned that
  length back when the thing under it was a diagram of five nouns. It is now a
  card that states each step in a full sentence 200px below, so the intro was
  reading the card aloud first, which is this page's oldest failure mode in
  miniature. What replaces it says the two things the card cannot: that the
  method is the same in every course, and what a module is made of. Those are
  also the two sentences that used to open `moduleFormat`.

  It buys no height, and this note said it bought 66px until the claim was
  measured. In the band's final layout the intro sits beside the heading rather
  than under it, in a 646px column, where the old three-sentence version sets to
  four lines and still does not reach the height of the heading block next to
  it. The 66px was real against the stacked header this was written for and was
  gone by the time the header changed. The band's height came from five other
  things and modules.tsx has that accounting, measured item by item.

  So this is an editorial edit and it stands on that: the card below states each
  step in a full sentence, and an intro that walks the same five steps first is
  the duplication this file keeps a standing note about.

  `access` is new on each step and only the homepage reads it. curriculum.tsx
  maps eight modules onto these five by `step` and reads `name` and `output`.
*/
export const method = {
  eyebrow: "The method",
  headline: "Build, deploy, and document one workflow in five steps",
  intro:
    /* "Each module pairs one focused lesson with one guided lab" was a count,
       and the curriculum has never matched it: modules run three to six items,
       and the mix moves with the subject — literacy 05 is four lessons and no
       lab because it is the module about where the material stops and counsel
       starts, and starter 04 is two labs and a template because there is
       nothing to explain, only something to do.

       The claim worth making is the one that is true of all forty: recorded
       lessons and guided labs, and the labs run on the reader's own work. */
    "Every course here runs on the same five steps, whatever you build. Every module mixes recorded lessons with guided labs you run on your own workflow.",
  produces: "You produce",
  steps: [
    {
      n: 1,
      name: "Profile",
      output: "Baseline and brief",
      text: "Choose one workflow you own and record its baseline on time, cost or quality.",
      access: "Open",
    },
    {
      n: 2,
      name: "Build",
      output: "Working workflow",
      text: "Guided labs assemble the workflow on your own inputs with current models.",
      access: "Free account",
    },
    {
      n: 3,
      name: "Deploy",
      output: "Live system",
      text: "The workflow goes live in the tools your team uses every day. Launching it completes the course.",
      access: "Free account",
    },
    {
      n: 4,
      name: "Measure",
      output: "Outcome sheet",
      text: "Measure the same workflow after launch. Both numbers land on one page.",
      access: "Free account",
    },
    {
      n: 5,
      name: "Document",
      output: "Completion record",
      text: "Brief, build, launch and measurement become one completion record you can share.",
      access: "Free account",
    },
  ],
} as const;

export type Course = {
  id: string;
  /**
   * The URL segment, and it is not `id`.
   *
   * `/courses/gtm` was the route until 8 Aug and it was the wrong URL for three
   * separate reasons. It carried no keyword a person or a crawler could read
   * ("gtm" alone is an initialism with a dozen expansions); it was invisible as
   * a search result, where the URL is printed under the title and is the one
   * line that says what the page is; and it shared no vocabulary with the h1 it
   * points at, so a link pasted into a chat window told the recipient nothing.
   *
   * The slugs are the titles, lowercased and hyphenated, which is the only rule
   * worth having here: it needs no second decision per course, it cannot drift
   * from the h1, and it puts the words somebody actually searches for
   * ("applied ai", "gtm teams", "ai literacy") into the address.
   *
   * `id` stays, unchanged, and is still the key everything internal uses:
   * `MoreCourses` filters on it, the badge order depends on it, and the five
   * old URLs redirect from it. Two fields rather than one renamed field is
   * deliberate — a slug is a public contract that changes when marketing copy
   * changes, and an id is a private one that must not.
   *
   * next.config.ts carries a permanent redirect from each old id, so every link
   * already in the wild still lands.
   */
  slug: string;
  badge: string;
  title: string;
  /** The artifact, printed as the largest line on the cover. */
  coverBuild: string;
  /** Ground token from globals.css, one hue per path. */
  ground: string;
  /**
   * The cover photograph, under the path's hue and the cover's type.
   *
   * These show the work, not a person the site will name. That distinction is
   * what makes them allowed under the imagery policy: the frame says "this is
   * the kind of job this path is for", which is the same thing the audience
   * line above it says in words, and it introduces nobody. The rule that has
   * not moved is the one about faces the page would never name in a context
   * that implies it knows them, which is why the instructor and board seats get
   * illustration and these get photography.
   *
   * `alt` documents what the frame shows and is deliberately not rendered. The
   * cover states its badge, its audience and its artifact as real text on top
   * of the image, so the photograph underneath is decorative and a screen
   * reader announcing it would only repeat the three lines it already read.
   */
  cover?: Img;
  level: string;
  duration: string;
  /**
   * Total hours of work, for `courseWorkload` in the JSON-LD.
   *
   * `duration` is a calendar span ("6 weeks") and was being converted straight
   * into `courseWorkload: P6W`, which is a different claim: schema.org means
   * that field as the effort a course asks for, so the structured data was
   * telling a listing this course takes six weeks of work rather than six weeks
   * of elapsed time at a few hours a week. The two differ by about 5x here.
   *
   * The number is the product of the hours-per-week line in `requirements` and
   * the weeks in `duration`, typed rather than parsed out of that sentence:
   * `requirements` is free copy and a regex over it would break the day
   * somebody rewords it. If either factor changes, this changes with it.
   */
  workloadHours: number;
  /** The three facts on the card meta row, each one different per course. */
  facts: readonly { label: string; value: string }[];
  summary: string;
  audience: string;
  build: string;
  skills: readonly string[];
  curriculum: readonly CourseModule[];

  /* ------------------------------------------- added for /courses/[id] */

  /**
   * The line under the h1 on the course page.
   *
   * `summary` cannot serve here. It has to survive a two-line clamp in a 292px
   * catalog card, so it is a compression of the promise rather than the promise.
   * This one has a 600px column and one job.
   */
  tagline: string;

  /**
   * The four cells of the stat bar that straddles the hero boundary.
   *
   * This is the slot the reference fills with a star rating, a ratings count and
   * an enrolment count. None of those exist, and the design spec says so in
   * writing: no rating stars, no price. Every value here is a fact the program
   * can back. If a fifth is ever added it is added because it is true, not
   * because the row looks short.
   */
  stats: readonly { value: string; label: string }[];

  /** The "What you'll learn" box. Six, so the two-column grid fills evenly. */
  whatLearn: readonly string[];

  /**
   * What a learner brings, never what they lack.
   *
   * The reference writes this block as "No prior experience needed", which is
   * two negation words in five and tells a reader nothing they can act on. The
   * copy rule at the head of this file already forbids it. These are written as
   * possessions: one workflow you own, permission to change it.
   */
  requirements: readonly string[];

  /** One string per paragraph, so the 68 character measure holds. */
  description: readonly string[];

  /** The rail's poster-first preview. Same shape VideoPlayer already takes. */
  preview?: {
    src: string;
    poster: string;
    posterAlt: string;
    card: { title: string };
  };

  /* ------------------------------------------------------ search listing only */

  /**
   * The `<title>`, which is not the h1.
   *
   * These pages were titled with `title` alone, so a result read "Applied AI for
   * GTM teams | AI Tech Education Academy" — six words that assume the reader is
   * already in the catalog. On the page that assumption is correct and the h1
   * should stay exactly as it is. In a listing it is the whole of what the page
   * gets to say, next to competitors stating the format, the level and the cost.
   *
   * So each of these leads with the differentiator ("Free"), keeps the phrase
   * somebody would actually type, and states the outcome. The layout template
   * appends " | AI Tech Education Academy", which is 28 characters, so these are
   * written to sit near 45 and land inside the ~60 a result shows before it
   * truncates.
   *
   * Every claim in here is one the page already makes: the courses are free,
   * they are self-paced, and each finishes with a deployed workflow.
   */
  seoTitle: string;

  /**
   * The meta description, which is not the tagline.
   *
   * `tagline` runs 150 to 190 characters because it has a 620px column and a
   * reader who has already arrived. A description is cut at roughly 155, and two
   * of the five taglines were losing the clause that says what the reader ends
   * up holding — the most persuasive part of the sentence, silently truncated.
   *
   * These are written to ~150, front-load the role, and close on the artifact.
   * They are not a second promise: every one is a compression of the tagline
   * above it, and if the tagline changes this has to change with it.
   */
  seoDescription: string;

  /**
   * Terms this course should be findable by.
   *
   * `keywords` carries no ranking weight at Google and has not since 2009, and
   * that is not what these are for. They go into the page's metadata and into
   * the JSON-LD `about` field, where they are the machine-readable statement of
   * what the course covers — and they are the list to check a title and
   * description against when either is rewritten.
   *
   * Drawn from the skills and the audience already in this record rather than
   * invented, so there is nothing here the page does not teach.
   */
  keywords: readonly string[];
};

/** One row inside a module. */
export type Lesson = {
  /**
   * Stable identity, and the public URL segment.
   *
   * ------------------------------------------------- why this is not a position
   *
   * Lessons used to be keyed by their slot: the seed script upserted on
   * `(module_id, position)` and the route was `/learn/<course>/04/02`. Both are
   * the same bug. `lesson_progress` points at a lesson's uuid, so re-seeding a
   * module after inserting a lesson at slot 2 moved every uuid below it up one
   * row, and every completion under it silently became a completion of the wrong
   * lesson. Nobody would see it happen; the counts stay plausible.
   *
   * The slug fixes it because it does not move. `position` is now presentation
   * only — reorder freely, the identity is here.
   *
   * ------------------------------------------------------------ how to change it
   *
   * These were generated once from the names and are hand-maintained from then
   * on. **Never re-derive a slug from `name`.** Renaming `name` is a typo fix;
   * renaming this is a data migration that detaches every learner's completion
   * of that lesson. If a lesson is genuinely replaced, changing the slug is the
   * correct way to say so — the old row and its completions are then swept.
   *
   * Unique within a module, asserted at module load below.
   */
  slug: string;
  name: string;
  kind: "lesson" | "lab" | "template";
  /**
   * Runtime, where a real one exists.
   *
   * Optional on purpose, and this field is the honesty rule expressed as a type.
   * Eight modules across five courses is roughly 120 lessons, and 120 plausible
   * durations typed into this file are 120 claims the program cannot back. The
   * one real figure on the whole site is module 1 lesson 1 at 14 min, which the
   * hero lesson card already states.
   *
   * Absent renders as a lesson count and no duration, and nothing anywhere sums
   * these into a total runtime.
   */
  minutes?: number;
};

export type CourseModule = {
  /** "01" through "08". A string so it prints without padding at the call site. */
  n: string;
  name: string;
  /** One line on what this module is for, at the top of the open panel. */
  summary: string;
  /**
   * Which of the five method steps this module serves.
   *
   * Eight modules against a five-step method breaks the 1:1 mapping the old five
   * had, and without this the method section becomes a diagram of nothing. One
   * integer per module keeps the two coherent and lets the open panel print
   * "Method step 2, Build" against `method.steps`.
   */
  step: 1 | 2 | 3 | 4 | 5;
  lessons: readonly Lesson[];
  /** What the learner holds when the module closes. Exactly one per module. */
  artifact: string;
  /**
   * "open" is module 01 only. Green is semantic on this site and this is the one
   * field that turns it on.
   *
   * It replaces two vocabularies that said the same thing: `open?: boolean` on
   * the old curriculum rows, and `access: "Open" | "Free account"` on the module
   * outline. The visible strings now live in one component instead of in the data
   * twice.
   */
  access: "open" | "account";
};

/**
 * Derived rather than stored.
 *
 * Every course carried `modules: "5 modules"` as a string that had to agree with
 * `curriculum.length`, and the move to eight is exactly the edit where a hand
 * maintained count goes wrong. There is now one source for the number.
 */
/*
  Three counters and one URL builder used to live here beside the array they
  read. `courseHref` went with the catalogue and became async — resolving an id
  to a public slug is a query now, and most call sites turned out to hold the
  course already and can interpolate `/courses/${course.slug}` directly.

  These three stayed, and the reason is a boundary rather than tidiness. They are
  pure functions of the `Course` type with no data of their own, and three CLIENT
  components call them. `catalog.ts` imports the request-scoped Supabase client,
  which imports `next/headers` — so a client component importing a counter from
  there pulls `next/headers` into the browser graph and every course page 500s
  with a message about the Pages Router that names none of this.

  A type and its pure helpers belong in a module with no runtime dependencies.
  `catalog.ts` re-exports them, so server code can keep importing both from one
  place.
*/

export const moduleCount = (c: Pick<Course, "curriculum">) => `${c.curriculum.length} modules`;

export const lessonCount = (m: { lessons: readonly unknown[] }) =>
  `${m.lessons.length} ${m.lessons.length === 1 ? "lesson" : "lessons"}`;

export const totalLessons = (c: Pick<Course, "curriculum">) =>
  c.curriculum.reduce((n, m) => n + m.lessons.length, 0);

/*
  Curriculum ordering was corrected on 6 Aug. Module 01 of every course used to be
  a topic overview while the profiling session sat at 02, which contradicted the
  page in two places: the outcome bullets say the brief is written in module 1,
  and the FAQ says the baseline is recorded in module 1. Since 01 is also the
  free module, the swap doubles as the better funnel: the open lesson is now the
  one where a reader produces something.

  FIVE MODULES BECAME EIGHT on 7 Aug. This is the largest content change the site
  has taken and it is worth recording why, because the five were not wrong.

  The five were the five method steps with a course-specific noun dropped into
  each: "Profile your pipeline and set a baseline", "Build the agent workflow",
  "Deploy into the revenue stack". Read down a column they are a clear promise.
  Read across all five courses they are the same five rows five times, which is
  what the method section already says once, and they told a reader nothing about
  what is actually taught. A course page whose curriculum is a restatement of the
  methodology has no curriculum.

  The eight come from the market. Roan's competitor research
  (reserch/udemy-competitor-research-2026-08-07/UDEMY-COMPETITOR-RESEARCH.md)
  screened the three strongest Udemy courses in each of these five subject areas
  and derived a recommended structure per course from what they collectively
  prove. That structure is what these eight are, close to verbatim, per course.
  Its finding for this course in particular: no competitor joins marketing, sales
  and revenue operations into one operating system, and modules 03, 04 and 06 are
  where this one does.

  The method survives intact and is now carried by `step` rather than by the
  module titles. Eight modules across five steps, so the mapping is 1 / 2,2,2,2 /
  3 / 4 / 5 in four of the five courses. That field is load-bearing: without it
  the method section becomes a diagram of a shape the curriculum no longer has.

  WHAT IS DELIBERATELY ABSENT. Every module states a lesson count and only one
  lesson on this entire site states a duration, module 1 lesson 1 at 14 min,
  because it is the only one that has been recorded. The reference page this was
  built from prints "41h 41m total length" in three places, and the temptation to
  match it with 120 plausible numbers is the single most likely way this file
  starts lying. `Lesson.minutes` is optional for that reason and nothing sums it.
*/
/*
  The five courses used to be written out here, as 965 lines of literal.

  They live in Postgres now — `src/lib/catalog.ts` reads them — because a course
  that only exists in a TypeScript file can only be created by somebody who can
  edit TypeScript and deploy, which is not who runs a school. The admin console
  authors them instead.

  What stayed behind is directly above: the `Course`, `CourseModule` and `Lesson`
  types. They are a good description of what a course is, every component on the
  site is written against them, and `catalog.ts` maps its rows into exactly that
  shape. One definition, two homes for the values, and the values are gone from
  this one.

  The counters that used to sit beside the array — totalLessons, moduleCount,
  lessonCount — moved with it, along with `courseHref`, which became async
  because a slug is now a query rather than an array lookup.
*/

/*
  THE THREE HEADER LINES ARE GONE, 7 Aug, and this object no longer heads a
  section of its own.

  They were rewritten that morning — eyebrow "How each module works", heading
  "Learn the method. Apply it to your work." — and then the section they headed
  was merged with the method section the same day. `method` above carries the
  eyebrow, the heading and the intro for the merged band, and the note there has
  the reasoning. The one sentence worth keeping out of the old intro, that a
  module is a lesson plus a lab on your own workflow, is now the second sentence
  of `method.intro`.

  What is left here is everything the merged band needs that the method never
  had: the course video, the access model, and what every module contains.
*/

/*
  Lesson slugs must be unique inside their module, and this file used to assert it
  at module load by walking the array and throwing on a duplicate.

  It is `lessons_module_slug_key` in Postgres now — a unique index, added with the
  migration that moved the catalogue. That is strictly better than the loop it
  replaces: the loop could only see courses written in this file, and the console
  can now create lessons that never pass through it. The reason it mattered has
  not changed — a slug is the identity a learner's progress hangs on, and two
  lessons sharing one silently collapse into a single row and take one lesson's
  completions with them.
*/

export const moduleFormat = {
  video: {
    src: "/media/tutorial-2.mp4",
    /*
      The poster was a frame of the clip itself, which shows somebody this site
      has no name for. It is now a frame of Roan under the same title card. The
      clip behind it is still placeholder footage and is the last non-Roan
      asset on the page; it goes when real course footage exists.
    */
    poster: "/images/scenes/interview-session.jpg",
    posterAlt: "Roan Weigert seated at a microphone in the studio",
    caption: "Course preview, 2 min",
    /*
      Designed title card over the frame, so the resting state states its
      subject rather than showing a raw frame of somebody mid-gesture.

      The four beats that used to sit under the title are gone: "Lesson, Guided
      lab, Launch, Measure" restated the section heading ("one lesson and one
      lab") and its intro ("one recorded lesson with a guided lab") for a third
      time, and they were burning 79px of a 356px frame to do it, which is 38%
      of the frame at 390px. They were also the block's second chip vocabulary,
      12px outlined squares 130px from the 11px uppercase filled pills in the
      outline card, in one 1216px row.
    */
    card: { title: "One workflow, from first sketch to live" },
  },
  /*
    The access model, stated once as an unlock rather than as four gates, and
    now the line that reconciles the two numbers on the page: eight modules on
    every catalog card, five steps in the card above this note.

    The five rows it used to sit under lived here as `outline`, headed "The five
    steps" and numbered 01 to 05. They were never modules — they were the method
    steps with the access state attached, which is why they were identical
    across all five courses and why each one named an artifact rather than a
    subject. The merge folded them back into `method.steps`, where the sentence
    explaining each step already was, and the access state went with them.
  */
  accessNote:
    "Eight modules run across these five steps. One free account unlocks modules 2 to 8 in every course, and the account stays free.",
  includesLabel: "Every module includes",
  includes: [
    "Recorded lessons from people who run these systems",
    "Guided labs on your own workflow",
    "Templates for the brief and the outcome sheet",
    "A recorded baseline and a measured result",
  ],
  /*
    Moved out of `includes` on 12 Aug, because it was the one line in that list
    that is not true of every module. The other four describe what a module
    contains; the certificate arrives once, for the course, when the last of the
    eight is finished. Under a heading reading "Every module includes" it read as
    a certificate per module.

    It is its own line in the enrol rail now, under the list, which is also where
    a reader deciding whether to start is asking what they end up holding.
  */
  completion: "Finish all eight and the certificate is issued the same day, free",
} as const;

/*
  The outcome sheet is real markup rather than a flattened export, so the
  figures stay crisp, selectable, translatable and reachable by a screen
  reader. The headline row above it is the one element on the page set above
  44px, which every reference does exactly once.

  The caption names its own sample size. One deployment is what exists, and
  saying so costs less than a reader working it out.
*/
export const outcomes = {
  headline: "Leave with evidence of what changed",
  stat: {
    /*
      Added 6 Aug. The page's single largest element was an unattributed pair of
      numbers: 6 h 00 becomes 40 min, at 56px, directly under a heading reading
      "Leave with evidence of what changed". Read in that order it parses as a
      claim about the program, which it is not. It is one learner, on one path,
      on one workflow, and the caption said so in 13px underneath, after the
      figure had already been read.

      Labelling it above the numbers changes what the figure is before anyone
      reads it. "Example" is the load-bearing word and it is first.
    */
    label: "Example Course A outcome",
    before: "6 h 00",
    after: "40 min",
    caption:
      "Time to produce weekly pipeline reporting, before and after one learner deployed their workflow.",
  },
  sheet: {
    label: "Outcome sheet",
    title: "Weekly pipeline reporting",
    meta: ["Course A", "Module 7", "Measured 14 days after launch"],
    columns: { measure: "Measure", before: "Before", after: "After" },
    /*
      `n` carries each figure as a number in one unit, so the sheet can draw the
      after value as a fraction of the before value and state the reduction.
      Nothing new is claimed: the bar and the percentage are both computed from
      the two figures already printed on the row.
    */
    rows: [
      { measure: "Time per cycle", before: "6 h 00", after: "40 min", n: { before: 360, after: 40 } },
      { measure: "Manual steps", before: "23", after: "4", n: { before: 23, after: 4 } },
      { measure: "People involved", before: "3", after: "1", n: { before: 3, after: 1 } },
    ],
    status: "Deployment verified",
    footnote: "One completed Course A implementation, measured by the learner.",
  },
  /*
    Condensed on 7 Aug, at Roan's request: he has one worked example and not yet
    the rest of the evidence, so the section should show the example and stop.

    What it was: the figure, then a "Live system / Your deployed workflow" block
    with a paragraph and four bullets, then the outcome sheet, then two more
    cards headed "Your outcome sheet" and "Your completion record". Three of
    those four blocks were describing the same three artifacts at three
    different lengths, and the second card described the sheet that was printed
    in full 200px to its left.

    What it is: the figure, the sheet, and one three-item list of what a learner
    leaves holding. Same three artifacts, named once each. The prose that went
    was not deleted so much as compressed into the `text` lines here, and the
    canonical completion sentence it carried still appears in the FAQ, which is
    where a definition belongs.
  */
  leaveWith: {
    label: "You leave with",
    items: [
      {
        title: "A live workflow",
        text: "Running in the tools your team already uses, and owned by you after the course.",
      },
      {
        title: "An outcome sheet",
        text: "The same measure taken before you launched and after, on one page.",
      },
      {
        title: "A certificate",
        text: "Your name, the course and a reference anyone can check, issued the day you finish.",
      },
    ],
  },
} as const;

/**
 * The certificate band, and why it is three sentences rather than a section.
 *
 * A certificate is a supporting reason to take a free course and never the
 * reason. The page above it has already spent two sections on the workflow that
 * runs and the measure that proves it, which is what the program is actually
 * for, and a certificate given more room than that would be the site advertising
 * the receipt instead of the result.
 *
 * So: a headline, one paragraph, and the four fields that are printed on it. The
 * fields are the argument. Every credential claim on the internet asks to be
 * believed; this one names exactly what it says and where to check it, which is
 * the standard the rest of this site holds itself to.
 *
 * No sample image and no example reference. A certificate belongs to the person
 * named on it, and a specimen on the homepage is either somebody's real record
 * published as an advertisement or an invented one, and both are worse than the
 * list below.
 */
/*
  THE COMPLETION RECORD, AND IT LIVES ON THE COURSE PAGES NOW.

  This was a homepage band, between Outcomes and Instructors, and Roan asked for it
  off: "remove this block […] of the homepage. on the individual course add this
  individual information there, best way possible."

  He is right about where it belongs, and the reason is in the copy itself. Every
  line of it was written in the general — "Finish a course", "Which of the five" —
  because on the homepage there is no course to be specific about. That is the
  weakest possible version of a section whose entire job is to make a document feel
  real. On a course page the same four facts become concrete: this course, its
  lesson count, its own hue on the printed sheet.

  It is also a supporting reason to take a free course and never the reason, and a
  reader on the homepage has not yet chosen anything to finish. A reader on a course
  page has, which is the moment the question "and what do I have at the end" is
  actually being asked.

  `headline` and `intro` are therefore written for a course page and take the
  course's title. `fields.items` carries an `id` so the course page can specialise
  the one item that has to name the course while sharing the other three.
*/
export const certificate = {
  label: "Completion record",
  headline: (title: string) => `Finish ${title} and your record is issued the same moment`,
  intro:
    "Ticking the last lesson issues it. It arrives with your name on it, downloads as a PDF or an image, and carries a reference that anyone you send it to can check on this site.",
  fields: {
    label: "What is printed on it",
    items: [
      {
        id: "name",
        title: "Your name",
        text: "As it is on your account, with your photograph if you added one.",
      },
      {
        id: "course",
        title: "The course",
        /* Replaced on a course page with the course's own title and lesson count.
           This is the fallback for any surface that has no single course to name. */
        text: "Which course, and confirmation that every lesson in it is complete.",
      },
      {
        id: "reference",
        title: "A reference",
        text: "Unique, permanent, and readable aloud over a phone.",
      },
      { id: "date", title: "The date", text: "The day you finished, recorded when it happened." },
    ],
  },
  facts: ["Issued automatically", "PDF or image", "Free, like the courses"],
  /* Points at the questions block that states the price, because the question a
     completion record raises on a free program is what it costs. A same-page
     fragment now rather than `/#faq`: this section renders on the course pages,
     which carry their own questions block, and the old href threw the reader back
     to the homepage to read an answer that was 400px below them. */
  action: { label: "What it costs", href: "#faq" },
} as const;

export type Person = {
  id: string;
  name: string;
  /**
   * The line under the name.
   *
   * Optional as of 7 Aug, and the reason is the point of this whole type now.
   * Four of the five people here are real, named practitioners whose portraits
   * and profile links Roan supplied, and nobody has supplied their job titles.
   * A role line is a claim about a specific human being, so an absent one has
   * to render as absent rather than as a plausible sentence. The card handles
   * it: no role, no line.
   *
   * These will be the people's own LinkedIn headlines, verbatim, once those are
   * pasted in. Nothing else goes here.
   */
  role?: string;
  /**
   * A second affiliation, under the headline. The company a person co-founded
   * rather than the one that employs them, in every case here.
   *
   * `url` is only set where a URL was actually supplied. An org with no link
   * renders as plain text rather than as a guess at its domain.
   */
  /**
   * The organisation, with the person's role in it kept as a separate field.
   *
   * `name` used to hold the whole string — "Co-founder, n-aible" — because that
   * is what the card prints, and `instructorsJsonLd` passes `name` straight into
   * `affiliation`. So the structured data asserted the existence of companies
   * literally called "Co-founder, n-aible" and "Co-founder, Bayhaus Creative":
   * two organisations that do not exist, published as fact about two real
   * people.
   *
   * Split rather than stripped at the markup layer. A regex taking everything
   * before the first comma would mangle the first org name that contains one,
   * and the fix belongs where the two facts are, not where they are rendered.
   * The card still prints "role, name" — `InstructorCard` joins them — so
   * nothing visible changes.
   */
  org?: { role?: string; name: string; url?: string };
  /** A sentence about what this person does. Same rule as `role`. */
  detail?: string;
  /** What this person records or reviews, printed as the card's head. Same rule. */
  scope?: string;
  /** Path hue from globals.css, so the card ties to the path it serves. */
  ground: string;
  /** Portrait. Absent means the slot renders marked-empty rather than faked. */
  photo?: Img;
  /**
   * Employer mark, drawn on a light chip in the card's top corner.
   *
   * All four are normalised to a common height by scripts/prepare-logos.mjs,
   * which trims each file to the box its own ink occupies first. Without that
   * step the Berkeley wordmark rendered about six pixels tall next to an
   * eighteen-pixel CodeRabbit typemark, because its source canvas is square and
   * the mark floats in the middle of it.
   */
  logo?: Img;
  lead?: boolean;
  /** Full LinkedIn profile URL. Renders the profile link when present. */
  linkedin?: string;
  /** One more link chip beside LinkedIn: a personal site or a company. */
  site?: { label: string; href: string };
  /** Companies this person has invested in. Named and linked, never counted. */
  investments?: readonly { label: string; href: string }[];
  /**
   * A book this person wrote, as a row inside their card.
   *
   * ON THE PERSON RATHER THAN ON THE PAGE, and that is the whole placement
   * decision rather than a detail of the type.
   *
   * A book by the lead instructor was one of four chips in the credibility band
   * that used to sit under the fold, and the note further up this file records
   * why that band went and what it said about this one: "Roan authoring on
   * applied AI in media production belongs on a biography rather than in the
   * second screen of a course page." Roan asked for the book back on the
   * homepage on 9 Aug, and the biography is where it went, because that is the
   * one place on this page where it is a fact about a named human being rather
   * than a chip asking to be admired.
   *
   * The consequence of putting it here is the point: it travels with the card,
   * so it renders on /instructors too, and it is impossible to state the book
   * without the author beside it.
   *
   * `blurb` is the author's own description, from the book's own page. Nothing
   * here assesses the book, and nothing claims it is required, recommended, or
   * connected to any course. It is a thing this instructor wrote.
   */
  book?: Book;
};

export type Book = {
  /** The eyebrow over the row. */
  label: string;
  title: string;
  blurb: string;
  href: string;
  cover: Img;
};

/*
  The parts of a roster card that are copy rather than columns, attached to the
  person by profile URL.

  ====================================== why this is not a column on the roster

  Because the roster is a table now and these are not roster data.

  Two fields ended up here and both arrived the same way, which is the reason
  this is a general map rather than a one-off for the book.

  `book`. For half a day it sat on the `roan` entry in `instructors.people`
  below, which was the array that rendered the instructor band when it was
  written. That array stopped rendering anything in the same pass — `lib/roster.ts`
  reads rows out of Postgres and builds `Person` objects from them — so a field
  set in this file reached no card at all. The merge was clean and the feature
  was gone, which is the quiet way that failure arrives.

  `investments`. The same move dropped this one without anybody writing a line
  of it: `Person.investments` has existed since the lead card was built, the
  `roster` table has no column for it, and `toPerson` therefore had nothing to
  build the field from. The card renders the line only when it is present, so
  "Investor in Destaquei, Produtoras de Video and Bayhaus Creative" simply
  stopped being on the page. Nothing errored. Roan asked for it back.

  The fix in both cases could have been more columns on `roster`, and it should
  not be. roster.ts states the line: rows are the people, and the copy around
  them stays here because "putting it in a table would mean a migration to fix a
  comma". One book by one author and three companies one person has invested in
  are squarely on the copy side of it. Nobody edits either in the console, there
  is no form for them, and a migration plus nullable columns plus admin fields to
  carry four hyperlinks is a schema built for a hypothetical.

  What would move this to columns is a console: the day somebody who is not a
  programmer needs to add a book, it needs a form, and a form needs a table.

  ============================================================ keyed on linkedin

  `linkedin` matches `roster.linkedin`, and that is a deliberate choice of key
  rather than the only one available.

  Not the row id: those are generated uuids, so writing one into this file would
  bind editorial copy to a database primary key that a reseed changes. Not the
  name: two people share a name eventually and nothing stops it. Not `lead`,
  which was the tempting one and the worst — "whatever card is first carries
  Roan's book" is a sentence that stays true until the lead changes and then
  quietly attributes his book, and his investments, to somebody else.

  A LinkedIn URL is the one field on a roster row that identifies a specific
  human being, it is already required for the card's profile link, and it is
  public. If a person leaves the roster the match simply fails and nothing
  renders, which is the correct failure: no person, no copy about them.

  A LIST RATHER THAN A RECORD, and not for style. `personCopy[row.linkedin]` on
  an object literal answers `__proto__` and `constructor` with something truthy,
  and the key here comes out of a database column. `find` on a list cannot.

  ------------------------------------------------------------- what is claimed

  Of the book: that this person wrote it. `title` and `blurb` are the book's own
  listing copy, supplied by Roan, verbatim apart from the eyebrow. Nothing
  recommends it or ties it to a course — the media path teaches applied AI for
  video and this book is about world models in video, and drawing that line into
  a sentence is exactly the kind of claim this file exists to refuse. A reader
  who wants the connection can see it.

  Of the investments: named and linked rather than counted. "Investor in three
  companies" is the kind of line that asks to be believed; three names a reader
  can open is the kind that can be checked, which is the standard the rest of
  this page holds itself to.

  --------------------------------------------------------------- the cover art

  The author's own render, CROPPED TO THE JACKET, and the crop is the point
  rather than housekeeping. What Roan supplied is an 832 x 1023 photograph of the
  book standing on a table in front of a film crew: a good image at a good size
  and worthless at 40px, where the jacket was about a third of a very small
  rectangle and the rest was blurred studio. The asset is the front face alone —
  `extract({ left: 203, top: 363, width: 387, height: 628 })` off that render,
  measured against a 100px grid — which is 0.616, a book's own proportions, so
  the frame in the card crops nothing.

  Still deliberately too small to read. The row underneath says what the book is,
  and a cover set large enough to be legible would be a second, competing
  statement of the same title.
*/
export type PersonCopy = Pick<Person, "book" | "investments">;

export const personCopy: readonly ({ linkedin: string } & PersonCopy)[] = [
  {
    linkedin: "https://www.linkedin.com/in/-roan/",
    book: {
      label: "The book",
      title: "World Models Applied in Video Production",
      blurb:
        "A comprehensive technical guide to how world models are reshaping video, from concept to production pipeline.",
      href: "https://roanwe.gumroad.com/l/World-Models",
      cover: {
        src: "/images/book/world-models-cover.webp",
        alt: "Cover of World Models Applied in Video Production by Roan Weigert",
      },
    },
    investments: [
      { label: "Destaquei", href: "https://destaquei.com.br/" },
      { label: "Produtoras de Video", href: "https://www.produtorasdevideo.com.br/" },
      { label: "Bayhaus Creative", href: "https://bayhauscreative.com/" },
    ],
  },
];

/*
  REAL PEOPLE, as of 7 Aug 2026. This roster is no longer a set of placeholders.

  Five named practitioners, five studio portraits from the same shoot, five
  LinkedIn profiles. That retires the whole apparatus this section used to need:
  the illustrated figures with no faces, the "a person is coming but not which
  one" argument, the GMI stand-in wordmark. All of it existed because the seats
  were real and the names were not, and the names are here now.

  WHAT IS STILL MISSING, and why it is missing rather than written.

  Nobody has supplied job titles as such. Four of these are named human beings with
  public profiles, and a role line under a real person's photograph is a claim
  about that person's employment. Inventing one is not a placeholder, it is a
  misrepresentation, and it is the exact failure the imagery policy at the head
  of this file was written to prevent, only in words instead of pixels.

  So `scope` and `detail` are absent on all four, and the card renders nothing
  where they would go. `role` is filled, and the note below is why: it is each
  person's own LinkedIn headline, verbatim, which is a description they authored
  rather than one this site made up. Which path each of them records is still
  unknown, and that is what `scope` is waiting on.

  Headlines are taken verbatim, which is what
  Roan chose. One line each into `role` below and the cards complete themselves.
  Nothing needs to change in the component.

  Surnames are the other gap. Hendrik and Loc came through on first name only,
  and a surname guessed from a profile slug is the same class of invention as a
  job title, so they run as given until somebody confirms them.
*/
export const instructors = {
  headline: "Learn from people who run these systems in production",
  /*
    One line, and it is a summary of the roster rather than an explanation of
    how the roster is organised.

    The previous intro spent both its sentences on the division of labour:
    Roan writes the curriculum, four specialists record the deep dives, one per
    long path. Every word of that is true and all of it is administrative. It
    also stated facts the grid states better, since the lead card is labelled
    "Lead instructor" and says on its face that he writes the curriculum, and
    each specialist card names the path it records.

    What a reader wants from an intro to a roster is the range of the room, so
    that is what this one gives: four disciplines, named. Nothing is lost,
    because the arrangement is visible in the layout and the detail is on the
    cards.

    Corrected 7 Aug, when the roster stopped being placeholders. The line read
    "revenue operations, media production, data governance, and AI
    infrastructure", which described the four invented seats it was written
    against. The real four are a developer experience engineer, a developer
    advocate, an academic dean and an AI strategy lead in higher education, and
    none of them is any of those. An intro that summarises a roster has to be
    re-derived every time the roster changes, or it quietly becomes a claim
    about specific people that none of them would recognise.
  */
  intro:
    "Working practitioners across developer experience, AI tooling, higher education, and film.",
  /*
    THE ROSTER PAGE, added 8 Aug when /instructors got its own route.

    Three fields, and each one exists because a page a stranger can land on
    cold has to answer a question the homepage band never has to: the band is
    read after nine other sections, and the page is read first.

    `pageIntro` is the band's `intro` plus the sentence the band leaves to its
    own layout. On the homepage the division of labour is visible — one wide
    dark card marked "Lead instructor" over four portraits — so writing it out
    would be describing what a reader can see, which is the failure this file
    keeps a note about. On a page that a search result drops somebody onto, the
    same sentence is the first thing that explains the roster.

    `seoDescription` is 148 characters, front-loaded with the four disciplines,
    because a result line is truncated from the right at about 155 and the
    disciplines are the part a query would match. It names no individual: a
    person's name in a meta description is a promise that the page is about
    them, and this one is about five people.

    Nothing here characterises any of the five. The roles on the cards are still
    each person's own LinkedIn headline, verbatim, per the note above.
  */
  pageIntro:
    "Working practitioners across developer experience, AI tooling, higher education, and film. The lead instructor writes the curriculum and records every core lesson, and the specialists record the deep dives.",
  /*
    "and who records what" was the tail of this line until it was checked
    against the page. Only the lead has a `scope`; the four specialists
    deliberately have none, because which path each of them records is the one
    thing nobody has confirmed. A description that promises an answer the page
    withholds is the same fabrication as printing the answer, moved to the one
    place a reader cannot see it and a result page can.
  */
  /* NO ROSTER COUNT, 9 Aug. Roan's rule: "everything u put has to be dinamic." A
     numeral typed into a description is a numeral nobody remembers to edit the day a
     sixth instructor is seated, and this one is a count of a table the page already
     queries. The description says what the roster IS rather than how long it is,
     which is also the thing a search result needs. */
  seoDescription:
    "The practitioners who teach here: developer experience, AI tooling, higher education and film. Every instructor has a public profile to check them against.",
  /*
    The footnote is gone. It ran three lines explaining that the portraits are
    illustrations and that names arrive when employers clear them, under a grid
    where both facts are already visible: the drawings are self-evidently
    drawings, and every card says what its holder does rather than who they are.
    A caption that describes what a reader can see spends three lines to tell
    them they are looking at what they are looking at.

    The board keeps its footnote, because that one carries a fact the cards
    cannot show: that the seats are filled and reviewing.
  */
  people: [
    {
      id: "roan",
      name: "Roan Weigert",
      /*
        Taken from roanweigert.com's own llms.txt, which is as close to a
        self-description as this gets. The site's summary is "Developer
        Relations AI Engineer, hackathon judge, and AI content creator in San
        Francisco"; the headline keeps the title and the city, and the two
        supporting facts move into the detail so the role line stays a role.
      */
      role: "Developer Relations AI Engineer, San Francisco",
      detail:
        "Hackathon judge and AI content creator, and host of the AI Insights San Francisco podcast. Writes this curriculum and records every core lesson.",
      scope: "All five courses",
      ground: "var(--accent)",
      photo: { src: "/images/people/roan-weigert-studio.jpg", alt: "Portrait of Roan Weigert" },
      linkedin: "https://www.linkedin.com/in/-roan/",
      site: { label: "roanweigert.com", href: "https://roanweigert.com/" },
      /* NEITHER THE BOOK NOR THE INVESTMENTS ARE HERE, and they are the reason
         to distrust everything else in this array.

         This whole literal stopped rendering when the roster became a table;
         `lib/roster.ts` builds the cards from Postgres rows now, and the only
         thing still reading it is one `sameAs` in seo.ts. The investor line sat
         right here, correct and unreachable, for as long as it took somebody to
         notice it had left the page. Both fields live in `personCopy` above,
         joined to this person by profile URL, which is the version that reaches
         a card. */
      lead: true,
    },
    /*
      The four specialists, in alphabetical order by first name.

      No ranking is implied and none should be. Whatever ordering looked
      meaningful here would be a claim of its own, and these four do four
      unrelated jobs; alphabetical is the one order that says nothing.

      Headlines are each person's own, as they write them on LinkedIn. That was
      Roan's instruction and it is also the safest rule available: a headline is
      the one description of somebody that they authored themselves, so nothing
      on these cards is this site's characterisation of a real person.

      Still missing, and still deliberately absent rather than guessed: which
      path each one records. `scope` stays off until somebody says.
    */
    {
      id: "aaron",
      name: "Aaron Jimenez",
      role: "Developer Experience Engineer",
      org: { role: "Co-founder", name: "n-aible" },
      ground: "var(--path-a)",
      photo: { src: "/images/people/aaron-jimenez.jpg", alt: "Portrait of Aaron Jimenez" },
      logo: { src: "/images/logos/n-aible.png", alt: "n-aible" },
      linkedin: "https://www.linkedin.com/in/aaron-jimenez-086ba4181/",
    },
    {
      id: "hendrik",
      name: "Hendrik Krack",
      role: "Developer Advocate at CodeRabbit",
      org: { role: "Co-founder", name: "n-aible" },
      ground: "var(--path-b)",
      photo: { src: "/images/people/hendrik.jpg", alt: "Portrait of Hendrik Krack" },
      /* The employer mark, not the company he co-founded: Aaron's card carries
         n-aible and two identical marks side by side would read as one
         organisation with two seats rather than as two people. */
      logo: { src: "/images/logos/coderabbit.png", alt: "CodeRabbit" },
      linkedin: "https://www.linkedin.com/in/climateadvocateaienthusiast/",
    },
    {
      id: "loc",
      name: "Loc H. Nguyen, Ed.D.",
      role: "AI Strategy and Transformation for Higher Education",
      org: { role: "Co-founder", name: "Bayhaus Creative", url: "https://bayhauscreative.com/" },
      ground: "var(--path-c)",
      photo: { src: "/images/people/loc-nguyen.jpg", alt: "Portrait of Loc H. Nguyen" },
      logo: { src: "/images/logos/bayhaus.png", alt: "Bayhaus Creative" },
      linkedin: "https://www.linkedin.com/in/lhnguyen2/",
    },
    {
      id: "patrick",
      name: "Patrick Kriwanek",
      role: "Academic Dean, The Berkeley Film School",
      ground: "var(--path-d)",
      photo: { src: "/images/people/patrick-kriwanek.jpg", alt: "Portrait of Patrick Kriwanek" },
      /*
        NO MARK ON THIS SEAT, and the reason is the flag that used to stand here
        rather than a design choice.

        The asset supplied was `/images/logos/berkeley.png`, the University of
        California, Berkeley wordmark, against a title reading "Academic Dean,
        The Berkeley Film School". The flag asked for that to be confirmed
        before the card went anywhere public and it shipped unconfirmed; it is
        on /instructors now, which is exactly the page it was meant to be
        checked before.

        Two institutions share a city name here and nothing on file says they
        share anything else, so the card was putting a university's registered
        mark against a school that may not hold it — a fabricated credential of
        the same kind as a rating, and the only one on the site that also
        borrows somebody else's trademark to make it.

        `InstructorCard` renders a seat with no `logo` (Roan's lead card has
        none), so nothing breaks by leaving it out. If the affiliation is
        confirmed, or a Berkeley Film School mark is supplied, this is one line
        to put back.
      */
      linkedin: "https://www.linkedin.com/in/patrick-kriwanek-92a3203/",
    },
  ] as readonly Person[],
} as const;

/*
  Learning as a team, compressed.

  The band was confusing, and one line was doing most of it. The headline read
  "Run the five steps together" and was immediately followed by a list of three
  things called steps: enrol individually, choose paths by role, set a launch
  date. So a reader met the word "steps" twice in 60px meaning two different
  things, one of them the five-step method the page names everywhere else. Then
  came a photograph, then a table of three participants. Four blocks, roughly
  700px, to say one thing.

  The three pseudo-steps are gone and their content is one sentence, which is
  all it ever was: everyone enrols on their own path and the group picks one
  date. The headline no longer borrows a number the method owns.

  What is left is the sentence, the photograph and the table, and the table is
  the reason the band exists: it is the only place on the page that shows what
  "together" produces, which is three different deployments landing on one day.
*/
export const teams = {
  label: "Learning as a team",
  /*
    Third pass on this copy, and the previous two were both writing about the
    arrangement rather than telling a reader what happens.

    "Take it as a group, and land on one day" is a headline that has to be
    decoded: land what, and on one day as opposed to what? And the paragraph
    under it opened "Each person enrols on their own", which is an administrative
    detail, in the first sentence, before the reader knows what the thing is.

    The order is now the order a manager thinks in. What they get: everyone
    ships something real in the same week. How it works: each person takes the
    path for their own job, so a team covers several at once. What they end up
    holding: one review session where every person has a working system and a
    measured before-and-after, rather than five people who have watched five
    courses.
  */
  /*
    Fourth pass, and this one goes plain.

    "Your whole team ships in the same week" was written to lead with the
    payoff, and it does, but it is also a promise made in the heading of a
    section a reader has not yet decided to read. "Run the course as a team" is
    what the band is, stated as an option rather than a result, and the payoff
    it displaces is the first thing the paragraph underneath says anyway.
  */
  headline: "Run the course as a team",
  intro:
    "Everybody takes the course closest to their own job, so one team can cover several at once. Each person keeps their own labs, baseline and outcome sheet, and the group picks a single launch date. On that date every one of them has a working system and a measured before-and-after to show.",
  /*
    The band's photograph. It runs as a full-height column on the left rather
    than as a frame stacked above the table, which is what let the section lose
    a third of its height without losing anything in it.

    This is the one band on the page about several people at once, and it was
    the only one with nobody in it. A designed table of three participants is
    accurate and it is not a group of people. The frame names nobody, which
    keeps it on the right side of the imagery policy at the head of this file.
  */
  image: {
    src: "/images/scenes/team-session.jpg",
    alt: "Three colleagues at a table in a bright office, laptops open, mid-discussion",
  },
  /*
    Rewritten 7 Aug, because Roan read it and could not tell what it was saying.

    It was a table: a header row reading "Participant / Ships", then three rows
    of "RevOps analyst / Path A" against "Pipeline agent". Everything in it was
    true and the format was doing the arguing, which is the failure. A two-column
    table asks the reader to work out the relationship between the columns from
    their position, and the relationship here is the whole point: this person
    ends up with that thing. Printed as a table it reads as a schedule; the
    reader has to already know what the band is about to decode it.

    The fix is to state the relationship instead of implying it. Each row is now
    a sentence with an arrow in it, the column headers are gone because an arrow
    does not need labelling, and `intro` above says the thing the table was
    being asked to demonstrate: different jobs, different paths, one date.

    "Deployments" also went. It is this program's word, and the panel is the one
    place a manager is being asked to picture the outcome, so it says the three
    things three people are actually holding at the end of it.
  */
  panel: {
    label: "Shared launch",
    title: "One date, three working systems",
    intro:
      "Three people from the same team, on three different courses, all launching in the same week.",
    date: "Thursday, week 6",
    seats: [
      { who: "RevOps analyst", course: "Course A", ships: "A pipeline agent" },
      { who: "Post supervisor", course: "Course B", ships: "A rough-cut workflow" },
      { who: "Platform engineer", course: "Course D", ships: "A serving stack" },
    ],
    footnote:
      "Each person measured their own before and after, so the team compares real results rather than opinions.",
  },
} as const;

/*
  A judge on the review board.

  ------------------------------------------------------- everyone here is real

  There used to be a second kind of entry: an OPEN SEAT, which was a discipline,
  the course it read and the check it performed, carrying no name and the same
  stand-in portrait six times over. Those are gone, removed 9 Aug at Roan's
  instruction, and the type went with them. `seat`, `reviews` and `checks` no
  longer exist as fields because there is no longer anything they could describe:
  every entry is a person, `name` is required, and the card has one shape.

  It is worth keeping why they were structured that way, because it is the rule
  the remaining fields still obey. `checks` asserted what a judge verifies and
  `reviews` assigned them a course. Both are fine written about a vacancy, which
  is a job description nobody has been fitted to. Written under a real name they
  become claims about a real person's duties that the site made up. So no such
  field survives, and every field that does is copied from what that person
  publishes about themselves.

  ------------------------------------------------------------------ the marks

  `logo` is the employer's own mark and it renders on the card. That is a
  reversal of the rule in public/images/logos/README.txt, made deliberately on
  9 Aug at Roan's instruction, and the reason it was a rule is worth leaving
  written down: a mark on a card reads as that organization endorsing this
  program, which is a stronger claim than "this person works there" and is not
  one any of these employers has made. Roan's call, stated plainly, is that the
  employer is the credibility and it belongs on the card.

  What has NOT changed is that `org` must be that person's actual employer and
  the mark must be that employer's actual mark. The marks are official vector
  files, drawn on a white chip at their own colours rather than recoloured to
  fit the card, which is both more legible and closer to how each company's own
  guidelines say to use them.

  `wordmark` is the fallback for a company that publishes no logo file at all.
  a1mobile is one: its own site sets its name in type rather than in an image,
  so the card does the same thing rather than inventing a mark for them.
*/
export type Seat = {
  id: string;
  /** The judge. Required: every entry on this board is a real person. */
  name: string;
  /** Their own stated title, shortened. Their words. */
  role: string;
  /** Employer, when they publish one. */
  org?: string;
  location?: string;
  /**
   * A sentence or two about the person, shown on hover.
   *
   * Assembled from their own profile and nothing else: the focus they list, and
   * where they studied. No assessment of them, no claim about what they do for
   * this program, and no adjective they did not write about themselves. It is
   * the same rule as every other field here, and it matters more in a free-text
   * field than in a one-word one because prose is where invention hides.
   */
  summary?: string;
  /** Backdrop hue for the hover face, from globals.css. */
  ground: string;
  photo: Img;
  /** The employer's mark. See the note above on `wordmark` for the fallback. */
  logo?: Img;
  /** The employer's name set in type, for a company with no mark to ship. */
  wordmark?: string;
  /** Full LinkedIn profile URL. The card links to it. */
  linkedin: string;
  /**
   * The board seat this judge holds, when Roan has assigned one.
   *
   * Optional, and it has to be: the board is six named seats and the judges who
   * have agreed to sit on it are five real people. Which seat somebody reads is a
   * statement about them, so an unassigned card prints no seat line rather than a
   * plausible one — the same rule `role`, `org` and `summary` already follow.
   *
   * `reads` is the sentence a stranger needs: the course this seat reads, or
   * "Every course" for the learning-design seat, which reads assessment across
   * all five rather than one curriculum.
   */
  seat?: { id: string; name: string; reads: string };
};

/*
  The judges.

  Order is Roan's: Liz Zhang first, then the three he listed on 9 Aug, then
  Sachin Gupta, added later the same day.

  EVERY FIELD IS THEIR OWN COPY, shortened and nothing else. `role` is the
  headline off their profile with the pipes and the keyword strings taken out,
  because "250k Community Builder" and "Architecting Massive-Scale Systems & AI
  Innovations" are a profile's search-bait rather than a job title and neither
  survives `clamp-1` on a card. Nothing was translated into a claim about this
  program.

  `ground` is one of the five path hues, and it means nothing.

  It used to mean the course a seat read, and it went flat neutral for everybody
  when the seats did, on the reasoning that a hue standing for a course should
  not be handed to a judge who has not been assigned one. Roan asked on 9 Aug for
  the colour variety back, so it is back as decoration and only as decoration:
  five hues, in order, so no two adjacent cards match. Nobody should read a
  course off one of these, and nothing on the card invites them to.
*/
export const board = {
  headline: "Practitioners judge the curriculum and the events",
  intro:
    "Every judge on this board runs these systems in production. They read the courses each term, the lessons, the labs and the outcome sheet a learner leaves with, and they sit on the panel that judges the events where learners present the workflows they deployed.",
  /*
    A second, shorter version, for the three metadata slots only.

    `intro` is 260 characters, which is right for a paragraph under a headline
    and wrong everywhere a description is cut around 155: the route was serving
    it as its meta description, its og:description and its twitter:description,
    so all three ended mid-clause at "...the outcome sheet a learner", losing
    both the sentence about the events and the point of the board.
  */
  seoDescription:
    "The practitioners who read these courses each term and judge the events where learners present the workflows they deployed.",
  members: [
    {
      id: "liz-zhang",
      name: "Liz Zhang",
      /* Shortened from "AI developer relations, and a two-time founder", which
         was 45 characters and clamped to "AI developer relations, and a..." on
         the 240px homepage card, losing the founder half that was the reason
         for the phrasing. Both credentials still fit at this length. */
      role: "Founder, AI developer relations",
      /* THE MULTIMODAL SOCIETY, corrected 9 Aug: "liz logo is actyally the
         multimodal society that i just sent to you." The card had The AI
         Collective, which is the community her summary describes rather than the
         organisation she founded, and the mark below has to agree with the line
         above it — a card printing one employer's name over another's logo is a
         claim about a real person that neither of them made. */
      org: "The Multimodal Society",
      location: "San Francisco Bay Area",
      linkedin: "https://www.linkedin.com/in/lizz-zhang/",
      summary:
        "AI developer relations, two companies founded, and a community of 250,000. Studied at KTH Royal Institute of Technology.",
      ground: "var(--path-a)",
      photo: {
        src: "/images/people/liz-zhang.jpg",
        alt: "Studio portrait of Liz Zhang",
      },
      /* Supplied by Roan on 9 Aug, and corrected the same day: it is The
         Multimodal Society's lockup, not The AI Collective's. Her card carried no
         mark before that because her profile publishes no employer, and an empty
         slot is the correct rendering of a fact nobody has stated. */
      logo: { src: "/images/logos/multimodal-society.png", alt: "The Multimodal Society" },
    },
    {
      id: "yunbin-bae",
      name: "Yunbin Bae",
      role: "Designer and HCI researcher",
      org: "a1mobile",
      location: "San Francisco Bay Area",
      linkedin: "https://www.linkedin.com/in/yunbinbae/",
      summary:
        "Design and human-computer-interaction research, and one company founded. Studied at the University of Maryland.",
      ground: "var(--path-b)",
      photo: {
        src: "/images/people/yunbin-bae.jpg",
        alt: "Studio portrait of Yunbin Bae",
      },
      /* Their actual mark, supplied by Roan on 9 Aug. This was `wordmark:
         "a1mobile"`, set in type, because a1mobile publishes no logo file on
         its own site and inventing one for a company is worse than typesetting
         its name. The fallback stays in the type for the next company that has
         none. */
      logo: { src: "/images/logos/a1mobile.png", alt: "a1mobile" },
    },
    {
      id: "abhinav-balasubramanian",
      name: "Abhinav Balasubramanian",
      role: "Staff AI engineer",
      org: "NVIDIA",
      location: "Santa Clara, California",
      linkedin: "https://www.linkedin.com/in/abhi-bala/",
      summary:
        "Generative AI, agentic systems, RAG and AI observability. Studied at San Jose State University.",
      ground: "var(--path-c)",
      photo: {
        src: "/images/people/abhinav-balasubramanian.jpg",
        alt: "Studio portrait of Abhinav Balasubramanian",
      },
      logo: { src: "/images/logos/nvidia.svg", alt: "NVIDIA" },
    },
    {
      id: "abhi-vasanth",
      name: "Abhi Vasanth",
      role: "Senior data engineer",
      org: "Pacific Gas and Electric",
      location: "San Francisco, California",
      linkedin: "https://www.linkedin.com/in/abhinandanvasanthin/",
      summary:
        "Data engineering at one of the largest utilities in the United States. Studied at Udacity.",
      ground: "var(--path-d)",
      photo: {
        src: "/images/people/abhi-vasanth.jpg",
        alt: "Studio portrait of Abhi Vasanth",
      },
      logo: { src: "/images/logos/pge.svg", alt: "Pacific Gas and Electric" },
    },
    {
      id: "sachin-gupta",
      name: "Sachin Gupta",
      role: "Engineering leader",
      org: "eBay",
      location: "San Francisco Bay Area",
      linkedin: "https://www.linkedin.com/in/guptasachin1/",
      summary:
        "Engineering leadership on systems built for massive scale. Studied at the University of Colorado Boulder.",
      ground: "var(--path-e)",
      photo: {
        src: "/images/people/sachin-gupta.jpg",
        alt: "Studio portrait of Sachin Gupta",
      },
      logo: { src: "/images/logos/ebay.svg", alt: "eBay" },
    },
  ] as readonly Seat[],
  /*
    NO FOOTNOTE, and this time there is nothing left for one to disclose.

    The history matters because the sentence has been added and removed twice.
    It existed to say that the portrait and the mark on every card were
    placeholders. It came out on 7 Aug on the argument that six identical faces
    disclose that on their own. It went back on 9 Aug when four real people
    landed above six stand-ins and the repetition stopped reading as a
    placeholder.

    It comes out now because the stand-ins are gone. Every card is a real person
    with their own photograph, their own employer and their own profile link, so
    there is no placeholder left to disclose and the sentence would be describing
    a state of the page that no longer exists. Roan flagged it as reading like
    stray copy, and on a board with no vacancies on it, that is exactly what it
    had become.

    The condition for it coming back a third time is unchanged: the day an entry
    appears without a real portrait, it needs a sentence saying so.
  */
} as const;

/*
  The community partners, added 9 Aug at Roan's instruction.

  --------------------------------------------------------------- what is claimed

  Exactly one thing: that these two organisations are community partners of this
  program. That is Roan's statement and it is his to make. Everything else on
  the band is each organisation describing itself.

  What is deliberately NOT claimed, because nobody has stated it: what either
  partnership does. No joint events, no shared curriculum, no co-branded
  anything. The moment this band says "we run monthly sessions with them" it has
  invented a commitment on behalf of a third party, which is the one failure
  this file has the most notes about. A partner list that names its partners and
  stops is a complete object; the activity goes in when there is activity to
  describe.

  ------------------------------------------------------------- `blurb` is theirs

  Both lines are lifted from each organisation's own meta description, shortened
  and not otherwise altered:

    The AI Collective ...... "The world's largest AI community. Uniting 250K+
                              pioneers across 100+ global chapters. Building the
                              human layer for the AI era."
    The Multimodal Society . "A community of creatives and engineers building the
                              AI era together. Masterclasses, hackathons, and
                              screening nights in San Francisco. Membership is
                              free."

  Those are superlatives and headcounts that this site would never write about
  anybody, which is the reason they are attributed rather than absorbed: the
  band's intro says the lines are theirs, so "world's largest" reads as a claim
  the AI Collective makes and not as one this program endorses. Two hundred and
  fifty thousand is also the same figure Liz Zhang's board entry carries, from
  her own profile, so the two agree without either being copied from the other.

  If one of them rewrites its own description, this goes stale quietly. That is
  the accepted cost of quoting rather than paraphrasing, and it is the cheaper
  failure: a stale quote is out of date, a paraphrase is this site putting words
  in somebody's mouth.

  --------------------------------------------------------------------- the marks

  Two organisations that ship two different kinds of file, which is why `wordmark`
  exists here as it does on `Seat`.

  The AI Collective publishes a lockup with its name already set in it, so the
  image is the whole identity and nothing is printed beside it. The Multimodal
  Society publishes a square mark with no name in it — their own site pairs it
  with the name in type at 64px, and this band does the same thing. Printing "The
  AI Collective" next to a wordmark that already reads "The AI Collective" is the
  failure this split avoids.

  Both sit on the same light chip the roster cards use, for the same reason
  instructor-card.tsx has written down: the Multimodal Society's mark is black by
  design and the AI Collective's is a dark serif, so the chip makes the treatment
  independent of what colour anybody's brand happens to be.
*/
export type Partner = {
  id: string;
  /** The organisation's own name for itself. */
  name: string;
  /** Their site. The whole card links here. */
  href: string;
  /** Their own description of themselves, shortened and not otherwise altered. */
  blurb: string;
  /** Their published mark. `alt` is empty when `setNameInType` prints the name. */
  logo: Img;
  /**
   * Print the name in type beside the mark.
   *
   * True for a mark that does not contain its owner's name — a square icon, an
   * emblem — and false for a lockup that already reads as the name. It is the
   * same decision `Seat.wordmark` makes for an employer with no logo file at
   * all, arrived at from the other end: there the name is set in type because
   * there is no mark, here because the mark says nothing.
   */
  setNameInType?: boolean;
  /**
   * The mark ships its own background and is drawn edge to edge rather than on
   * the site's light chip.
   *
   * True for an app-icon-shaped mark whose ground is part of the design. It is
   * the same exception `scripts/prepare-logos.mjs` makes with `keepBox` for
   * n-aible, and for the same reason: putting a square icon that is already
   * black on a white chip draws a white frame around something that has no need
   * of one, and shrinks the mark to fit a chip it is not asking for.
   *
   * It is a separate flag from `setNameInType` because they are separate facts.
   * Both happen to be true of the one mark here, and a lockup with its own dark
   * ground would want this and not that.
   */
  markHasOwnGround?: boolean;
};

export const partners = {
  label: "Community partners",
  /*
    REWRITTEN 9 Aug, on Roan's instruction: "improve this text, clear and easy to
    understand copy."

    It read "The AI communities this program partners with" over "Two independent
    organisations, each described in its own words."

    Both sentences are true and neither one tells a reader anything they can use.
    The headline is a noun phrase that restates the eyebrow directly above it —
    "Community partners" / "The AI communities this program partners with" is the
    same three words twice — and it answers a question nobody asked, which is what
    the relationship is called. The intro was worse in a more interesting way: it
    is a note about editorial method. "each described in its own words" is a
    sentence about how this page was written, addressed to somebody who has not yet
    been told what either organisation is.

    What a reader wants at this band is why these two names are on the page. So the
    headline says what the partnership does for them — these are rooms you can
    actually walk into — and the intro says the two facts that follow from it: the
    partners are independent, and the events are theirs rather than ours. The
    quotation point survives without being announced, because "in their own words"
    is now doing its work in the last clause rather than as the whole sentence.
  */
  headline: "Two AI communities you can learn alongside",
  intro:
    "Both run their own events, in person and online, and both are open to join. Neither is part of this program. Here is what each one does, in their own words.",
  /* Roan's order, as he listed them. Two entries have no order worth deriving
     and any other one would be this site ranking two partners against each
     other, which is a judgement nobody asked it to publish. */
  items: [
    {
      id: "multimodal-society",
      name: "The Multimodal Society",
      href: "https://www.multimodalsociety.com/",
      blurb:
        "A community of creatives and engineers building the AI era together. Masterclasses, hackathons and screening nights in San Francisco.",
      /*
        THE LOCKUP, replaced 9 Aug: Roan supplied their real one.

        This used to be the 256px black square their own site header renders, which
        carries no name — so the name was set in type beside it (`setNameInType`)
        and the mark was drawn full-bleed rather than on the light chip, because its
        dark ground is part of the artwork (`markHasOwnGround`). Both flags are gone
        with the file. The lockup reads "THE MULTIMODAL SOCIETY", so it carries the
        name as `alt` and gets the same treatment The AI Collective's does.
      */
      logo: { src: "/images/logos/multimodal-society.png", alt: "The Multimodal Society" },
    },
    {
      id: "ai-collective",
      name: "The AI Collective",
      href: "https://www.aicollective.com/",
      blurb:
        "The world's largest AI community, uniting 250K+ pioneers across 100+ global chapters.",
      /* The lockup reads the organisation's name, so it carries it as `alt` and
         nothing is set beside it. */
      logo: { src: "/images/logos/ai-collective.png", alt: "The AI Collective" },
    },
  ] as readonly Partner[],
} as const;

/*
  Ordered for a sceptic. Cost first, then the question a free offer with a
  signup form always raises, then the mechanic, then the two questions that
  decide whether a reader can actually start: the account ask and the access
  they need at work.
*/
export const faqs = [
  {
    q: "What does the course cost?",
    a: "It is free. The first module of every course opens instantly, and one free account unlocks the rest of that course. Everything on this site is free to use.",
  },
  {
    q: "Why is it free?",
    a: "It is a non-commercial education project that Roan funds and runs. Every course stays free to use, and this site exists to teach rather than to sell.",
  },
  {
    q: "What does completion by deployment mean?",
    a: "A course completes when your workflow runs live and you have measured it. You record a baseline in module 1, launch the workflow into a working environment, then measure the same thing again. That pairing is what makes the completion record worth sharing.",
  },
  {
    q: "Can I start right away?",
    a: "Yes. The first module of every course plays for everyone, with a free account needed only from module 2.",
  },
  {
    q: "What does the free account ask for?",
    a: "Name, role, organization, and a few questions about the workflow you want to improve. It takes about a minute, and it is what lets the guided labs use your own workflow as the project.",
  },
  {
    q: "What do I need access to?",
    /* Titles, not badges. "Course D" and "Course E" are the cover labels on the
       catalog cards; on a course page — where this FAQ also renders — there is
       no lettered row in sight, so the answer referred a reader to two courses
       by a name the page they are on never prints. */
    a: "One workflow you own, permission to change it, and the tools your team already uses. Applied AI infrastructure also assumes access to a GPU cloud account, and AI starter for small business runs on everyday business tools.",
  },
  {
    q: "What is the outcome sheet?",
    a: "A one-page record inside the course. Before you launch, you note a baseline on time, cost, or quality. After you launch, you measure again. The sheet holds both numbers and the difference between them.",
  },
  {
    q: "Which course should I start with?",
    a: "Pick by the work you are responsible for. GTM teams for marketing ops, RevOps and growth. Video and media for production workflows. AI literacy, ethics and data compliance for whoever owns how a team uses AI. Infrastructure for developers who own serving. The small business starter is a short first win before a longer course.",
  },
  {
    q: "Who records the lessons?",
    a: "Roan Weigert records the core lessons that establish the method. Specialist sessions come from invited practitioners who run these workflows in production, and the Practitioner Review Judge Board reads the courses each term and judges the events where learners present what they deployed.",
  },
  {
    q: "Can my whole team take a course?",
    a: "Yes. Each person enrols individually, so each gets their own labs, baseline and outcome sheet. Groups usually set one shared launch date and review the deployments together.",
  },
  {
    q: "What happens to the information I provide?",
    a: "It stays inside this program. Your profile and progress run your course and build your outcome record, and you can request a copy or deletion at any time.",
  },
] as const;

/*
  The close, which used to be two sections.

  "Three ways to begin" ran as three tiles on white, and the first of them read
  "Watch the open module / 14 minutes, open to everyone". Directly under it, on
  the next ground, the final call to action read "Module 1 is open. It takes 14
  minutes." Two sections, 200px apart, spending the same fourteen minutes twice,
  and the second one repeating the label the first tile had already used.

  They are one band now: the decision on the left, the three routes on the
  right. Nothing was dropped except the duplicate. The routes keep their own
  destinations, and the tile that duplicated the headline keeps the only thing
  the headline does not say, which is where watching it takes you.
*/
/*
  The close, rewritten because it was not telling a reader what to do.

  It read "Module 1 is open. It takes 14 minutes." over "Watch it end to end,
  profile one workflow, and decide from there." Two sentences of jargon in a row
  at the exact point a visitor decides. "Module 1 is open" is a status, and it
  means something only to somebody who has already read the access model further
  up: open as opposed to what? "Profile one workflow" is this program's internal
  verb for the thing step one does, and a first-time reader has no reason to
  know it. And the promise it closed on was "decide from there", which asks
  someone to commit fourteen minutes in order to arrive at another decision.

  It now says the three things a person needs at this point: what to do first,
  what it costs them, and what they walk away holding. The instruction is
  concrete ("pick the path closest to your job, watch the first lesson"), the
  price is the first word, and the payoff is a written baseline of one process
  they own, which is a thing rather than a decision.

  CUT TO ONE SENTENCE on 7 Aug, and the duration came out of the headline with it.

  "Start free, in 14 minutes" sized the page's closing argument by its smallest
  number. A reader who has scrolled 8,000px to reach this band has already been
  told the course is free three times and is deciding whether to begin; answering
  that with a fourteen-minute quote is the same mistake the third hero stat used to
  make, which is to price the offer by its cheapest part. The figure is still on
  the page where a duration is useful, on the lesson card in the fold, next to the
  video it describes.

  The body was three sentences saying one thing twice: "you will have picked one
  process you own and written down what it costs you today" and then "that page is
  the baseline everything else is measured against". One sentence carries all of
  it, and it is shorter than either half of the pair it replaces.
*/
export const closing = {
  headline: "Start with your first lesson",
  body: "Pick the course closest to your job, watch the first lesson, and finish with a written baseline for one process you own.",
  reassurance: "Lesson one plays for everyone. A free account opens the rest.",
  routesLabel: "Or start somewhere else",
  routes: [
    {
      id: "module",
      title: "Watch the open module",
      detail: "Open to everyone, right away",
      /* Resolved at render from the course that leads the homepage, rather than
         naming one course id here. See sections/hero.tsx. */
      href: "/courses",
    },
    {
      id: "courses",
      title: "Compare every course",
      detail: "Pick by the work you own",
      /* The index, not the band. "Compare all five" is a promise the band
         cannot keep — it is the same five cards this page already scrolled
         past — and the header menu and the footer both send this label to
         `/courses`. One label, one destination. */
      href: "/courses",
    },
    {
      id: "teams",
      title: "Run a course with your team",
      detail: "One shared launch date",
      href: "/#teams",
    },
  ],
} as const;

/* ------------------------------------------------------------------------ */
/* Catalog layout blocks ported from mockups/learning-marketplace-blocks.html */
/*                                                                            */
/* The blocks are the marketplace patterns from that file. The copy is this    */
/* program's own, so nothing here introduces a provider, a price, a partner    */
/* logo or a statistic that the brief does not already support. Four blocks in */
/* the mockup were left out for that reason and the reasons are recorded in    */
/* the page composition file.                                                  */
/* ------------------------------------------------------------------------ */

/*
  The marketplace `topbar` block is gone, and with it the "For individuals /
  For teams" strip it carried.

  It cost 32px of chrome above a 72px header on every screen, and the split it
  offered was not real: there is one enrolment here, an individual one, and the
  teams section describes several people each taking their own path. So the
  strip was asking a reader to choose between two things that resolve to the
  same product, at the first moment of the page. The teams section is still one
  click away in the footer and in the actions block.
*/

/*
  The role router, "Which work are you responsible for?", lived here and has
  been removed.

  It was five tiles between the credibility band and the method, each naming an
  audience and linking to a path. Every one of those audiences was already the
  audience line on that path's card in the catalog, two sections down, where it
  sat next to the artifact the path builds and the level it runs at. (That line
  came off the cover itself on 8 Aug; the card still carries the same facts in
  its meta row.)
  So the router asked for a decision at the one point in the page where the
  reader had the least to decide with, and the catalog then asked for the same
  decision again with the facts attached.

  The sentence it was built from is still on the page. The FAQ answers "which
  path should I take?" with "pick by the work you are responsible for", which is
  where a reader who wants that question answered will look for it.

  Nothing linked to it: no nav item, no footer link, no anchor. page.tsx has the
  note on what the removal did to the ground rhythm.
*/

/*
  The skill cloud is gone, and the marketplace `categories` block with it.

  It rendered the five paths' `skills` arrays as five columns of chips, under a
  header for each path carrying that path's badge and its audience line. Every
  one of those strings was printed on that path's own cover in the catalog one
  section above, so the block spent roughly 440px restating the row a reader had
  just scrolled past, in the same order, with the skills as the only addition.

  The skills were the part worth keeping, so they moved to where the choice is
  made: each catalog card now carries its own `skills` chips. That is one fewer
  section, and the four cards that had no skill list at all now have one. The
  featured card always did.

  What the small cards gave up to make room is the other half of the trade. They
  carried modules 01 to 03 and an "and 2 more" line, which across four cards was
  twelve rows restating the five-step spine the method section states in full and
  the course outline states again with its access states. Module 01 stays,
  because it is the free one and the "Open" chip is the offer, and 02 and 03 go.
*/

/*
  The studio band is gone.

  Three of its own facts are what removed it. Its headline, "Every lesson is
  recorded, one lesson and one lab per module", is the course section's headline
  ("One lesson and one lab, every module") with the words reordered. Its intro,
  "Core lessons come from Roan, specialist sessions come from practitioners who
  run these workflows in production", is the instructor roster's intro said
  again. And all three of its photographs already appear above it: the room is
  the hero collage's second frame, the lesson recording is the hero lesson
  card's poster, and the interview session is the course video's poster.

  So the band was a duplicate heading over a duplicate sentence over three
  duplicate frames, roughly 700px of it, and the page's photography is unchanged
  by its removal because every frame it held is still on the page in the place
  that frame does work. A photographic band earns its place here the day there
  is footage the page has not already spent.
*/

/*
  The `actions` block is gone as a section of its own and lives in the closing
  band. content for it is `closing.routes` below.
*/

export const footer = {
  blurb:
    "A project-based learning program from AI Tech Education Academy. Learners build, deploy and measure one AI workflow of their own through guided role-based courses.",
  columns: [
    {
      title: "Courses",
      links: [
        /* The index first, and it is new on 8 Aug with the page itself. A footer
           column headed "Courses" that listed five courses and not the page they
           live on was the same gap the nav had: the catalog existed five times
           and never once as a place. */
        /* Just the index now.

           This column used to name all five courses, each through
           `courseHref(id)`. Both halves of that broke when the catalogue moved
           into Postgres: the hrefs are a query, and — the reason that matters —
           the list was a hand-written copy of the catalogue that a course
           created in the console would never appear in. The footer builds the
           rest of this column from the live catalogue; see site-footer.tsx. */
        { label: "Every course", href: "/courses" },
      ],
    },
    {
      title: "The course",
      links: [
        /* One row, not two. "The method" and "How each module works" pointed at
           the two sections that merged, and a sitemap listing one destination
           twice under two names is the same misdirection as a nav doing it. */
        { label: "The method", href: "/#method" },
        { label: "Outcomes and evidence", href: "/#outcomes" },
        { label: "Common questions", href: "/#faq" },
      ],
    },
    {
      title: "The program",
      links: [
        /* Both of these are routes now, and by the rule stated on the board
           link below rather than by coincidence: a footer is a sitemap, and a
           sitemap points at routes wherever one exists. */
        { label: "Instructors", href: "/instructors" },
        { label: "Learning as a team", href: "/#teams" },
        /* The page, not the homepage band. The band is a six-card teaser with a
           link to this; the footer is a sitemap, and a sitemap points at routes. */
        { label: "Practitioner Review Judge Board", href: "/review-judge-board" },
        /* The band, because there is no route. Added 9 Aug with the partner
           section, and it goes here rather than in the header — which now has the
           room, since FAQ came out of that row the same day and the note there
           says the next item no longer has to be measured against a full bar.

           Room is not the argument for taking it. The four labels left in the
           nav are the four subjects a visitor arrives wanting — the catalog, the
           method, the outcome, the people — and a partner list is not one of
           them. It is something a reader checks about a program rather than
           something they came for, and the footer is where that reader looks. It
           also earns its line here on the footer's own rule: a sitemap names
           every destination, and this one has an id. */
        { label: "Community partners", href: "/#partners" },
      ],
    },
  ],
  /* Two entries, and there were four. "Accessibility" pointed at
     `/accessibility` and "Data and records" at `/data`, neither of which is a
     route: two 404s in the one row that renders on all twelve pages, which is
     the worst place on a site to put a dead link because it is also the row a
     reader goes to when they are checking whether an organisation is real.

     Neither comes back by being repointed. `/data` at `/privacy` would list one
     destination twice under two names, which is the thing the Courses column
     above refuses to do, and the retention and rights sections it would be
     aiming at are already inside the document "Privacy" links to. An
     accessibility statement is a document nobody has written yet; when
     `legal.accessibility` exists, the route is four lines beside /terms and the
     entry comes back with it. */
  legal: [
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
  ],
} as const;

/*
  The two auth screens.

  Every line here is a fact this site already states somewhere else, which is the
  only reason there is copy on these screens at all. `moduleFormat.accessNote`
  is the source for the unlock sentence, the hero is the source for the open
  first module, and `outcomes` is the source for what finishing means. Nothing
  on an auth screen may be the first place a claim appears: these are the two
  pages a reader reaches with the most intent and the least patience, and an
  invented benefit here is the one a support ticket gets written about.

  There is no auth backend. Both screens are the interface for one that does not
  exist yet, so the submit control posts nowhere and says so in the page rather
  than pretending. See src/components/auth/auth-screen.tsx.
*/
/**
 * The `/courses` index, which until 8 Aug did not exist.
 *
 * The catalog lived in one band on the homepage and nowhere else, so the five
 * course pages had a parent that was a fragment (`/#courses`) rather than a
 * page. Three things were wrong with that and only one of them is cosmetic:
 *
 *   - The breadcrumb on every course page reads "Courses / <this course>", and
 *     its first item pointed at a scroll position on another page. A trail whose
 *     parent is not a location is the thing the note in course/hero.tsx already
 *     complains about, one level up.
 *   - There was no page a search for "applied AI courses" could land on. The
 *     five course pages compete with each other for it, and the homepage answers
 *     it in a band two thirds of the way down.
 *   - "Courses" in the nav scrolled the homepage, which meant the primary nav's
 *     first item behaved differently from every other route on the site.
 *
 * ------------------------------------------------------------- WHY THE PROSE
 *
 * `intro` is the band's own copy and stops there. `body` is three short
 * paragraphs under the grid, and they exist because an index page whose entire
 * content is five cards has nothing on it a search engine can match against
 * anything but the five titles it already has better pages for.
 *
 * They are not filler written to a word count. Each answers a question the five
 * course pages cannot answer individually, because each is a question about the
 * set: how the five differ, what every one of them has in common, and what
 * "free" covers. Nothing here is a claim that is not made on the pages it
 * summarises.
 */
export const catalog = {
  seoTitle: "Free applied AI courses, by role",
  seoDescription:
    "Five free, self-paced applied AI courses for GTM, media, compliance, infrastructure and small business. Build one workflow on your own data and measure it.",
  keywords: [
    "applied AI courses",
    "free AI courses",
    "AI courses by role",
    "self-paced AI course",
    "project-based AI training",
    "AI course for teams",
    "deploy an AI workflow",
  ],
  label: "All courses",
  /* No number in the heading.

     It read "Five courses, one method", which was true of a catalogue that
     could only change by editing a TypeScript file. The console can add a sixth
     now, and a page that renders six cards under a heading claiming five is the
     kind of small lie that makes a reader distrust the rest of it. The method is
     the claim worth making and it does not depend on the count. Same reason
     `moduleCount` is derived rather than stored. */
  heading: "One method, whichever course you pick",
  intro:
    "Each course takes a different kind of work through the same five steps. Pick the one closest to your job, or read what they share below.",
  /* One string per paragraph, so the 68-character measure the rest of the site
     holds applies here too. */
  body: [
    {
      heading: "How the courses differ",
      text: "The method does not change between courses. What changes is the work you point it at, the tools the labs assume you already have, and the artifact you finish holding. The GTM course runs on your CRM and pipeline data; the media course runs on your own footage; the compliance course produces a policy your team operates under; the infrastructure course puts a service on GPU cloud; the small business course builds one assistant for one task. Choose by which of those you could start on Monday.",
    },
    {
      heading: "What every course has in common",
      text: "Every course is project-based against your own work rather than a sample dataset, and every one finishes the same way: a recorded baseline, a thing you built, a deployment, and a measurement against the baseline you started from. Each module pairs a recorded lesson with a lab you run yourself, and each closes with one artifact you keep. Nothing is graded and there is no cohort to wait for.",
    },
    {
      heading: "What free covers",
      text: "Module 1 of every course opens with no account at all. A free account keeps your work and opens the rest, and there is nothing to pay at any point: no certificate fee, no upgrade, and no paid tier holding the useful half. If you want to run a course with a team, that is a conversation rather than a price list.",
    },
  ],
} as const;

/**
 * Terms and Privacy, as data.
 *
 * ------------------------------------------------------------- READ THIS FIRST
 *
 * THESE ARE PLAIN-LANGUAGE DRAFTS AND THEY HAVE NOT BEEN REVIEWED BY A LAWYER.
 * They describe what this site actually does today, which is the only thing that
 * makes them safe to publish at all: there are no accounts, no payments and no
 * analytics, so there is very little to get wrong. The moment any of those
 * three exists, both documents are wrong and have to be rewritten by somebody
 * qualified.
 *
 * `pending` marks every fact that has to come from Roan rather than from the
 * code — the legal entity, the address, the governing law and the contact
 * mailbox. They render as visible placeholders on the page rather than as
 * invented text, because a privacy policy that names the wrong jurisdiction is
 * worse than one that admits it does not have it yet.
 *
 * ----------------------------------------------------------- WHY NOT BOILERPLATE
 *
 * The obvious move is a generated policy covering cookies, third-party
 * processors, advertising identifiers and international transfers. Every clause
 * of that would be a description of something this site does not do, and a
 * policy that overstates what is collected is not the safe direction — it
 * licenses collection that is not happening and it trains a reader to skip the
 * document. What is here is short because the site is.
 */
export const legal = {
  /* Both documents state one date, and it is the date they were written. */
  updated: "8 August 2026",
  pending: {
    entity: "[legal entity name]",
    address: "[registered address]",
    jurisdiction: "[governing law]",
    contact: "[contact email]",
  },
  /*
    Printed at the head of both documents. It is the same admission the auth
    screens already make in `shellNote`, and for the same reason: a reader who
    is about to hand over an email address should know what state the thing is
    in before they do, not after.
  */
  /*
    Rewritten the day accounts went live, and it had to be.

    It said "Accounts are not open yet" — printed at the head of both legal
    documents, which is the page a reader opens BECAUSE they have just been
    asked for a name, an email address and a password. Free accounts are open,
    the sign-up form collects all of that plus company and role, and the work a
    learner saves is stored against it. A privacy notice that misdescribes
    whether it is collecting anything is the one sentence on the site that has to
    be true first.

    The draft framing stays, because it is still accurate: the legal entity
    fields below are still [placeholder].
  */
  draftNote:
    "These terms are published in draft while the platform is being built, and the entity details below are still being finalised. Free accounts are open and nothing on this site takes payment. This page will be reviewed and dated again when the details are settled, and anyone who has given us an email address will be told before anything here changes in a way that affects them.",
  terms: {
    title: "Terms of Use",
    intro:
      "These terms cover your use of this website and the course material published on it. They are written to be read, so they are short and in plain English.",
    sections: [
      {
        heading: "Who runs this site",
        body: [
          "This site is operated by {entity}, at {address}. If anything here is unclear, or you think we have got something wrong, write to {contact} and a person will read it.",
        ],
      },
      {
        heading: "What you may do with the course material",
        body: [
          "The lessons, labs, templates and written material on this site are free to use for your own work and for the work of the organisation that employs you. You may run the labs on your own data, adapt the templates, and keep and use whatever you build. You do not owe us anything for it and you do not need to credit us.",
          "What you may not do is republish the material as your own, sell it, or use it as the content of a competing course or training programme. The line is between using what you learn and redistributing what we wrote.",
        ],
      },
      {
        heading: "What you build is yours",
        body: [
          "Every course asks you to work against your own data, in your own tools. We claim no ownership of your data, your workflow, or anything you build during a course, and we do not need a copy of any of it to teach you.",
        ],
      },
      {
        heading: "Accounts",
        body: [
          "Module 1 of every course is open with no account. An account exists so that your progress and your written work are still there when you come back, and it is free. You are responsible for keeping your own sign-in details to yourself, and for what happens under your account.",
          "You can close your account at any time by writing to {contact}. We will delete it and the work stored against it.",
        ],
      },
      {
        heading: "What we do not promise",
        body: [
          "The courses teach a method and a set of tools. They do not promise a job, a salary, a business result, or that any particular AI system will behave a particular way on your data. Where a course asks you to measure something, the number you get is yours and we make no claim about what it will be.",
          "The AI tools the labs use are third-party services that change, and sometimes get things wrong. Check what they produce before you put it in front of a customer or a regulator. Nothing on this site is legal, financial, medical or safety advice, and the compliance course in particular is a course about writing a policy, not a substitute for your own legal counsel.",
        ],
      },
      {
        heading: "The site itself",
        body: [
          "We may change, add to, or withdraw course material, and we may take the site down for maintenance. We try not to break things people are part-way through, but this is a free service and we cannot guarantee it is always available.",
          "To the extent the law allows, we are not liable for loss arising from your use of this site or the material on it. Nothing here limits liability that cannot legally be limited.",
        ],
      },
      {
        heading: "Governing law",
        body: [
          "These terms are governed by the law of {jurisdiction}, and any dispute goes to the courts there.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro:
      "This policy says what we collect, why, and what we do with it. The short version: almost nothing, because there is almost nothing here that collects.",
    sections: [
      {
        heading: "The short version",
        body: [
          /*
            REWRITTEN 9 Aug, and it had to be. This read "there is no third-party
            analytics or tracking script on this site", which was true for as long as
            it was true and stopped being true the moment the Google tag and the
            TrustedSite trustmark went into the root layout. A privacy page describing
            a site that no longer exists is worse than no privacy page, because it is
            the one page a reader consults precisely when they have decided to be
            careful.

            Stated forwards, per the copy rule, and it costs nothing here: naming the
            two scripts and what they are for is a stronger sentence than claiming an
            absence, and it is the sentence a sceptical reader wanted anyway.
          */
          "This site runs two third-party scripts and no advertising. Google Analytics counts visits so we know which courses people actually open, and TrustedSite shows the trust badge in the corner. Neither is used to build a profile of you, we sell nothing to anybody, and reading the course pages needs no account.",
        ],
      },
      {
        heading: "What we collect",
        body: [
          "If you create an account we collect the name and email address you give us, and the work you save while going through a course: your baseline, your notes, and the artifacts each module asks you to produce. If you tell us your company, your role, or how you heard about us, we collect that too. Those three are optional, and the form says so.",
          "Our hosting provider keeps ordinary server logs, which include IP addresses, for a short period and for the purpose of running and securing the service. We do not use them to build a picture of individual visitors.",
        ],
      },
      {
        heading: "Why we collect it",
        body: [
          "Your name and email exist so you can sign in and so we can tell you about something that affects your account. Your saved work exists so it is there when you come back. The optional questions exist so we know which roles are actually turning up, which is how the next course gets chosen. They are used in aggregate and they do not change what you are shown.",
        ],
      },
      {
        heading: "The limits we hold to",
        body: [
          /* Five negations in one paragraph, under a heading that was a sixth. Roan's
             rule is that copy states things forwards, and a policy is the hardest place
             to hold that: the promises here ARE abstentions. Each one is turned into
             the commitment it stands for, which reads as a stronger sentence and says
             exactly the same thing. */
          "Your data stays with us. It goes to no advertiser and no data broker, it trains no model, and your saved work is read only where you have asked somebody to look at it. Email from us is about your account or something you asked for.",
        ],
      },
      {
        heading: "Who else touches it",
        body: [
          /* Named, 9 Aug. This said the providers "will be named here before accounts
             open" and accounts have been open for a while, so it was a promise the page
             had already broken. Analytics made it urgent rather than untidy: a reader
             who is told a third-party script runs is owed the name of the third party. */
          "Running a service means using other companies for parts of it. Supabase holds the database and the accounts, Vercel serves the site, and Google Analytics receives the page views described above. Each processes data on our instructions for the purpose it is named for here.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "For as long as your account is open, and then no longer. Close your account and the account and the work stored against it are deleted.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can ask for a copy of what we hold about you, ask us to correct it, or ask us to delete it, by writing to {contact}. We will not ask you why, and there is no charge. Depending on where you live you may also have the right to complain to a data protection regulator.",
        ],
      },
      {
        heading: "Cookies",
        body: [
          /*
            Present tense, and honest about the analytics cookies as of 9 Aug.

            This said "There is no cookie banner because there are no tracking
            cookies", which was the true and rather good version until the Google tag
            landed. gtag sets `_ga` and a `_ga_<id>` per property, and those are
            measurement cookies by any reading. Two sentences that contradict the
            document they sit in is the failure this page cannot have.

            THE BANNER IS STILL A DECISION ROAN HAS TO MAKE, and this copy neither
            promises one nor pretends the question is closed. Google's own setup page
            flags it: with visitors in the European Economic Area, consent mode is what
            keeps measurement lawful, and that needs a banner and a consent default
            fired before the tag. See third-party-scripts.tsx.
          */
          "Two kinds. If you have an account we set cookies to keep you signed in. Google Analytics sets its own to count a visit once rather than twice, and you can refuse them with any browser setting or extension that blocks analytics without losing anything on this site.",
        ],
      },
      {
        heading: "Contact",
        body: [
          "Questions about any of this go to {contact}. The data controller is {entity}, at {address}.",
        ],
      },
    ],
  },
} as const;

export const auth = {
  signUp: {
    title: "Create your free account",
    intro:
      "One account unlocks modules 2 to 8 in every course, and the account stays free.",
    submit: "Create account",
    altPrompt: "Already have an account?",
    altLabel: "Sign in",
    altHref: "/sign-in",
    /* Order matters: this is the tab order, and it is the order a person
       reads their own name in. */
    fields: [
      { name: "first-name", label: "First name", type: "text", autoComplete: "given-name", half: true },
      { name: "last-name", label: "Last name", type: "text", autoComplete: "family-name", half: true },
      { name: "email", label: "Email", type: "email", autoComplete: "email", half: false },
      { name: "password", label: "Password", type: "password", autoComplete: "new-password", half: false },
    ],
  },
  /*
    Sign-up in three steps, from 8 Aug, at Roan's request for company, role and
    referral source.

    ------------------------------------------------------------- THE SEQUENCE

    Roan asked for the questions and asked that the order be a good one, so the
    order is the decision worth recording. It is:

      1. the account       required
      2. your work         optional
      3. how you found us  optional

    Required before optional, and the thing the reader came to do before the
    thing we want. Somebody who abandons after step 1 has an account, which is
    the outcome that matters; the reverse ordering trades a working account for
    a demographic answer, which is a bad trade in both directions.

    Within that, step 2 before step 3 because step 2 is about them and step 3 is
    about us. A reader who has just typed their role is still describing
    themselves; asking "where did you hear about us" first is asking a stranger
    to do marketing research before they have been let in.

    THE ALTERNATIVE WAS ROLE FIRST, and it is the conventional growth answer: a
    one-tap question is a cheaper first step than a password field, and the
    momentum carries into the form. It was rejected because it is not true here.
    Every one of these questions is optional and the page says so, so leading
    with one would be dressing an optional question as the price of entry.

    ------------------------------------------------- WHY THEY ARE ALL SKIPPABLE

    Every field in steps 2 and 3 can be left empty and every one of those steps
    has a Skip control, which is stated on the step rather than implied. A form
    that collects optional data while looking mandatory collects worse data:
    people guess rather than abandon, and a role field full of guesses is worse
    than one that is half empty.

    The privacy policy says the same thing in the same words — that these three
    are optional and used in aggregate to decide which course gets built next —
    so the promise here and the promise there cannot drift.

    ------------------------------------------------------------------ THE OPTIONS

    Eleven roles and eight sources, each ending in "Other" with a text field.
    The roles are written as the work rather than the job title, because a title
    is company-specific and a person who is "Head of Revenue Operations"
    recognises "Revenue or sales operations" instantly. They map onto the five
    courses without saying so: marketing/RevOps/sales to the GTM course, media
    to the media course, engineering to infrastructure, HR/legal/compliance to
    literacy, and founder/owner to the small business course.

    "Student or between roles" is in the list because leaving it out makes those
    people pick something false, and this program is free specifically so that
    they can take it.
  */
  signUpSteps: [
    {
      id: "account",
      label: "Your account",
      title: "Create your free account",
      intro: "One account unlocks modules 2 to 8 in every course, and it stays free.",
      optional: false,
      next: "Continue",
    },
    {
      id: "work",
      label: "Your work",
      title: "What do you work on?",
      /* No personalisation promise. It read "This decides which examples we
         point you at first", and the privacy policy answers the same question
         with the opposite fact: the optional answers "are used in aggregate and
         they do not change what you are shown". One of the two had to go, and
         it is not the policy — a signup screen inventing a benefit the legal
         page denies is the exact drift the note above this block forbids. */
      intro:
        "This tells us which roles are actually turning up, which is how the next course gets chosen. Both questions are optional.",
      optional: true,
      next: "Continue",
    },
    {
      id: "source",
      label: "Finding us",
      title: "How did you find us?",
      intro:
        "Last one, and it is optional too. It tells us which of the things we make are worth making.",
      optional: true,
      next: "Create account",
    },
  ],
  work: {
    companyLabel: "Company or organisation",
    companyHint: "Leave it blank if you are between roles or here on your own.",
    roleLabel: "Which best describes your work?",
    otherLabel: "Tell us in your own words",
    otherPlaceholder: "How you would describe it",
    roles: [
      "Marketing or growth",
      "Revenue or sales operations",
      "Sales",
      "Video, media or post-production",
      "Engineering or platform",
      "Data or analytics",
      "Operations",
      "HR, legal or compliance",
      "Founder or business owner",
      "Student or between roles",
    ],
  },
  source: {
    label: "Where did you hear about this?",
    otherLabel: "Somewhere else",
    otherPlaceholder: "Where you saw it",
    options: [
      "A search engine",
      "LinkedIn",
      "YouTube",
      "A podcast",
      "A friend or colleague",
      "My employer",
      "A conference, event or hackathon",
    ],
  },
  /* The last option of both lists, and the one that opens a text field. It is
     one string rather than two so the two lists cannot drift apart. */
  otherOption: "Other",
  skip: "Skip this step",
  back: "Back",
  /* `${current} of ${total}`, assembled at the call site. Written here so the
     one piece of visible chrome in the stepper is not a template literal buried
     in a component. */
  stepCounter: "Step",
  signIn: {
    title: "Sign in",
    intro: "Pick up in the course you were last working through.",
    submit: "Sign in",
    altPrompt: "First time here?",
    altLabel: "Create a free account",
    altHref: "/sign-up",
    fields: [
      { name: "email", label: "Email", type: "email", autoComplete: "email", half: false },
      { name: "password", label: "Password", type: "password", autoComplete: "current-password", half: false },
    ],
  },
  /*
    The panel beside the form, and the reason these screens are two columns.

    A bare form on a white page is a checkpoint. The three lines here are the
    three the reader is deciding on at this exact moment: what it costs, what
    the account buys, and what they walk away with.
  */
  panel: {
    label: "Free access",
    title: "Module 1 is open to everyone",
    points: [
      "Module 1 of every course runs with no account at all.",
      "One free account unlocks modules 2 to 8 in every course.",
      "You finish by deploying one workflow and measuring what changed.",
    ],
  },
  /* Stated once, under the submit control on the sign-up screen. */
  terms: {
    lead: "By creating an account, you agree to the",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
  /*
    The honest note. It is `t-micro` under the form rather than a banner, because
    a reader who came here to sign in needs to know the button does nothing
    before they type a password into it, and a reader browsing does not need it
    shouted. Delete this the day an auth backend exists.
  */
  /* REMOVED, and the removal is the note.
   *
   * `shellNote` read "Accounts are not open yet and this form is not live." It
   * was the honest thing to say when the form's submit handler called
   * preventDefault, and it became the dishonest thing to say the moment the form
   * started creating real accounts. Both auth screens now render the live state
   * instead — an error slot when something fails, the access model when nothing
   * has, and a check-your-inbox screen when the account is waiting on a link.
   *
   * Deleted rather than left unreferenced, so it cannot be reached for again by
   * somebody looking for a note to put under a button.
   */
} as const;

/* ===========================================================================
   APPLYING TO TEACH, APPLYING TO JUDGE, AND THE BOARD THAT DECIDES

   AT THE FOOT OF THE FILE ON PURPOSE, and the reason is mechanical rather than
   editorial. This block was written while a second session was rewriting the
   `board` region two hundred lines up, and the two sets of edits had to be able
   to land without touching each other. `advisors` reads naturally beside
   `board`; putting it there would have put both changes in one hunk. Move it up
   whenever the file is next quiet.

   Same reasoning behind `Advisor` being its own type instead of another use of
   `Seat`: `Seat` is under active edit, and an advisor is not a seat anyway. An
   advisor holds no course, reads no curriculum and scores no sheet. They decide
   who gets to.
   =========================================================================== */

export type Advisor = {
  id: string;
  name: string;
  /**
   * Their own headline, shortened and nothing else.
   *
   * The same rule the instructor roster and the judge board both hold, for the
   * same reason: a headline is the one description of a person that the person
   * wrote. Everything this site says about a named human being on a public page
   * has to be traceable to them. Pipes and keyword strings come out because they
   * are search bait rather than a job title and because none of them survives
   * `clamp-1` on a card.
   */
  role: string;
  /** The firm, when they publish one. */
  org?: string;
  location?: string;
  /** Backdrop hue behind the hover face. */
  ground: string;
  photo: Img;
  linkedin: string;
};

/*
  The advisory board.

  ------------------------------------------------------------------ what it is

  The body that reads applications to teach and applications to judge. It is
  deliberately NOT the instructor roster and NOT the judge board: an advisor
  holds no path and no seat, which is the whole point of asking them. Roan wrote
  the curriculum, so Roan deciding who gets to teach it is a closed loop, and a
  judge deciding who else joins the judge board is the same loop one page over.

  ---------------------------------------------------------------- one advisor

  Sean Kelley, supplied by Roan on 9 Aug with his profile and his portrait. He
  is the first and today the only one, and the copy below is written so that it
  is true of one and stays true of six: no numeral in the prose, and the count
  in the facts line is read off the array. `plural` exists because "1 advisors"
  is the kind of small wrongness that makes a reader stop trusting the page.

  What is NOT here, and is absent rather than guessed: any characterisation of
  what Sean does for this program beyond reading applications. He agreed to sit
  on the board. He has not been given a title, a term, a vote count or a
  specialism here, and inventing one is the failure the imagery policy at the
  head of this file exists to prevent, in words instead of pixels.
*/
export const advisors = {
  label: "Advisory board",
  headline: "The advisory board decides who teaches and who judges",
  /*
    THE INDEPENDENCE CLAIM IS THE POINT OF THIS PARAGRAPH, so it is stated first and
    stated plainly. Everything else here is process, and process is only interesting
    once a reader believes the decision belongs to somebody other than the person
    whose work is being added to.

    STATED FORWARDS, twice rewritten. It read "read by the advisory board, not by the
    person who wrote the curriculum", and then "Advisors hold no course and no seat
    here" — three negations carrying the most important sentence on the page, which is
    the pattern Roan asked to be rid of. "The decision belongs to the board alone" is
    the same claim and a stronger sentence: "alone" excludes the curriculum's author
    without naming him, so the clause that did nothing else could go.
  */
  /*
    REWRITTEN 9 Aug. Roan: "so bad this negative text, need to fix 'no' and
    'nobody' on /review-judge-board advisor."

    Three sentences in this section were built out of absences — "Advisors hold no
    course and no seat here", "No course, no seat" in the facts line, and a footnote
    opening "Nobody appears on it until…". Read together they describe the advisory
    board almost entirely by what it lacks, which is a strange way to introduce the
    people who decide whether you get in.

    The independence claim is the point of the paragraph and it is NOT weakened
    here: it is stated as the thing it is, which is a positive fact about these
    people. "Independent of every course and every seat" says exactly what "hold no
    course and no seat" said, and says it as a qualification rather than as a gap.
  */
  intro:
    "Every application to teach or to judge is read by the advisory board, and the decision belongs to the board alone. Its advisors sit outside this program, holding their own roles elsewhere in the field, and what they read is the evidence rather than the name on it.",
  seoDescription:
    "The advisory board reads every application to teach or to judge on this program, and decides which ones are seated.",
  /*
    How a decision is actually made, in four steps.

    Written as steps rather than as a paragraph because this is the section a
    sceptical applicant reads twice, and because each line has to survive being
    checked against what the platform does. Step one is the application form.
    Step two is the board reading it. Step three is the interview, which is the
    one step with no software behind it. Step four is what the applicant sees,
    and they see it because the application page shows its own status.
  */
  /*
    Shortened 12 Aug, alongside the apply fold above it. Each body is one
    sentence now. The step titles were already the clearest thing on either
    page and are kept almost as they were; step two lost a clause that
    explained the same idea twice, and step four now says who tells you rather
    than who fails to.
  */
  process: [
    {
      title: "Everything in one file",
      body: "Your evidence, your links, your portrait and how to reach you, sent from inside your account rather than emailed around.",
    },
    {
      title: "Measured against what the seat requires",
      body: "Your application is measured against what the seat requires, so a strong intake keeps the bar where it is and a thin one keeps it there too.",
    },
    {
      title: "A conversation, if it gets that far",
      body: "Anyone the board is seriously considering talks to an advisor, and for a teaching seat that includes watching you explain one thing you built.",
    },
    {
      title: "An answer either way",
      body: "The page you applied from shows where your application stands, and it changes the day the board decides.",
    },
  ],
  members: [
    {
      id: "sean-kelley",
      name: "Sean Kelley",
      /*
        His own headline, which reads in full:

          "Advisor & Angel (Climate Tech / Regenerative Ag/BioChar/ Talent Tech)
           | Veteran Champion | Crohn's & Colitis Cure Seeker |"

        The two pipe-separated clauses are causes he champions rather than a
        description of what he does, and neither is a claim this program has any
        business restating on his behalf. The parenthetical is his sector list,
        which is the part that says what an advisor of his actually reads, so it
        stays and is set as prose.
      */
      role: "Advisor and angel investor across climate tech, regenerative agriculture and talent tech",
      org: "Sage&Sea Ventures",
      location: "Folsom, California",
      /* One neutral for everybody, the same value the judge cards use, and for
         the same reason: this hue means "the course this person reads" and an
         advisor reads no course. */
      ground: "var(--ink-secondary)",
      photo: {
        src: "/images/people/sean-kelley.jpg",
        alt: "Studio portrait of Sean Kelley",
      },
      linkedin: "https://www.linkedin.com/in/pxkelley/",
    },
  ] as readonly Advisor[],
  /*
    The disclosure, and it is doing the job the judge board's footnote used to
    do at the equivalent moment.

    A section headed "Advisory board" carrying one card invites exactly one
    reading — that the rest are hidden, or coming, or were not worth listing —
    and the honest answer is the third thing: the board is one person because
    one person has agreed. Saying so costs a sentence and is the difference
    between a page that is small and a page that is overstating itself.
  */
  /* Same rewrite. The old line — "Nobody appears on it until they have agreed to
     sit on it" — was making a promise about the site's honesty by describing a
     thing that does not happen, which asks a reader to imagine the dishonest
     version first. Stated forwards it is a stronger sentence and a shorter one. */
  footnote:
    "Every advisor here has agreed to sit on the board, and this is the whole of it. The board is still being seated, so it will grow.",
} as const;

/** "1 advisor", "6 advisors". A count in a facts line has to agree with itself. */
export const advisorCount = `${advisors.members.length} advisor${
  advisors.members.length === 1 ? "" : "s"
}`;

/* ---------------------------------------------------------------- the tracks

  Two ways in, and the shape below is shared so that neither one quietly grows
  a section the other lacks.

  ------------------------------------------------------------ on selectivity

  Roan asked for this to read the way a genuinely selective process reads, and
  the way to do that is NOT adjectives. "Ultra-selective" as a word does no work
  a reader will believe; what does the work is a bar written specifically enough
  that most readers can tell, from reading it, that they do not clear it. So
  every `bar` item below names a thing that either exists or does not, and
  `asked` states the cost of accepting, because a page that only sells the
  status is recruiting the wrong applicant.

  ------------------------------------------------------ on numbers, and on one

  `seats` is present on the instructor track and absent on the judge track,
  which is Roan's call on 9 Aug and not an oversight. Two instructor seats is a
  fact he has decided. The judge board has no vacancy count he wants published,
  and a number invented to sound scarce is the exact thing this file refuses
  everywhere else. A track with no `seats` renders `scarcity` alone.

  ---------------------------------------------------------------- on the flow

  Three steps, because the flow Roan specified has three: sign in, complete the
  form inside the platform, add contact details and submit. The reason the form
  is behind a login is written into step one rather than left implied. It is a
  real reason: the second half of it asks for a photograph, a phone number and a
  WhatsApp number, and a public form that collects those is a public form
  collecting those.
*/
export type ApplyStep = { n: string; title: string; body: string };

export type ApplyTrack = {
  id: "instructor" | "judge";
  /** Route under /apply. Guarded by `requireUser`, so this is also the sign-in gate. */
  href: string;
  label: string;
  headline: string;
  intro: string;
  /** The number, where a number has been decided. Absent renders nothing. */
  seats?: string;
  /** Why it is hard, stated as what happens rather than as an adjective. */
  scarcity: string;
  /** What the board looks for. Every item is checkable by a stranger. */
  bar: readonly string[];
  /** What the seat costs, so nobody accepts one and then discovers it. */
  asked: readonly string[];
  steps: readonly ApplyStep[];
  cta: string;
  /** The line of small print under the control. What pressing it costs, in a phrase. */
  note: string;
  /*
    `resume` IS GONE, removed 9 Aug. It held "Continue your application" and was
    rendered as a second link under the CTA, pointing at the same href. Roan: "remove
    'Continue your application' because its the same." apply-band.tsx has the note.
  */
};

/*
  Annotated rather than `as const`, and that is load-bearing rather than a style
  choice. Under `as const` the two tracks are two different literal types, only
  one of which has a `seats` key, so `apply[track].seats` at a call site that does
  not know which track it holds is a compile error — which is exactly the call
  site the /apply route is. The annotation makes both tracks the same type, with
  `seats` optional on it, which is what the shape actually is.
*/
export const apply: Record<"instructor" | "judge", ApplyTrack> = {
  instructor: {
    id: "instructor",
    href: "/apply/instructor",
    label: "Teach on this program",
    headline: "Two instructor seats are open",
    intro:
      "Every lesson here is recorded by somebody who runs the system they are teaching. That is the whole standard, and it is what decides who gets a seat.",
    seats: "Two seats this intake",
    /*
      The sentence that makes the selectivity credible is the last one. Anybody
      can say a bar is high; saying that a seat stays open until somebody clears
      the bar is a statement that can be checked against what the board does, and
      it is the one claim here that costs something to make.

      Rewritten 9 Aug to say it forwards. It read "an intake that produces nobody
      at the bar closes with the seats still open rather than filling them", which
      is three negations describing a hypothetical failure. Roan's rule is that
      copy states what happens, not what fails to; the claim survives intact,
      because "a seat waits for somebody who clears it" is the same promise.
    */
    scarcity:
      "The bar is closer to an academic appointment than to a marketplace listing. The advisory board reads every application against it, and a seat waits until somebody clears that bar.",
    bar: [
      "A system you built or run in production, and the standing to say how it actually behaves.",
      "Work a stranger can check for themselves: a repository, a product, a paper, a talk, a public profile with your name on it.",
      "Recognition from outside your own company. Judging, advising, speaking, teaching, reviewing, or being cited by people elsewhere in the field.",
      "The ability to teach one thing well on camera, which is a separate skill from doing it well and is the one the board tests directly.",
      "Time. One course is roughly eight modules of recording, plus the board's review each term.",
    ],
    asked: [
      "Record the deep dives on one course, in your own voice, against a curriculum somebody else wrote.",
      "Keep that course honest as the tools move, and say when a lesson has stopped being true.",
      "Sit for the board's review each term, on the same terms the curriculum does.",
    ],
    /*
      Rewritten 12 Aug. Each title was a clause with the action buried in it —
      "Sign in, or make an account", "Fill in the rest of the form", "Add how to
      reach you, then submit" — under a heading that described the site's own
      architecture rather than telling anybody what to do. A reader could not
      answer "what do I press first, and how long will this take" from the fold
      that exists to answer exactly that.

      Now each title is one imperative and each body is what that step asks for,
      in the order the form asks for it. The reasons that used to be in the
      titles are still here; they are in the bodies, which is where a reason
      belongs when the reader has already decided to do the thing.
    */
    steps: [
      {
        n: "01",
        title: "Create your free account",
        body: "The same account that opens the courses. Your application lives behind your own login because the second half of it asks for your photograph and your phone number, and those belong somewhere only you can post to.",
      },
      {
        n: "02",
        title: "Fill in the form",
        body: "Your portrait, your profile links, the course you would record, and the evidence behind it. Every field saves as you go, so you can stop halfway and finish it another day.",
      },
      {
        n: "03",
        title: "Send it to the board",
        body: "Add your phone, whether you can sit on a panel in person and in which city, and anything else worth knowing. Pressing send puts it in front of the advisory board, and the same page then shows you where it stands.",
      },
    ],
    cta: "Apply to teach",
    note: "Have your profile links and a portrait to hand before you start.",
  },
  judge: {
    id: "judge",
    href: "/apply/judge",
    label: "Judge on this program",
    headline: "The board is taking judges",
    intro:
      "A judge reads the courses each term and sits on the panel that judges the events where learners present the workflows they deployed. It is the one role here that can send a learner back for another pass at the workflow.",
    /*
      NO `seats`. See the note above the type: the judge board publishes no
      vacancy count, so this track states why it is hard and says nothing about
      how many. The scarcity line therefore has to carry the whole weight on its
      own, which is why it is about exposure rather than about arithmetic: a
      judge's name is on a public page and their verdict is on the record, and
      that is a truer account of why few people are seated than any number.
    */
    scarcity:
      "A seat is held by one person for one discipline, that person's name is on the board in public, and their verdict is on the record under it. Every judge reaches their own verdict and signs it. The advisory board seats a small fraction of the people who apply.",
    bar: [
      "Depth in one discipline, measured in years of doing the work yourself.",
      "A public record somebody else can check: published work, a product shipped, a panel sat on, a profile that matches what you claim.",
      "Judgement that has been tested in the open. Hiring, reviewing, grading, funding, or shipping to a deadline somebody else set.",
      "Independence from the course you would be reading, and the willingness to say so if that ever changes.",
    ],
    asked: [
      "One curriculum review per term, filed against the sentence that defines your seat.",
      "Score the outcome sheets learners submit against the rubric, reading the work rather than the name on it.",
      "Sit on the event panel when there is one.",
    ],
    /* Steps 01 and 03 are word for word the instructor track's. That is
       deliberate: it is one form and one board, and two descriptions of one
       process is how they drift. Only 02 differs, because only 02 asks for
       something different. */
    steps: [
      {
        n: "01",
        title: "Create your free account",
        body: "The same account that opens the courses. Your application lives behind your own login because the second half of it asks for your photograph and your phone number, and those belong somewhere only you can post to.",
      },
      {
        n: "02",
        title: "Fill in the form",
        body: "Your portrait, your profile links, the discipline you would read, and the evidence behind it. Every field saves as you go, so you can stop halfway and finish it another day.",
      },
      {
        n: "03",
        title: "Send it to the board",
        body: "Add your phone, whether you can sit on a panel in person and in which city, and anything else worth knowing. Pressing send puts it in front of the advisory board, and the same page then shows you where it stands.",
      },
    ],
    cta: "Apply to judge",
    note: "Have your profile links and a portrait to hand before you start.",
  },
};
