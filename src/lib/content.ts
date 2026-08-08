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

export type Img = { src: string; alt: string };

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
  view: "View course",
  compare: "Compare all five courses",
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
 */
export function startsOn(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
export const nav = [
  { label: "Courses", href: "/#courses" },
  { label: "Method", href: "/#method" },
  { label: "Outcomes", href: "/#outcomes" },
  { label: "Instructors", href: "/#instructors" },
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
  { label: "FAQ", href: "/#faq" },
] as const;

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
  lesson: {
    label: "Module 1, lesson 1",
    status: "Open",
    title: "Profile the workflow you want to improve",
    body: "A working session. Pick one process you own, record how long it takes today, and write the brief you will build against.",
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

  It is 66px of the band's height, which matters here more than anywhere else on
  the page: the merged section has to fit a 14in MacBook without scrolling, and
  modules.tsx has the full accounting.

  `access` is new on each step and only the homepage reads it. curriculum.tsx
  maps eight modules onto these five by `step` and reads `name` and `output`.
*/
export const method = {
  eyebrow: "The method",
  headline: "Build, deploy, and document one workflow in five steps",
  intro:
    "Every course here runs on the same five steps, whatever you build. Each module pairs one focused lesson with one guided lab you run on your own workflow.",
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
  badge: string;
  title: string;
  /** Short audience line printed on the cover, under the badge. */
  coverAudience: string;
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
};

/** One row inside a module. */
export type Lesson = {
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
export const moduleCount = (c: Course) => `${c.curriculum.length} modules`;

export const lessonCount = (m: CourseModule) =>
  `${m.lessons.length} ${m.lessons.length === 1 ? "lesson" : "lessons"}`;

export const totalLessons = (c: Course) =>
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
export const courses: readonly Course[] = [
  {
    id: "gtm",
    badge: "Course A",
    title: "Applied AI for GTM teams",
    coverAudience: "Marketing ops, RevOps, growth",
    coverBuild: "An agent workflow on your live pipeline",
    ground: "var(--path-a)",
    cover: {
      src: "/images/paths/gtm.jpg",
      alt: "A marketing operations lead working from a laptop in a bright open-plan office",
    },
    level: "Intermediate",
    duration: "6 weeks",
    facts: [
      { label: "Artifact", value: "Pipeline agent" },
      { label: "Runs on", value: "Your CRM data" },
      { label: "Level", value: "Intermediate" },
    ],
    summary: "Agent workflows on your own pipeline data, live in your revenue stack.",
    audience: "Marketing ops, RevOps, growth analysts and GTM engineers",
    build: "A multimodal agent workflow running against your live pipeline data.",
    skills: ["Agent workflows", "Revenue analytics", "Multimodal APIs", "Automation design"],
    tagline:
      "Build a multimodal agent workflow on your own pipeline data, launch it in the revenue stack your team already works in, and measure what it changed.",
    stats: [
      { value: "Free", label: "Every module" },
      { value: "8 modules", label: "Lesson and lab in each" },
      { value: "6 weeks", label: "At your own pace" },
      { value: "Intermediate", label: "Recommended" },
    ],
    whatLearn: [
      "Map your go-to-market workflow end to end and record a baseline you can defend.",
      "Build an agent workflow on your own pipeline data with current multimodal models.",
      "Connect approved prompts and automations to your CRM and marketing stack.",
      "Score opportunities, forecast, and read churn and expansion signals.",
      "Measure time saved and cost per output against the baseline you started from.",
      "Finish with a completion record: the brief, the build, the launch and the result.",
    ],
    requirements: [
      "One go-to-market workflow you own, and permission to change it.",
      "Access to your CRM and the marketing tools your team already uses.",
      "About four hours a week for six weeks.",
      "Comfort reading a spreadsheet. The labs supply every prompt and template.",
    ],
    description: [
      "This course is for the technical layer of go-to-market: marketing ops, RevOps, growth analysts and GTM engineers. It treats marketing, sales and revenue operations as one operating system rather than three separate subjects, which is the gap across every comparable course on the market today.",
      "The method is the one every course here runs on. You profile one workflow you own and record what it costs today. You build the agent workflow on your own pipeline data through eight guided labs. You launch it into the revenue stack your team already works in. Then you measure the same thing again and document what changed.",
      "The capstone is a traceable workflow rather than a set of prompts. It carries an ICP brief, campaign assets, a sales sequence, an automation diagram, a measurement plan and the controls that let it run without somebody watching it.",
      "Roan Weigert records the core lessons. The agent loop at the centre of module 2 is the subject of his AGI Summit SF 2026 keynote, The Multimodal Agent Loop: Orchestrating AI for GTM.",
    ],
    preview: {
      src: "/media/tutorial-2.mp4",
      poster: "/images/scenes/lesson-recording.jpg",
      posterAlt: "Roan Weigert recording a lesson at the studio microphone",
      card: { title: "Module 1, lesson 1" },
    },
    curriculum: [
      {
        n: "01",
        name: "The GTM AI operating model",
        summary:
          "Map the whole revenue process once, then choose the one part of it you will rebuild.",
        step: 1,
        access: "open",
        artifact: "Baseline and use-case map",
        lessons: [
          { name: "Map your customer journey end to end", kind: "lesson", minutes: 14 },
          { name: "Find the high-value use cases", kind: "lesson" },
          { name: "Record your baseline on time, cost or quality", kind: "lab" },
          { name: "Decide where a human stays in the loop", kind: "lesson" },
        ],
      },
      {
        n: "02",
        name: "Market and account intelligence",
        summary:
          "The multimodal agent loop, applied to research a rep would otherwise do by hand.",
        step: 2,
        access: "account",
        artifact: "ICP and account brief",
        lessons: [
          { name: "Build the ICP from your own closed-won data", kind: "lab" },
          { name: "Persona and account research", kind: "lesson" },
          { name: "Competitive and intent signals", kind: "lesson" },
          { name: "Verify a source before it reaches a rep", kind: "lesson" },
          { name: "The account brief", kind: "template" },
        ],
      },
      {
        n: "03",
        name: "The messaging and campaign system",
        summary: "One source message, adapted by the workflow to every channel you run.",
        step: 2,
        access: "account",
        artifact: "Campaign system",
        lessons: [
          { name: "Positioning and the offer", kind: "lesson" },
          { name: "Channel adaptations from one source message", kind: "lab" },
          { name: "Build the content calendar", kind: "lab" },
          { name: "Email sequence and landing page", kind: "lab" },
          { name: "Ad variants and the review step", kind: "lesson" },
        ],
      },
      {
        n: "04",
        name: "AI-enabled selling",
        summary: "Prospecting, call preparation and follow-up, on the briefs from module 2.",
        step: 2,
        access: "account",
        artifact: "Sales sequence",
        lessons: [
          { name: "Prospecting and personalization at account level", kind: "lab" },
          { name: "Call preparation from the account brief", kind: "lesson" },
          { name: "Call summaries and next steps", kind: "lab" },
          { name: "Qualification and objection handling", kind: "lesson" },
          { name: "Follow-up a rep will actually send", kind: "lab" },
        ],
      },
      {
        n: "05",
        name: "Workflow deployment",
        summary: "The workflow goes live in your stack. Launching it completes the course.",
        step: 3,
        access: "account",
        artifact: "Automation diagram",
        lessons: [
          { name: "Connect the approved prompts to your CRM", kind: "lab" },
          { name: "Marketing automation and meeting tools", kind: "lab" },
          { name: "Handoff rules and who owns each step", kind: "lesson" },
          { name: "The launch checklist", kind: "template" },
          { name: "Run the first week live", kind: "lab" },
        ],
      },
      {
        n: "06",
        name: "Revenue intelligence",
        summary: "What the workflow tells you about the pipeline once it has been running.",
        step: 4,
        access: "account",
        artifact: "Pipeline scorecard",
        lessons: [
          { name: "Opportunity scoring on your own pipeline", kind: "lab" },
          { name: "Pipeline hygiene rules", kind: "lesson" },
          { name: "Forecasting with the agent in the loop", kind: "lab" },
          { name: "Churn risk and expansion signals", kind: "lesson" },
          { name: "The executive report", kind: "template" },
        ],
      },
      {
        n: "07",
        name: "Experimentation and ROI",
        summary: "Measure the same thing you measured in module 1, and state the difference.",
        step: 4,
        access: "account",
        artifact: "Test log and outcome sheet",
        lessons: [
          { name: "Design the test", kind: "lesson" },
          { name: "Measure time saved and cost per output", kind: "lab" },
          { name: "Quality review against a rubric", kind: "lesson" },
          { name: "The outcome sheet", kind: "template" },
        ],
      },
      {
        n: "08",
        name: "Governance and capstone",
        summary: "The controls that let it run without you, and the record that proves it ran.",
        step: 5,
        access: "account",
        artifact: "Completion record",
        lessons: [
          { name: "Approved-data rules and brand controls", kind: "lesson" },
          { name: "Disclosure and human accountability", kind: "lesson" },
          { name: "Document the workflow for a successor", kind: "lab" },
          { name: "Maintenance, and how to judge a replacement tool", kind: "lesson" },
          { name: "Assemble the completion record", kind: "lab" },
          { name: "Publish it and book the review", kind: "lesson" },
        ],
      },
    ],
  },
  {
    id: "media",
    badge: "Course B",
    title: "Applied AI for video and media",
    coverAudience: "Editors, producers, post supervisors",
    coverBuild: "An ingest and rough-cut pipeline",
    ground: "var(--path-b)",
    cover: {
      src: "/images/paths/media.jpg",
      alt: "A video editor at the desk in a dimly lit edit suite",
    },
    level: "Intermediate",
    duration: "6 weeks",
    facts: [
      { label: "Artifact", value: "Rough cut" },
      { label: "Runs on", value: "Your footage" },
      { label: "Level", value: "Intermediate" },
    ],
    summary: "Multimodal production workflows, from ingest to a rough cut.",
    audience: "Editors, producers and post supervisors",
    build: "An ingest, logging and rough-cut workflow inside your studio pipeline.",
    skills: ["Footage intelligence", "Generative video", "Edit automation", "Pipeline design"],
    tagline:
      "Build an ingest, logging and rough-cut workflow on your own footage, run it inside your studio pipeline, and measure the hours it gives back.",
    stats: [
      { value: "Free", label: "Every module" },
      { value: "8 modules", label: "Lesson and lab in each" },
      { value: "6 weeks", label: "At your own pace" },
      { value: "Intermediate", label: "Recommended" },
    ],
    whatLearn: [
      "Write a creative brief that a generative pipeline can actually be held to.",
      "Hold character, style and continuity across shots that models generate separately.",
      "Direct voice, music and sound, and keep a licence and consent record for each.",
      "Assemble, caption, grade and export to a delivery specification.",
      "Keep a prompt and iteration log that stands up as provenance.",
      "Finish with a master, two channel adaptations and a measured before and after.",
    ],
    requirements: [
      "One production workflow you own, and permission to change it.",
      "Your own footage, or a project you have the rights to work with.",
      "An edit application you already know.",
      "About four hours a week for six weeks.",
    ],
    description: [
      "This course is for the people who own post: editors, producers and post supervisors. It starts from the professional process rather than from a tool list, so the generative work sits inside a brief, a storyboard and a delivery specification the way it does on a real job.",
      "Roan's published book on applied AI in media production is the spine of the subject matter, and the studio work behind it is where these workflows were first run.",
      "The method is the one every course here runs on. You record what one part of your pipeline costs today, build the workflow on your own footage across eight guided labs, run it on a real delivery, then measure the same thing again.",
      "The capstone is a package rather than a showreel: a creative brief, a storyboard, a prompt and iteration log, the final master, two channel adaptations, a rights and provenance sheet, and a retrospective. That set is considerably harder to imitate than a demonstration of five tools.",
    ],
    curriculum: [
      {
        n: "01",
        name: "Creative brief and production strategy",
        summary: "Audience, message, format and constraints, plus what this delivery costs today.",
        step: 1,
        access: "open",
        artifact: "Creative brief and baseline",
        lessons: [
          { name: "Audience, platform, message, format", kind: "lesson" },
          { name: "Constraints, references and budget", kind: "lesson" },
          { name: "Record the baseline on your current delivery", kind: "lab" },
          { name: "Define the success measure", kind: "lesson" },
        ],
      },
      {
        n: "02",
        name: "Concept and script",
        summary: "Ideation and structure, with factuality and brand voice held as constraints.",
        step: 2,
        access: "account",
        artifact: "Logline and script",
        lessons: [
          { name: "Ideation and the logline", kind: "lab" },
          { name: "Narrative structure and shot intent", kind: "lesson" },
          { name: "Factuality and brand voice", kind: "lesson" },
          { name: "The script pass", kind: "lab" },
        ],
      },
      {
        n: "03",
        name: "Visual development",
        summary: "The continuity problem, solved before generation rather than during it.",
        step: 2,
        access: "account",
        artifact: "Storyboard and continuity bible",
        lessons: [
          { name: "Style frames and the mood board", kind: "lab" },
          { name: "Character and style consistency", kind: "lesson" },
          { name: "Storyboard and shot list", kind: "lab" },
          { name: "The continuity bible", kind: "template" },
        ],
      },
      {
        n: "04",
        name: "The generation lab",
        summary: "Text to video, image to video, camera language, and diagnosing a bad take.",
        step: 2,
        access: "account",
        artifact: "Prompt and iteration log",
        lessons: [
          { name: "Text to video and image to video", kind: "lab" },
          { name: "Camera language and motion control", kind: "lesson" },
          { name: "Iteration, and reading a failure", kind: "lab" },
          { name: "Asset management and naming", kind: "lesson" },
          { name: "The iteration log", kind: "template" },
        ],
      },
      {
        n: "05",
        name: "Voice, music and sound",
        summary: "Direction and timing, with consent and licensing recorded as you go.",
        step: 2,
        access: "account",
        artifact: "Audio bed and voice record",
        lessons: [
          { name: "Voice direction", kind: "lab" },
          { name: "Consent and cloning rules", kind: "lesson" },
          { name: "Music and effects generation", kind: "lab" },
          { name: "Timing and licensing", kind: "lesson" },
        ],
      },
      {
        n: "06",
        name: "Edit and finish",
        summary: "Assembly through export, to a specification somebody else could check.",
        step: 3,
        access: "account",
        artifact: "Final master",
        lessons: [
          { name: "Assembly and pacing", kind: "lab" },
          { name: "Transitions and lip sync", kind: "lesson" },
          { name: "Captions and colour", kind: "lab" },
          { name: "Upscaling and quality control", kind: "lesson" },
          { name: "Export specifications", kind: "template" },
        ],
      },
      {
        n: "07",
        name: "Distribution and performance",
        summary: "Ship the versions, then read what the platform tells you about them.",
        step: 4,
        access: "account",
        artifact: "Two channel adaptations",
        lessons: [
          { name: "Platform versions and thumbnails", kind: "lab" },
          { name: "Accessibility as a delivery requirement", kind: "lesson" },
          { name: "Retention signals and the performance review", kind: "lab" },
          { name: "Reuse and the outcome sheet", kind: "template" },
        ],
      },
      {
        n: "08",
        name: "Rights, provenance and capstone",
        summary: "The paperwork that makes the work usable, and the record that closes the course.",
        step: 5,
        access: "account",
        artifact: "Completion record",
        lessons: [
          { name: "Releases and copyright", kind: "lesson" },
          { name: "Disclosure and the source ledger", kind: "lab" },
          { name: "The model and tool record", kind: "template" },
          { name: "Assemble the completion record", kind: "lab" },
          { name: "Publish it and book the review", kind: "lesson" },
        ],
      },
    ],
  },
  /*
    Course C was "Applied AI for industry teams", a vision and triage workflow for
    claims, vegetation management and security operations. It is now AI
    literacy, ethics and data compliance, on Roan's instruction.

    Worth knowing when this is revisited: the program brief still describes
    Track C the other way, and describes it as "the richest source of
    arm's-length organization letters", which is an evidence claim rather than a
    curriculum preference. The brief is the source of truth for every other
    claim on this page, so either it moves too or this course is a deliberate
    departure from it.

    The mechanic survives the change intact, which is what made it a workable
    swap: a policy is a thing you write, put into use and then measure, so
    module 01 still records a baseline and the last module still measures against
    it. The baseline here is how the team handles data today, not a duration.
  */
  {
    id: "literacy",
    badge: "Course C",
    title: "AI literacy, ethics and data compliance",
    coverAudience: "Team leads, operations, HR and legal",
    coverBuild: "An AI use policy your team runs on",
    ground: "var(--path-c)",
    cover: {
      src: "/images/paths/literacy.jpg",
      alt: "Two colleagues reviewing printed pages beside a laptop in a meeting room",
    },
    level: "Foundational",
    duration: "4 weeks",
    facts: [
      { label: "Artifact", value: "Use policy" },
      { label: "Runs on", value: "Your own tools" },
      { label: "Level", value: "Foundational" },
    ],
    summary:
      "A working AI policy for your team, covering what the tools may touch and who checks it.",
    audience: "Team leads, operations, HR and legal owners of how a team uses AI",
    build: "An AI use policy in force across your team, with a review step people follow.",
    skills: ["AI literacy", "Data classification", "Policy design", "Review and audit"],
    tagline:
      "Write the AI use policy your team will actually follow, put it in force with a review step, and measure how the decisions change.",
    stats: [
      { value: "Free", label: "Every module" },
      { value: "8 modules", label: "Lesson and lab in each" },
      { value: "4 weeks", label: "At your own pace" },
      { value: "Foundational", label: "Recommended" },
    ],
    whatLearn: [
      "Explain what these systems do and where their output needs a human.",
      "Classify the data your team handles and decide which tools may see it.",
      "Assess a use case for bias, transparency, accessibility and intellectual property.",
      "Run an intake, risk tiering and approval process people can follow.",
      "Place the EU AI Act, privacy principles and the NIST AI RMF against your own work.",
      "Finish with a governance pack: register, risk assessment, controls and an incident playbook.",
    ],
    requirements: [
      "Responsibility for how one team uses AI, and the standing to set a rule.",
      "A list of the tools your team uses today, however informal.",
      "About three hours a week for four weeks.",
      "A colleague who will review the policy with you.",
    ],
    description: [
      "This course is for whoever owns the answer to \"are we allowed to use that\": team leads, operations, HR and legal. It is written for the person who has to make the decision rather than for a specialist who audits it afterwards.",
      "It is role-sensitive by design. Everybody completes the literacy core in modules 1 to 3, and the scenarios in module 7 differ for managers, for the people building workflows, and for compliance staff.",
      "The method is the one every course here runs on. You record how your team handles data today, write the policy and its review step, put both in force, then measure how the decisions changed.",
      "One boundary is stated in the course and worth stating here: this is practitioner training on governance, and it is not legal advice. Module 5 is explicit about where the material stops and your counsel starts.",
    ],
    curriculum: [
      {
        n: "01",
        name: "AI literacy for work",
        summary: "What these systems do, what they do not, and how your team uses them today.",
        step: 1,
        access: "open",
        artifact: "Current-state baseline",
        lessons: [
          { name: "What the systems do and do not do", kind: "lesson" },
          { name: "Probabilistic output and hallucination", kind: "lesson" },
          { name: "Record how your team uses AI today", kind: "lab" },
          { name: "Where human reliance belongs", kind: "lesson" },
        ],
      },
      {
        n: "02",
        name: "Data classification and safe use",
        summary: "Four tiers of data, and which tools each tier is allowed to reach.",
        step: 2,
        access: "account",
        artifact: "Data classification",
        lessons: [
          { name: "Public, internal, confidential, restricted", kind: "lesson" },
          { name: "Personal data and retention", kind: "lesson" },
          { name: "Vendor terms and prompt leakage", kind: "lesson" },
          { name: "Classify your own data", kind: "lab" },
          { name: "The approved-tool decision", kind: "template" },
        ],
      },
      {
        n: "03",
        name: "Ethical risk",
        summary: "The harms worth checking for, and how to check for them repeatably.",
        step: 2,
        access: "account",
        artifact: "Risk assessment",
        lessons: [
          { name: "Bias, fairness and human impact", kind: "lesson" },
          { name: "Transparency, explainability and accessibility", kind: "lesson" },
          { name: "Intellectual property and misinformation", kind: "lesson" },
          { name: "Assess one of your own use cases", kind: "lab" },
        ],
      },
      {
        n: "04",
        name: "The governance lifecycle",
        summary: "Intake to retirement, with a named owner at every gate.",
        step: 2,
        access: "account",
        artifact: "Use-case register",
        lessons: [
          { name: "Use-case intake and risk tiering", kind: "lesson" },
          { name: "Owners and responsibilities", kind: "lesson" },
          { name: "Approval gates", kind: "lesson" },
          { name: "Build the model and vendor inventory", kind: "lab" },
          { name: "Monitoring and retirement", kind: "lesson" },
        ],
      },
      {
        n: "05",
        name: "Regulation and frameworks",
        summary: "The EU AI Act, privacy principles and the NIST AI RMF against your own work.",
        step: 2,
        access: "account",
        artifact: "Obligations map",
        lessons: [
          { name: "The EU AI Act, in the shape of your use cases", kind: "lesson" },
          { name: "Privacy principles", kind: "lesson" },
          { name: "The NIST AI risk management framework", kind: "lesson" },
          { name: "Where this material stops and counsel starts", kind: "lesson" },
        ],
      },
      {
        n: "06",
        name: "Operational controls",
        summary: "The policy goes into force. Putting it in force completes the course.",
        step: 3,
        access: "account",
        artifact: "Control plan",
        lessons: [
          { name: "Write the acceptable-use policy", kind: "lab" },
          { name: "Human review and escalation", kind: "lesson" },
          { name: "Red teaming and audit evidence", kind: "lab" },
          { name: "Employee training and third-party oversight", kind: "lesson" },
          { name: "Put it in force across the team", kind: "lab" },
        ],
      },
      {
        n: "07",
        name: "Scenario labs",
        summary: "Six real decisions run against the policy you just wrote.",
        step: 4,
        access: "account",
        artifact: "Decision log",
        lessons: [
          { name: "Hiring and marketing content", kind: "lab" },
          { name: "Customer support and education", kind: "lab" },
          { name: "Finance and healthcare", kind: "lab" },
          { name: "Measure the change in decisions", kind: "lab" },
          { name: "The outcome sheet", kind: "template" },
        ],
      },
      {
        n: "08",
        name: "The governance pack and capstone",
        summary: "Everything above, assembled into one document a director can read.",
        step: 5,
        access: "account",
        artifact: "Completion record",
        lessons: [
          { name: "Assemble the register and classification", kind: "lab" },
          { name: "User notice and the incident playbook", kind: "template" },
          { name: "Write the executive summary", kind: "lab" },
          { name: "Publish it and book the review", kind: "lesson" },
        ],
      },
    ],
  },
  {
    id: "infra",
    badge: "Course D",
    title: "Applied AI infrastructure",
    coverAudience: "Developers who own the serving layer",
    coverBuild: "Model serving on GPU cloud",
    ground: "var(--path-d)",
    cover: {
      src: "/images/paths/infra.jpg",
      alt: "A platform engineer reading a terminal at a standing desk",
    },
    level: "Advanced",
    duration: "6 weeks",
    facts: [
      { label: "Artifact", value: "Serving stack" },
      { label: "Runs on", value: "GPU cloud" },
      { label: "Level", value: "Advanced" },
    ],
    summary: "Serving, scaling and operating models on GPU cloud infrastructure.",
    audience: "Developers who own the serving layer",
    build: "Model serving, scaling and cost control on GPU cloud infrastructure.",
    skills: ["Model serving", "GPU orchestration", "Cost control", "Observability"],
    tagline:
      "Deploy a production-style AI service on GPU cloud, with an evaluation gate, a cost model, a runbook and a rollback you have demonstrated.",
    stats: [
      { value: "Free", label: "Every module" },
      { value: "8 modules", label: "Lesson and lab in each" },
      { value: "6 weeks", label: "At your own pace" },
      { value: "Advanced", label: "Recommended" },
    ],
    whatLearn: [
      "Choose between hosted inference and self-hosting from latency, cost and data constraints.",
      "Size compute, storage and networking, and estimate what the workload will cost.",
      "Package code, data, model and prompt assets so a build is reproducible.",
      "Serve at scale with batching, caching, queues, autoscaling and guardrails.",
      "Gate releases on automated evaluation, and roll back on demand.",
      "Operate it: traces, drift, GPU utilisation, cost, service objectives and incidents.",
    ],
    requirements: [
      "One service you own, and permission to change how it is deployed.",
      "A GPU cloud account, and the ability to spend on it.",
      "Working knowledge of containers and a CI system.",
      "About five hours a week for six weeks.",
    ],
    description: [
      "This course is for developers who own the serving layer, and it is the catalog's advanced anchor. The GMI Cloud work behind it is where these patterns were run at production scale.",
      "It is deliberately compact. The strongest comparable course on the market runs 61 hours, and depth there comes from repeated explanation. Roughly ten to sixteen hours with demanding labs and a real evaluation gate is a more credible claim, so the modules are dense and the labs are where the time goes.",
      "The method is the one every course here runs on. You profile the workload and record what it costs and how it performs today. You build serving, packaging and observability across eight guided labs. You deploy to production infrastructure, then measure latency, utilisation and cost against your baseline.",
      "The capstone is a production-style service with an architecture decision record, a cost model, automated evaluation, a dashboard, a runbook, a threat model, and a rollback you have actually demonstrated.",
    ],
    curriculum: [
      {
        n: "01",
        name: "Architecture and workload discovery",
        summary: "What the workload actually needs, and what it costs and returns today.",
        step: 1,
        access: "open",
        artifact: "Baseline and decision record",
        lessons: [
          { name: "Training against inference", kind: "lesson" },
          { name: "Hosted API against self-hosting", kind: "lesson" },
          { name: "Record latency, throughput and cost today", kind: "lab" },
          { name: "Data sensitivity and reliability targets", kind: "lesson" },
        ],
      },
      {
        n: "02",
        name: "Compute, storage and networking",
        summary: "Sizing the machine, and knowing the bill before it arrives.",
        step: 2,
        access: "account",
        artifact: "Cost model",
        lessons: [
          { name: "CPU and GPU trade-offs", kind: "lesson" },
          { name: "Memory and storage patterns", kind: "lesson" },
          { name: "Data movement, and where it costs", kind: "lesson" },
          { name: "Cloud, on-premises and hybrid", kind: "lesson" },
          { name: "Build the cost estimate", kind: "lab" },
        ],
      },
      {
        n: "03",
        name: "Packaging and reproducibility",
        summary: "A build somebody else can reproduce, including the prompts.",
        step: 2,
        access: "account",
        artifact: "Versioned build",
        lessons: [
          { name: "Environments and containers", kind: "lab" },
          { name: "Versioning code, data, model and prompt assets", kind: "lesson" },
          { name: "Registries and artifact lineage", kind: "lab" },
        ],
      },
      {
        n: "04",
        name: "Serving and orchestration",
        summary: "The serving path, from request to response, under load.",
        step: 2,
        access: "account",
        artifact: "Serving stack",
        lessons: [
          { name: "APIs, batching and caching", kind: "lab" },
          { name: "Queues and backpressure", kind: "lesson" },
          { name: "Kubernetes fundamentals for this workload", kind: "lesson" },
          { name: "Autoscaling and multi-tenancy", kind: "lab" },
          { name: "Secrets and configuration", kind: "lesson" },
        ],
      },
      {
        n: "05",
        name: "LLM and multimodal deployment",
        summary: "The choices specific to serving a language or multimodal model.",
        step: 2,
        access: "account",
        artifact: "Model serving path",
        lessons: [
          { name: "Quantization and model selection", kind: "lesson" },
          { name: "Retrieval and streaming", kind: "lab" },
          { name: "Guardrails and fallbacks", kind: "lab" },
        ],
      },
      {
        n: "06",
        name: "Release engineering",
        summary: "The service goes to production behind a gate. Deploying it completes the course.",
        step: 3,
        access: "account",
        artifact: "Release pipeline",
        lessons: [
          { name: "Continuous integration and delivery", kind: "lab" },
          { name: "Evaluation gates", kind: "lab" },
          { name: "Release strategies and rollback", kind: "lesson" },
          { name: "Experiment tracking and change management", kind: "lesson" },
          { name: "Deploy to production infrastructure", kind: "lab" },
        ],
      },
      {
        n: "07",
        name: "Observability and operations",
        summary: "What you watch, what wakes you, and what the numbers say against module 1.",
        step: 4,
        access: "account",
        artifact: "Dashboard and runbook",
        lessons: [
          { name: "Logs, metrics and traces", kind: "lab" },
          { name: "Quality evaluation and drift", kind: "lesson" },
          { name: "GPU utilisation and cost", kind: "lab" },
          { name: "Service objectives, alerts and incident response", kind: "template" },
          { name: "Measure against your baseline", kind: "lab" },
        ],
      },
      {
        n: "08",
        name: "Security, governance and capstone",
        summary: "The threat model, the evidence, and the record that closes the course.",
        step: 5,
        access: "account",
        artifact: "Completion record",
        lessons: [
          { name: "Access control and data protection", kind: "lesson" },
          { name: "Prompt injection and supply chain", kind: "lab" },
          { name: "Compliance evidence and vendor inventory", kind: "template" },
          { name: "Demonstrate the rollback", kind: "lab" },
          { name: "Assemble the completion record", kind: "lab" },
          { name: "Publish it and book the review", kind: "lesson" },
        ],
      },
    ],
  },
  {
    id: "starter",
    badge: "Course E",
    title: "AI starter for small business",
    coverAudience: "Owners and operators",
    coverBuild: "One assistant for your busiest task",
    ground: "var(--path-e)",
    cover: {
      src: "/images/paths/starter.jpg",
      alt: "A small business owner working from a laptop behind their own counter",
    },
    level: "Beginner",
    duration: "2 weeks",
    facts: [
      { label: "Artifact", value: "Task assistant" },
      { label: "Takes", value: "2 weeks" },
      { label: "Level", value: "Beginner" },
    ],
    summary: "A short course to one measurable first win, built for owners and operators.",
    audience: "Owners and operators running the business themselves",
    build: "A simple assistant for the one task that eats your week.",
    skills: ["Practical prompting", "Simple automation", "Tool selection"],
    tagline:
      "Pick the task that eats your week, build one assistant for it, put it to work, and see the hours it gives back.",
    stats: [
      { value: "Free", label: "Every module" },
      { value: "8 modules", label: "One task each" },
      { value: "2 weeks", label: "At your own pace" },
      { value: "Beginner", label: "Recommended" },
    ],
    whatLearn: [
      "Find the task in your week worth automating first, and time it honestly.",
      "Write prompts you can reuse, and check the output before it goes out.",
      "Draft customer and marketing work that still sounds like your business.",
      "Handle lead response, quotes, and the questions you answer every day.",
      "Deploy one automation with a human approval step and a log.",
      "Decide from the numbers whether to keep it, change it, or stop.",
    ],
    requirements: [
      "One task in your own week that takes too long.",
      "The tools you already run the business on.",
      "About two hours a week for two weeks.",
      "A willingness to time yourself before and after.",
    ],
    description: [
      "This course is for owners and operators running the business themselves. It is the shortest course here, and it is built to produce one measurable win rather than a broad survey.",
      "The scenarios are drawn from real small businesses: a local service company, an independent consultant, a retail and e-commerce operation, and a nonprofit. They are there so the material feels like your week rather than a corporate training deck.",
      "The method is the same one the longer courses run on, at a smaller scale. You time one task, build one assistant for it, put it to work, then time it again.",
      "Finishing this is a reasonable place to stop. It is also the shortest route into the longer courses, and the workflow you deploy here is a working baseline for the one you build there.",
    ],
    curriculum: [
      {
        n: "01",
        name: "Business AI readiness",
        summary: "Find the task worth starting with, and write down what it costs you now.",
        step: 1,
        access: "open",
        artifact: "Workflow inventory and baseline",
        lessons: [
          { name: "List where your week actually goes", kind: "lab" },
          { name: "Time and cost your busiest task", kind: "lab" },
          { name: "Shortlist the high-value use cases", kind: "lesson" },
        ],
      },
      {
        n: "02",
        name: "Everyday AI and prompting",
        summary: "Prompts you can reuse, and the habit of checking the output.",
        step: 2,
        access: "account",
        artifact: "Prompt library",
        lessons: [
          { name: "Verify before you send", kind: "lesson" },
          { name: "Your brand voice, written down", kind: "lab" },
          { name: "Reusable prompt patterns", kind: "template" },
          { name: "Working with your own files and data", kind: "lesson" },
        ],
      },
      {
        n: "03",
        name: "Customer and marketing work",
        summary: "Research, offers and content that still sound like your business.",
        step: 2,
        access: "account",
        artifact: "Campaign kit",
        lessons: [
          { name: "Customer research and the offer", kind: "lab" },
          { name: "Content, email and social", kind: "lab" },
          { name: "Local discovery and reuse", kind: "lesson" },
        ],
      },
      {
        n: "04",
        name: "Sales and service work",
        summary: "Lead response, quotes, and the questions you answer every day.",
        step: 2,
        access: "account",
        artifact: "Response kit",
        lessons: [
          { name: "Lead response and qualification", kind: "lab" },
          { name: "Proposals and quotes", kind: "lab" },
          { name: "Common questions and support drafts", kind: "template" },
        ],
      },
      {
        n: "05",
        name: "Operations and administration",
        summary: "Meeting notes, procedures and the reporting you keep putting off.",
        step: 2,
        access: "account",
        artifact: "Operations pack",
        lessons: [
          { name: "Meeting notes and procedures", kind: "lab" },
          { name: "Document drafting and vendor comparison", kind: "lesson" },
          { name: "Reporting and finding what you wrote before", kind: "lab" },
        ],
      },
      {
        n: "06",
        name: "One deployed automation",
        summary: "The assistant goes to work. Putting it to work completes the course.",
        step: 3,
        access: "account",
        artifact: "Deployed assistant",
        lessons: [
          { name: "Triggers and actions, without code", kind: "lesson" },
          { name: "The human approval step", kind: "lab" },
          { name: "Exceptions and logging", kind: "lesson" },
          { name: "Put it to work", kind: "lab" },
        ],
      },
      {
        n: "07",
        name: "The numbers",
        summary: "Time it again, price it, and decide whether it earns its place.",
        step: 4,
        access: "account",
        artifact: "Outcome sheet",
        lessons: [
          { name: "Time saved and output quality", kind: "lab" },
          { name: "Operating cost, tool cost and privacy risk", kind: "lesson" },
          { name: "The keep, change or stop decision", kind: "template" },
        ],
      },
      {
        n: "08",
        name: "The thirty-day plan and capstone",
        summary: "A second workflow, a simple policy, and the record that closes the course.",
        step: 5,
        access: "account",
        artifact: "Completion record",
        lessons: [
          { name: "Deploy the second workflow", kind: "lab" },
          { name: "A one-page AI use policy for your business", kind: "template" },
          { name: "Maintenance calendar and next quarter", kind: "lesson" },
          { name: "Assemble the completion record", kind: "lab" },
        ],
      },
    ],
  },
];

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
    "A completion record you can share",
  ],
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
        title: "A completion record",
        text: "The brief, the build, the launch and the result, in one document you can share.",
      },
    ],
  },
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
  org?: { name: string; url?: string };
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
};

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
      /*
        Named and linked rather than counted. "Investor in three companies" is
        the kind of line that asks to be believed; three names a reader can open
        is the kind that can be checked, which is the standard the rest of this
        page holds itself to.
      */
      investments: [
        { label: "Destaquei", href: "https://destaquei.com.br/" },
        { label: "Produtoras de Video", href: "https://www.produtorasdevideo.com.br/" },
        { label: "Bayhaus Creative", href: "https://bayhauscreative.com/" },
      ],
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
      org: { name: "Co-founder, n-aible" },
      ground: "var(--path-a)",
      photo: { src: "/images/people/aaron-jimenez.jpg", alt: "Portrait of Aaron Jimenez" },
      logo: { src: "/images/logos/n-aible.png", alt: "n-aible" },
      linkedin: "https://www.linkedin.com/in/aaron-jimenez-086ba4181/",
    },
    {
      id: "hendrik",
      name: "Hendrik Krack",
      role: "Developer Advocate at CodeRabbit",
      org: { name: "Co-founder, n-aible" },
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
      org: { name: "Co-founder, Bayhaus Creative", url: "https://bayhauscreative.com/" },
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
        FLAG, because it is the one asset here that asserts something nobody has
        confirmed. The mark supplied for this seat is the University of
        California, Berkeley wordmark, and the title names The Berkeley Film
        School. If those are the same institution this is correct; if they are
        not, the card is putting a university's registered mark against a
        school that does not hold it. Worth a check before this goes near a
        press page.
      */
      logo: { src: "/images/logos/berkeley.png", alt: "Berkeley" },
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

export type Seat = {
  id: string;
  /**
   * The practitioner holding the seat. Absent until the person and their
   * employer have both cleared it, at which point `seat` drops to the subtitle
   * and this becomes the card's headline. Nothing here is invented.
   */
  name?: string;
  seat: string;
  /** The path or the discipline this seat reads. */
  reviews: string;
  checks: string;
  /** Path hue from globals.css. The assessment seat serves no single path. */
  ground: string;
  photo?: Img;
  logo?: Img;
  /** Full LinkedIn profile URL. Renders the profile link when present. */
  linkedin?: string;
};

/*
  Seats, stated by what each one checks.

  The headline used to count them: "Six practitioners review the curriculum each
  term". The board is still taking seats, so a numeral in the headline is a
  number that needs editing every time one is added, and a reader who counts the
  cards and gets seven reads it as an error rather than as growth. The sentence
  works without it and the grid states the count on its own.

  Portrait and mark slots match the instructor roster. Same rule: a slot that is
  empty says so.

  The cards now run in a marquee and carry four things: the name, the title, the
  organization mark and the LinkedIn link. `checks` is no longer on the card. It
  stays here because it is the definition of the seat, which is what a new seat
  gets written against and what the intro line summarises for the reader.
*/
export const board = {
  /*
    REWRITTEN 7 Aug at Roan's instruction, and the change is what these people
    are rather than how it is worded.

    They were "seats", each one paired to a single course, and the roster page
    grouped them on that pairing: "One seat per course" over five cards and
    "Across every course" over the sixth. Roan's correction is that they are not
    a committee organised by course. They are judges, and the curriculum is one
    of two things they judge, so the page is one flat list and the copy names
    both jobs.

    JUDGING EVENTS IS THE NEW CLAIM HERE and it is the only sentence on this
    page that no other page supports. It came from Roan directly rather than
    from the program brief, and the brief has no event in it yet, so if the
    brief is ever used as source of truth again this line is the one to check
    first. It stays deliberately unspecific about which events and how often,
    because those are facts nobody has stated.

    The intro still carries the one thing a card cannot: that the person holding
    the seat is still doing the work. What went is "each one reads the single
    course closest to their own work", which was the sentence the grouping was
    built on and is exactly what Roan says is not the shape of it.
  */
  headline: "Practitioners judge the curriculum and the events",
  intro:
    "Every judge on this board runs these systems in production. They read the courses each term, the lessons, the labs and the outcome sheet a learner leaves with, and they sit on the panel that judges the events where learners present the workflows they deployed.",
  members: [
    {
      id: "revops",
      seat: "Revenue operations",
      reviews: "Course A",
      checks: "Confirms the pipeline labs match how revenue teams work day to day.",
      ground: "var(--path-a)",
      photo: {
        src: "/images/people/board-seat-placeholder.jpg",
        alt: "Placeholder studio portrait standing in for this seat holder",
      },
      logo: {
        src: "/images/logos/gmi-white.png",
        alt: "GMI",
      },
    },
    {
      id: "post",
      seat: "Post-production",
      reviews: "Course B",
      checks: "Validates ingest and rough-cut workflows against studio delivery schedules.",
      ground: "var(--path-b)",
      photo: {
        src: "/images/people/board-seat-placeholder.jpg",
        alt: "Placeholder studio portrait standing in for this seat holder",
      },
      logo: {
        src: "/images/logos/gmi-white.png",
        alt: "GMI",
      },
    },
    {
      /*
        This seat was "Field operations", checking "the vision and triage labs
        against real claims and inspection volume", and it had been wrong since
        Path C stopped being the industry vision track and became AI literacy,
        ethics and data compliance. The card looks its path title up from the
        catalog, so the board was printing "Field operations" over "AI literacy,
        ethics and data compliance" and describing labs that no longer exist.

        Renamed to the discipline the path now needs a reviewer from, which is
        also the discipline the instructor roster already names for Path C. The
        note at the head of the paths array still stands: the program brief
        describes Track C the other way, and either the brief moves or this is a
        deliberate departure from it.
      */
      id: "governance",
      seat: "Data governance",
      reviews: "Course C",
      checks: "Reads the policy and review labs against how a regulated team governs its tools.",
      ground: "var(--path-c)",
      photo: {
        src: "/images/people/board-seat-placeholder.jpg",
        alt: "Placeholder studio portrait standing in for this seat holder",
      },
      logo: {
        src: "/images/logos/gmi-white.png",
        alt: "GMI",
      },
    },
    {
      id: "platform",
      seat: "Platform engineering",
      reviews: "Course D",
      checks: "Reviews serving, scaling and cost control against production practice.",
      ground: "var(--path-d)",
      photo: {
        src: "/images/people/board-seat-placeholder.jpg",
        alt: "Placeholder studio portrait standing in for this seat holder",
      },
      logo: {
        src: "/images/logos/gmi-white.png",
        alt: "GMI",
      },
    },
    {
      id: "smb",
      seat: "Small business operations",
      reviews: "Course E",
      checks: "Confirms the starter course stays completable by a solo owner in one sitting.",
      ground: "var(--path-e)",
      photo: {
        src: "/images/people/board-seat-placeholder.jpg",
        alt: "Placeholder studio portrait standing in for this seat holder",
      },
      logo: {
        src: "/images/logos/gmi-white.png",
        alt: "GMI",
      },
    },
    {
      id: "learning",
      seat: "Learning design",
      /* The one seat with no path. `reviews` is a path badge on the other five
         and the card looks the title up from the catalog; this value has no
         match, so it falls through and prints as written. */
      reviews: "Assessment across all five courses",
      checks: "Reviews outcome measurement, assessment design and the completion record.",
      ground: "var(--ink-secondary)",
      photo: {
        src: "/images/people/board-seat-placeholder.jpg",
        alt: "Placeholder studio portrait standing in for this seat holder",
      },
      logo: {
        src: "/images/logos/gmi-white.png",
        alt: "GMI",
      },
    },
  ] as readonly Seat[],
  /*
    THE FOOTNOTE IS GONE, removed 7 Aug at Roan's request, and it is worth being
    clear about what that costs because it is not nothing.

    It read: "Every seat here is filled and reviewing. One stand-in portrait and
    one placeholder mark stand on all six cards, and each becomes a name, a
    photograph, an employer and a profile link on the day that employer clears
    it." Two facts in one sentence. The first is a claim the cards cannot show,
    that the seats are real and working. The second was the disclosure that the
    portrait and the mark on all six cards are placeholders.

    The second one is now carried by the arrangement instead, and only by the
    arrangement: six identical faces and six identical wordmarks are
    self-evidently a placeholder rather than six practitioners, which is the
    argument the imagery policy at the head of this file makes for allowing them
    at all. That argument has a hard edge, and this removal moves the page right
    up against it. The moment two different faces or two different marks appear
    on these cards, the disclosure has to come back in words, because at that
    point the set stops announcing itself as a stand-in and starts asserting a
    roster.
  */
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
    a: "One workflow you own, permission to change it, and the tools your team already uses. Course D also assumes access to a GPU cloud account, and Course E runs on everyday business tools.",
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
      href: "/courses/gtm#curriculum",
    },
    {
      id: "courses",
      title: "Compare all five courses",
      detail: "Pick by the work you own",
      href: "/#courses",
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
  audience and linking to a path. Every one of those audiences is already the
  `coverAudience` line on that path's card in the catalog, two sections down,
  where it sits next to the artifact the path builds and the level it runs at.
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
  header for each path carrying that path's badge and its `coverAudience`. Every
  one of those strings is printed on that path's own cover in the catalog one
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
        { label: "GTM teams", href: "/courses/gtm" },
        { label: "Video and media", href: "/courses/media" },
        { label: "AI literacy and compliance", href: "/courses/literacy" },
        { label: "AI infrastructure", href: "/courses/infra" },
        { label: "Small business starter", href: "/courses/starter" },
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
        { label: "Instructors", href: "/#instructors" },
        { label: "Learning as a team", href: "/#teams" },
        /* The page, not the homepage band. The band is a six-card teaser with a
           link to this; the footer is a sitemap, and a sitemap points at routes. */
        { label: "Practitioner Review Judge Board", href: "/review-judge-board" },
      ],
    },
  ],
  legal: [
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
    { label: "Accessibility", href: "/accessibility" },
    { label: "Data and records", href: "/data" },
  ],
} as const;

/*
  The two auth screens.

  Every line here is a fact this site already states somewhere else, which is the
  only reason there is copy on these screens at all. `moduleFormat.outlineNote`
  is the source for the unlock sentence, the hero is the source for the open
  first module, and `outcomes` is the source for what finishing means. Nothing
  on an auth screen may be the first place a claim appears: these are the two
  pages a reader reaches with the most intent and the least patience, and an
  invented benefit here is the one a support ticket gets written about.

  There is no auth backend. Both screens are the interface for one that does not
  exist yet, so the submit control posts nowhere and says so in the page rather
  than pretending. See src/components/auth/auth-screen.tsx.
*/
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
  shellNote: "Accounts open with the first cohort. This form is not live yet.",
} as const;
