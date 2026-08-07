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
 *   - the canonical sentence is "A path completes when your workflow runs live
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
export const cta = {
  primary: "Start free module",
  path: "View path",
  compare: "Compare all five paths",
  course: "See how the course works",
  watch: "Watch now",
} as const;

/*
  In document order, which is the only order this list can be in. The header
  underlines whichever section is on screen, so a nav whose items run in a
  different sequence from the page makes that underline jump backwards as a
  reader scrolls forwards. Methodology moved to fourth when the method section
  moved down the page to sit above the FAQ.
*/
export const nav = [
  { label: "Paths", href: "#paths" },
  { label: "Course", href: "#course" },
  { label: "Outcomes", href: "#outcomes" },
  { label: "Methodology", href: "#method" },
  { label: "FAQ", href: "#faq" },
] as const;

export const hero = {
  /*
    One word. "Free first module" restated the third fact row and the lesson
    card's own status chip, so the chip that opens the page was spending four
    words to say what the two elements under it already say. The cost claim is
    the only thing this slot is for.
  */
  eyebrow: "Free",
  headline: "Deploy one AI workflow and measure what it changed",
  subtext:
    "Five role-based paths for operators and technical teams. You build on your own data, then launch it where the work happens.",
  /*
    The shape of the program, stated in the fold.

    Added 6 Aug. Everything the page needed to say about its own structure was
    true and none of it was in one place: the catalog says five paths, the
    course outline says five modules, the method section says five steps, and
    all three are 2,000px apart and use the same numeral for different things.
    A first-time reader had to assemble the shape from three sections before
    they could tell whether "five" meant five courses or five lessons.

    Two sentences at the top say it once, and they are deliberately structural
    rather than persuasive. Nothing here is a new claim; it is the three facts
    the page already carries, put next to each other.
  */
  structure:
    "Choose one of five role-based paths. Every path contains five modules and follows the same deployment method.",
  /*
    The access model, at the point of decision.

    It was stated four times on the page and never beside the button. A status
    chip in the fold said "Free", the third stat said the hours were free, the
    course outline marked four rows "Free account", and the FAQ answered it
    twice. What none of them said, in the place a visitor decides whether to
    click, is what the account is *for*. Saving your work is the answer, and it
    is the difference between a signup that gates and a signup that keeps.
  */
  access:
    "The first module opens without an account. A free account saves your work and unlocks modules 2–5.",
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
    { id: "cost", value: "Free", label: "Every path, every module" },
    { id: "modules", value: "5 modules", label: "Build, launch, then measure it" },
    /*
      "Of lessons and guided labs" became "Of instruction, plus your
      implementation work" on 6 Aug.

      The old label sized the whole program by its video runtime, which is the
      number this course is least about. Five hours of lessons is a small
      course; five hours of lessons plus a workflow you deploy at your own job
      is a different object, and the second half is the part a reader is
      actually buying. It also stops the figure from reading as a promise about
      how long the path takes, which it never was.
    */
    { id: "open", value: "5+ hours", label: "Of instruction, plus your implementation work" },
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
export const method = {
  eyebrow: "The method",
  headline: "Build, deploy, and document one workflow in five steps",
  intro:
    "Every path follows the same method. You establish a baseline, build the workflow, launch it in context, measure the result, and document what changed.",
  produces: "You produce",
  steps: [
    {
      n: 1,
      name: "Profile",
      output: "Baseline and brief",
      text: "Choose one workflow you own and record its baseline on time, cost or quality.",
    },
    {
      n: 2,
      name: "Build",
      output: "Working workflow",
      text: "Guided labs assemble the workflow on your own inputs with current models.",
    },
    {
      n: 3,
      name: "Deploy",
      output: "Live system",
      text: "The workflow goes live in the tools your team uses every day. Launching it completes the path.",
    },
    {
      n: 4,
      name: "Measure",
      output: "Outcome sheet",
      text: "Measure the same workflow after launch. Both numbers land on one page.",
    },
    {
      n: 5,
      name: "Document",
      output: "Completion record",
      text: "Brief, build, launch and measurement become one completion record you can share.",
    },
  ],
} as const;

export type Path = {
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
  modules: string;
  duration: string;
  /** The three facts on the card meta row, each one different per path. */
  facts: readonly { label: string; value: string }[];
  summary: string;
  audience: string;
  build: string;
  skills: readonly string[];
  curriculum: readonly { n: string; name: string; open?: boolean }[];
};

/*
  Curriculum ordering was corrected on 6 Aug. Module 01 of every path used to be
  a topic overview while the profiling session sat at 02, which contradicted the
  page in two places: the outcome bullets say the brief is written in module 1,
  and the FAQ says the baseline is recorded in module 1. Since 01 is also the
  free module, the swap doubles as the better funnel: the open lesson is now the
  one where a reader produces something.
*/
export const paths: readonly Path[] = [
  {
    id: "gtm",
    badge: "Path A",
    title: "Applied AI for GTM teams",
    coverAudience: "Marketing ops, RevOps, growth",
    coverBuild: "An agent workflow on your live pipeline",
    ground: "var(--path-a)",
    cover: {
      src: "/images/paths/gtm.jpg",
      alt: "A marketing operations lead working from a laptop in a bright open-plan office",
    },
    level: "Intermediate",
    modules: "5 modules",
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
    curriculum: [
      { n: "01", name: "Profile your pipeline and set a baseline", open: true },
      { n: "02", name: "The multimodal agent loop" },
      { n: "03", name: "Build the agent workflow on your pipeline" },
      { n: "04", name: "Deploy into the revenue stack" },
      { n: "05", name: "Measure the change and publish the record" },
    ],
  },
  {
    id: "media",
    badge: "Path B",
    title: "Applied AI for video and media",
    coverAudience: "Editors, producers, post supervisors",
    coverBuild: "An ingest and rough-cut pipeline",
    ground: "var(--path-b)",
    cover: {
      src: "/images/paths/media.jpg",
      alt: "A video editor at the desk in a dimly lit edit suite",
    },
    level: "Intermediate",
    modules: "5 modules",
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
    curriculum: [
      { n: "01", name: "Profile your post workflow and set a baseline", open: true },
      { n: "02", name: "The AI production pipeline" },
      { n: "03", name: "Build ingest, logging and rough-cut tools" },
      { n: "04", name: "Deploy into the studio pipeline" },
      { n: "05", name: "Measure the change and publish the record" },
    ],
  },
  /*
    Path C was "Applied AI for industry teams", a vision and triage workflow for
    claims, vegetation management and security operations. It is now AI
    literacy, ethics and data compliance, on Roan's instruction.

    Worth knowing when this is revisited: the program brief still describes
    Track C the other way, and describes it as "the richest source of
    arm's-length organization letters", which is an evidence claim rather than a
    curriculum preference. The brief is the source of truth for every other
    claim on this page, so either it moves too or this path is a deliberate
    departure from it.

    The mechanic survives the change intact, which is what made it a workable
    swap: a policy is a thing you write, put into use and then measure, so
    module 01 still records a baseline and module 05 still measures against it.
    The baseline here is how the team handles data today, not a duration.
  */
  {
    id: "literacy",
    badge: "Path C",
    title: "AI literacy, ethics and data compliance",
    coverAudience: "Team leads, operations, HR and legal",
    coverBuild: "An AI use policy your team runs on",
    ground: "var(--path-c)",
    cover: {
      src: "/images/paths/literacy.jpg",
      alt: "Two colleagues reviewing printed pages beside a laptop in a meeting room",
    },
    level: "Foundational",
    modules: "5 modules",
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
    curriculum: [
      { n: "01", name: "Profile how your team uses AI today", open: true },
      { n: "02", name: "AI literacy, ethics and data compliance" },
      { n: "03", name: "Write the policy and the review step" },
      { n: "04", name: "Put it in force across the team" },
      { n: "05", name: "Measure the change and publish the record" },
    ],
  },
  {
    id: "infra",
    badge: "Path D",
    title: "Applied AI infrastructure",
    coverAudience: "Developers who own the serving layer",
    coverBuild: "Model serving on GPU cloud",
    ground: "var(--path-d)",
    cover: {
      src: "/images/paths/infra.jpg",
      alt: "A platform engineer reading a terminal at a standing desk",
    },
    level: "Advanced",
    modules: "5 modules",
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
    curriculum: [
      { n: "01", name: "Profile the workloads and set a baseline", open: true },
      { n: "02", name: "The AI serving stack" },
      { n: "03", name: "Build serving and scaling on GPU cloud" },
      { n: "04", name: "Deploy to production infrastructure" },
      { n: "05", name: "Measure the change and publish the record" },
    ],
  },
  {
    id: "starter",
    badge: "Path E",
    title: "AI starter for small business",
    coverAudience: "Owners and operators",
    coverBuild: "One assistant for your busiest task",
    ground: "var(--path-e)",
    cover: {
      src: "/images/paths/starter.jpg",
      alt: "A small business owner working from a laptop behind their own counter",
    },
    level: "Beginner",
    modules: "5 modules",
    duration: "2 weeks",
    facts: [
      { label: "Artifact", value: "Task assistant" },
      { label: "Takes", value: "2 weeks" },
      { label: "Level", value: "Beginner" },
    ],
    summary: "A short path to one measurable first win, built for owners and operators.",
    audience: "Owners and operators running the business themselves",
    build: "A simple assistant for the one task that eats your week.",
    skills: ["Practical prompting", "Simple automation", "Tool selection"],
    curriculum: [
      { n: "01", name: "Profile your busiest task and set a baseline", open: true },
      { n: "02", name: "Your first AI win" },
      { n: "03", name: "Build a simple assistant" },
      { n: "04", name: "Put it to work" },
      { n: "05", name: "Measure the change" },
    ],
  },
];

export const course = {
  label: "The course",
  headline: "One lesson and one lab, every module",
  intro:
    "Each module pairs one recorded lesson with a guided lab you run on your own workflow. Your workflow, from first sketch to live.",
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
    /* Designed title card over the frame, so the resting state states its subject. */
    card: {
      title: "One workflow, from first sketch to live",
      beats: ["Lesson", "Guided lab", "Launch", "Measure"],
    },
  },
  outlineLabel: "Module outline",
  /* The access model, stated once as an unlock rather than as four gates. */
  outlineNote:
    "One free account unlocks modules 2 to 5 in every path, and the account stays free.",
  includesLabel: "Every module includes",
  includes: [
    "Recorded lessons from people who run these systems",
    "Guided labs on your own workflow",
    "Templates for the brief and the outcome sheet",
    "A recorded baseline and a measured result",
    "A completion record you can share",
  ],
  outline: [
    { n: "01", name: "Profile the workflow", detail: "Baseline and brief", access: "Open" },
    { n: "02", name: "Build the first working system", detail: "Guided lab", access: "Free account" },
    { n: "03", name: "Deploy it in context", detail: "Launch checklist", access: "Free account" },
    { n: "04", name: "Measure the outcome", detail: "Outcome sheet", access: "Free account" },
    { n: "05", name: "Document and improve it", detail: "Completion record", access: "Free account" },
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
    label: "Example Path A outcome",
    before: "6 h 00",
    after: "40 min",
    caption:
      "Time to produce weekly pipeline reporting, before and after one learner deployed their workflow.",
  },
  sheet: {
    label: "Outcome sheet",
    title: "Weekly pipeline reporting",
    meta: ["Path A", "Module 5", "Measured 14 days after launch"],
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
    footnote: "One completed Path A implementation, measured by the learner.",
  },
  lead: {
    artifact: "Live system",
    title: "Your deployed workflow",
    text: "A functioning workflow running in the tools your team already uses, owned by you or your team. A path completes when your workflow runs live and you have measured it.",
    bullets: [
      "Running on your organization's real inputs",
      "Owned and operated by your team after the course",
      "Reviewed against the brief you wrote in module 1",
      "Handed over with the templates used to build it",
    ],
  },
  supporting: [
    {
      title: "Your outcome sheet",
      text: "A concise before-and-after record covering time, cost, quality, or another relevant operational measure.",
      artifact: "Before and after",
    },
    {
      title: "Your completion record",
      text: "A shareable record describing the implementation, the work completed, and the measured result.",
      artifact: "Completion record",
    },
  ],
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

  Nobody has supplied job titles. Four of these are named human beings with
  public profiles, and a role line under a real person's photograph is a claim
  about that person's employment. Inventing one is not a placeholder, it is a
  misrepresentation, and it is the exact failure the imagery policy at the head
  of this file was written to prevent, only in words instead of pixels.

  So `role`, `scope` and `detail` are absent on all four, and the card renders
  nothing where they would go: portrait, name, profile link. Every one of those
  is a fact somebody handed over.

  They fill in from the people's own LinkedIn headlines, verbatim, which is what
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
      scope: "All five paths",
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
    "Everybody takes the path closest to their own job, so one team can cover several at once. Each person keeps their own labs, baseline and outcome sheet, and the group picks a single launch date. On that date every one of them has a working system and a measured before-and-after to show.",
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
  panel: {
    label: "Shared launch",
    title: "One date, three deployments",
    date: "Thursday, week 6",
    columns: { who: "Participant", ships: "Ships" },
    seats: [
      { who: "RevOps analyst", path: "Path A", ships: "Pipeline agent" },
      { who: "Post supervisor", path: "Path B", ships: "Rough cut" },
      { who: "Platform engineer", path: "Path D", ships: "Serving stack" },
    ],
    footnote: "Each person keeps their own baseline, so the group compares real outcomes.",
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
    The intro used to open "They review the curriculum, the labs and the outcome
    sheets", which is the headline's own verb repeated as the third word of the
    next sentence, and then spent its second clause on "so the method stays
    accurate to how these systems get built and operated", a sentence that could
    sit under any curriculum on the internet.

    It now says the two things a reader cannot get from the cards: that a seat
    is held by someone still doing the work, and that each seat is paired to one
    path. The list of what gets checked moved here from the cards, which is
    where it belongs once the card is down to four fields.
  */
  headline: "Practitioners review the curriculum each term",
  intro:
    "Every seat is held by someone running these systems in production, and each one reads the single path closest to their own work: the lessons, the labs and the outcome sheet a learner leaves with.",
  members: [
    {
      id: "revops",
      seat: "Revenue operations",
      reviews: "Path A",
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
      reviews: "Path B",
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
      reviews: "Path C",
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
      reviews: "Path D",
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
      reviews: "Path E",
      checks: "Confirms the starter path stays completable by a solo owner in one sitting.",
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
      reviews: "Assessment across all five paths",
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
    "The empty frames are seats already reviewing" described a state the cards
    are no longer in: the frames hold illustrations now, and a sentence pointing
    at emptiness that a reader cannot see reads as a leftover. The fact it was
    protecting is the one that matters and it stays, said plainly: these seats
    are filled and working, and what is pending is permission to say by whom.
  */
  footnote:
    "Every seat here is filled and reviewing. One stand-in portrait and one placeholder mark stand on all six cards, and each becomes a name, a photograph, an employer and a profile link on the day that employer clears it.",
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
    a: "It is free. The first module of every path opens instantly, and one free account unlocks the rest of that path. Everything on this site is free to use.",
  },
  {
    q: "Why is it free?",
    a: "It is a non-commercial education project that Roan funds and runs. Every path stays free to use, and this site exists to teach rather than to sell.",
  },
  {
    q: "What does completion by deployment mean?",
    a: "A path completes when your workflow runs live and you have measured it. You record a baseline in module 1, launch the workflow into a working environment, then measure the same thing again. That pairing is what makes the completion record worth sharing.",
  },
  {
    q: "Can I start right away?",
    a: "Yes. The first module of every path plays for everyone, with a free account needed only from module 2.",
  },
  {
    q: "What does the free account ask for?",
    a: "Name, role, organization, and a few questions about the workflow you want to improve. It takes about a minute, and it is what lets the guided labs use your own workflow as the project.",
  },
  {
    q: "What do I need access to?",
    a: "One workflow you own, permission to change it, and the tools your team already uses. Path D also assumes access to a GPU cloud account, and Path E runs on everyday business tools.",
  },
  {
    q: "What is the outcome sheet?",
    a: "A one-page record inside the course. Before you launch, you note a baseline on time, cost, or quality. After you launch, you measure again. The sheet holds both numbers and the difference between them.",
  },
  {
    q: "Which path should I start with?",
    a: "Pick by the work you are responsible for. GTM teams for marketing ops, RevOps and growth. Video and media for production workflows. AI literacy, ethics and data compliance for whoever owns how a team uses AI. Infrastructure for developers who own serving. The small business starter is a short first win before a longer path.",
  },
  {
    q: "Who records the lessons?",
    a: "Roan Weigert records the core lessons that establish the method. Specialist sessions come from invited practitioners who run these workflows in production, and the Practitioner Review Board reviews the curriculum each term.",
  },
  {
    q: "Can my whole team take a path?",
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
*/
export const closing = {
  headline: "Start free, in 14 minutes",
  body: "Pick the path closest to your job and watch the first lesson. By the end you will have picked one process you own and written down what it costs you today. That page is the baseline everything else is measured against.",
  reassurance: "Lesson one plays for everyone. A free account opens the rest.",
  routesLabel: "Or start somewhere else",
  routes: [
    {
      id: "module",
      title: "Watch the open module",
      detail: "Open to everyone, right away",
      href: "/paths/gtm/module-1",
    },
    {
      id: "paths",
      title: "Compare all five paths",
      detail: "Pick by the work you own",
      href: "#paths",
    },
    {
      id: "teams",
      title: "Run a path with your team",
      detail: "One shared launch date",
      href: "#teams",
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
    "A project-based learning program from AI Tech Education Academy. Learners build, deploy and measure one AI workflow of their own through guided role-based paths.",
  columns: [
    {
      title: "Learning paths",
      links: [
        { label: "GTM teams", href: "#paths" },
        { label: "Video and media", href: "#paths" },
        { label: "AI literacy and compliance", href: "#paths" },
        { label: "AI infrastructure", href: "#paths" },
        { label: "Small business starter", href: "#paths" },
      ],
    },
    {
      title: "The course",
      links: [
        { label: "The method", href: "#method" },
        { label: "How the course works", href: "#course" },
        { label: "Outcomes and evidence", href: "#outcomes" },
        { label: "Common questions", href: "#faq" },
      ],
    },
    {
      title: "The program",
      links: [
        { label: "Instructors", href: "#instructors" },
        { label: "Learning as a team", href: "#teams" },
        { label: "Practitioner Review Board", href: "#board" },
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
