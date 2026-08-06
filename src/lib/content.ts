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
 * Imagery policy, set at the same review and tightened on 6 Aug 2026. Generated
 * placeholder art was doing more harm than an empty slot, so it is gone, and
 * every photograph on the page is now a frame of Roan. Three files were dropped
 * at the same time: two frames of the stock clip in public/media/tutorial-2.mp4
 * and one studio frame of a person the site has no name for. A photograph of
 * somebody the page will never introduce is the same fabrication as invented
 * copy, made of pixels. What remains:
 *   - Four frames of Roan, used for the hero lesson card, the course poster and
 *     the studio band.
 *   - Five path covers drawn in the DOM from the per-path grounds in
 *     globals.css. Each states the path letter, the audience and the artifact,
 *     so the largest element in every card carries information.
 *   - Portrait and organization-mark slots on both rosters. Roan's portrait is
 *     real; the rest render a marked-empty slot until the photograph and the
 *     employer's clearance exist. Drop a file into public/images/people or
 *     public/images/logos and add the one line here, and the slot fills.
 */

export type Img = { src: string; alt: string };

export const brand = {
  name: "AI Tech Education",
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

export const nav = [
  { label: "Paths", href: "#paths" },
  { label: "Methodology", href: "#method" },
  { label: "Course", href: "#course" },
  { label: "Outcomes", href: "#outcomes" },
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

    `id` selects the glyph in hero.tsx.
  */
  stats: [
    { id: "cost", value: "Free", label: "Every path, every module" },
    { id: "modules", value: "5 modules", label: "Build, launch, then measure it" },
    { id: "open", value: "14 min", label: "Module 1, open to everyone" },
  ],
  instructor: {
    name: "Roan Weigert",
    role: "Applied AI educator, San Francisco",
    image: { src: "/images/people/roan-weigert.jpg", alt: "Portrait of Roan Weigert" },
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
    three-image collage, and there are only four photographs on this site, three
    of which the studio band already carries. A third frame here would have put
    the entire photo library in one viewport and left the studio band repeating
    it verbatim 6,000px later. The third slot is a card instead, which is the
    better trade anyway: the lesson card is the thing the fold is for.
  */
  aside: {
    src: "/images/people/roan-weigert-speaking.jpg",
    alt: "Roan Weigert holding a microphone and speaking to a room",
  },
} as const;

/*
  The band under the fold carries credentials rather than a restatement of the
  hero. Ordered by what a sceptical operator can evaluate: a review process
  they can reason about comes first, and the provisional patent filing comes
  last, since a serial number persuades the fewest readers per pixel.
*/
export const credibility = {
  label: "On the record",
  /*
    Each item is eyebrow, then the record, then its qualifier. The first one
    used to break that pattern: "Curriculum review" over "Practitioner Review
    Board" put a category above a proper noun, so the row read as a name with no
    statement attached and a reader had to assemble the sentence themselves. It
    now states what happens, and the eyebrow names the body that does it. The
    seat count came out of the meta line at the same time, since the board is
    still taking seats.

    `id` selects the glyph in proof-band.tsx. Icons live with the component
    because they are components; this file stays data.
  */
  items: [
    {
      id: "board",
      fact: "Review board",
      detail: "Practitioners review every term",
      meta: "Curriculum, labs and outcome sheets",
    },
    { id: "book", fact: "Author", detail: "Applied AI in media production", meta: "Book" },
    {
      id: "keynote",
      fact: "Keynote",
      detail: "The Multimodal Agent Loop",
      meta: "AGI Summit SF 2026",
    },
    {
      id: "patent",
      fact: "Patent pending",
      detail: "Adaptive learning engine",
      meta: "USPTO 63/967,917",
    },
  ],
} as const;

export const method = {
  eyebrow: "The method",
  headline: "Completion by deployment, in five steps",
  intro:
    "Every path runs the same five steps on a workflow you choose. Step 1 records your baseline, and step 4 measures against it.",
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
  {
    id: "industry",
    badge: "Path C",
    title: "Applied AI for industry teams",
    coverAudience: "Claims, field ops, security ops",
    coverBuild: "A vision and triage workflow",
    ground: "var(--path-c)",
    level: "Intermediate",
    modules: "5 modules",
    duration: "6 weeks",
    facts: [
      { label: "Artifact", value: "Photo triage" },
      { label: "Runs on", value: "Your field data" },
      { label: "Level", value: "Intermediate" },
    ],
    summary: "Vision and triage workflows for claims and field operations.",
    audience: "Restoration and claims, vegetation management, security operations",
    build: "A vision and triage workflow on the field data you already collect.",
    skills: ["Computer vision", "Photo triage", "Risk mapping", "Ops automation"],
    curriculum: [
      { n: "01", name: "Profile the operation and set a baseline", open: true },
      { n: "02", name: "AI for field operations" },
      { n: "03", name: "Build vision and triage workflows" },
      { n: "04", name: "Deploy into daily operations" },
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
    before: "6 h 00",
    after: "40 min",
    caption:
      "Time to produce weekly pipeline reporting, before and after one Path A learner deployed their workflow.",
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
  role: string;
  detail: string;
  /** What this person records or reviews, printed as the card's foot. */
  scope: string;
  /** Path hue from globals.css, so the card ties to the path it serves. */
  ground: string;
  /** Portrait. Absent means the slot renders marked-empty rather than faked. */
  photo?: Img;
  /** Employer mark, once that employer has cleared the use of it. */
  logo?: Img;
  lead?: boolean;
};

/*
  A roster with portrait and organization-mark slots.

  The slots were text-only for one release because the build had been filling
  them with monogram tiles: two grey letters in a circle, identical framing to
  Roan's real photograph, which read as three broken images rather than three
  pending ones. The fix was never to remove the slot, it was to stop pretending
  the slot was full. So the frames are back and an empty one says so, in a
  dashed rule with an icon, and the footnote explains what it is waiting for.

  Filling one is two lines: drop the file in public/images/people or
  public/images/logos, then add `photo` or `logo` to the entry below.
*/
export const instructors = {
  headline: "Learn from people who run these systems in production",
  intro:
    "Roan writes the curriculum and records the core lessons. Three invited specialists record the deep dives for GTM, media and infrastructure.",
  footnote:
    "Specialists are described by role, and their portraits and organization marks appear as each employer clears the use of them.",
  people: [
    {
      id: "roan",
      name: "Roan Weigert",
      role: "Lead instructor, San Francisco",
      detail:
        "Builds multimodal agent workflows for go-to-market and production teams. Writes the curriculum and records every core lesson.",
      scope: "All five paths",
      ground: "var(--accent)",
      photo: { src: "/images/people/roan-weigert.jpg", alt: "Portrait of Roan Weigert" },
      lead: true,
    },
    {
      id: "gtm",
      name: "Revenue operations lead",
      role: "Series-C B2B software company",
      detail:
        "Runs agent workflows against a live pipeline of roughly 40,000 accounts, and owns the reporting the sales team works from.",
      scope: "Records Path A",
      ground: "var(--path-a)",
    },
    {
      id: "media",
      name: "Post-production supervisor",
      role: "Commercial and documentary studio",
      detail:
        "Operates multimodal logging and assembly tooling inside a working studio, on delivery schedules measured in days.",
      scope: "Records Path B",
      ground: "var(--path-b)",
    },
    {
      id: "infra",
      name: "Platform engineer",
      role: "GPU cloud provider",
      detail:
        "Runs model serving at scale and owns the cost envelope, from autoscaling policy through to per-token accounting.",
      scope: "Records Path D",
      ground: "var(--path-d)",
    },
  ] as readonly Person[],
} as const;

/*
  Learning as a team. The panel beside the copy is a designed artifact rather
  than a photograph: one shared launch date with three participants on their own
  paths, which is what the section describes. This is the page's one dark band.
*/
export const teams = {
  label: "Learning as a team",
  headline: "Run the five steps together",
  intro:
    "Each person enrols for themselves, picks the path closest to their own work, and the group agrees one launch date.",
  steps: [
    {
      title: "Enrol individually",
      text: "Each participant gets their own labs, baseline, progress record and outcome sheet.",
    },
    {
      title: "Choose paths by role",
      text: "Everyone follows the path closest to the workflow they are responsible for.",
    },
    {
      title: "Set one shared launch date",
      text: "Bring the group together to review deployed systems and compare outcomes.",
    },
  ],
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
  seat: string;
  /** The path or the discipline this seat reads. */
  reviews: string;
  checks: string;
  /** Path hue from globals.css. The assessment seat serves no single path. */
  ground: string;
  photo?: Img;
  logo?: Img;
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
*/
export const board = {
  headline: "Practitioners review the curriculum each term",
  intro:
    "They review the curriculum, the labs and the outcome sheets, so the method stays accurate to how these systems get built and operated.",
  members: [
    {
      id: "revops",
      seat: "Revenue operations",
      reviews: "Path A",
      checks: "Confirms the pipeline labs match how revenue teams work day to day.",
      ground: "var(--path-a)",
    },
    {
      id: "post",
      seat: "Post-production",
      reviews: "Path B",
      checks: "Validates ingest and rough-cut workflows against studio delivery schedules.",
      ground: "var(--path-b)",
    },
    {
      id: "field",
      seat: "Field operations",
      reviews: "Path C",
      checks: "Tests the vision and triage labs against real claims and inspection volume.",
      ground: "var(--path-c)",
    },
    {
      id: "platform",
      seat: "Platform engineering",
      reviews: "Path D",
      checks: "Reviews serving, scaling and cost control against production practice.",
      ground: "var(--path-d)",
    },
    {
      id: "smb",
      seat: "Small business operations",
      reviews: "Path E",
      checks: "Confirms the starter path stays completable by a solo owner in one sitting.",
      ground: "var(--path-e)",
    },
    {
      id: "learning",
      seat: "Learning design",
      reviews: "Assessment",
      checks: "Reviews outcome measurement, assessment design and the completion record.",
      ground: "var(--ink-secondary)",
    },
  ] as readonly Seat[],
  footnote:
    "Seats are held by practitioners in current roles. Portraits and organization marks appear as each employer clears the use of them.",
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
    a: "Pick by the work you are responsible for. GTM teams for marketing ops, RevOps and growth. Video and media for production workflows. Industry teams for field and operations work. Infrastructure for developers who own serving. The small business starter is a short first win before a longer path.",
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

export const finalCta = {
  headline: "Module 1 is open. It takes 14 minutes.",
  body: "Watch it end to end, profile one workflow, and decide from there.",
  reassurance: "Free the whole way through.",
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

/**
 * Role router, after the marketplace `goals` block.
 *
 * The FAQ already tells a reader to "pick by the work you are responsible
 * for", and this is that sentence as a control. Each tile names an audience
 * that already exists on a path, so the router adds a way in rather than a new
 * claim.
 */
export const goals = {
  headline: "Which work are you responsible for?",
  intro: "Each path runs the same five steps on a workflow you already own.",
  tiles: [
    { id: "gtm", label: "Marketing ops, RevOps and growth", badge: "Path A" },
    { id: "media", label: "Editors, producers and post supervisors", badge: "Path B" },
    { id: "industry", label: "Claims, field ops and security ops", badge: "Path C" },
    { id: "infra", label: "Developers who own the serving layer", badge: "Path D" },
    { id: "starter", label: "Owners running the business themselves", badge: "Path E" },
  ],
} as const;

/**
 * Skill cloud, after the marketplace `categories` block.
 *
 * Built from the `skills` arrays on the five paths at render time rather than
 * retyped here, so the cloud stays true to the catalog as paths change.
 */
export const categories = {
  label: "Skills",
  headline: "What the five paths teach",
  intro: "Every skill below is practised in a guided lab on a workflow you choose.",
} as const;

/**
 * The studio band, which is where the photographs live.
 *
 * Captions describe what the frame shows and stop there: the imagery policy
 * bans art that stands in for a fact, and a caption that assigns a role or an
 * event to a frame is the same failure written in words.
 *
 * Four frames became three. The one that went showed a person this site has no
 * name for, which meant a band about who records the lessons was introducing
 * somebody it would never introduce. Its caption and alt text had been written
 * to name nobody, and a photograph that has to be captioned around is a
 * photograph that does not belong on the page.
 *
 * Three frames also compose better than four. The first runs as a tall feature
 * with the other two stacked beside it, so the band reads as one photograph
 * with support rather than a row of interchangeable tiles.
 */
export const studio = {
  label: "In the studio",
  headline: "Every lesson is recorded, one lesson and one lab per module",
  intro:
    "Core lessons come from Roan. Specialist sessions come from practitioners who run these workflows in production.",
  frames: [
    {
      id: "live",
      caption: "Presenting to a room",
      image: {
        src: "/images/people/roan-weigert-speaking.jpg",
        alt: "Roan Weigert holding a microphone and speaking to a room",
      },
    },
    {
      id: "lesson",
      caption: "Recording a core lesson",
      image: {
        src: "/images/scenes/lesson-recording.jpg",
        alt: "Roan Weigert speaking to a microphone while recording a lesson in the studio",
      },
    },
    {
      id: "interview",
      caption: "An interview format session",
      image: {
        src: "/images/scenes/interview-session.jpg",
        alt: "Roan Weigert seated at a microphone during an interview format session",
      },
    },
  ],
} as const;

/**
 * Three action tiles, after the marketplace `actions` block.
 *
 * Three destinations that already exist, one per rung of the `cta` ladder.
 */
export const actions = {
  headline: "Three ways to begin",
  tiles: [
    {
      id: "module",
      title: "Watch the open module",
      detail: "14 minutes, open to everyone",
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

export const footer = {
  blurb:
    "A project-based learning program from AI Tech Education Academy. Learners build, deploy and measure one AI workflow of their own through guided role-based paths.",
  columns: [
    {
      title: "Learning paths",
      links: [
        { label: "GTM teams", href: "#paths" },
        { label: "Video and media", href: "#paths" },
        { label: "Industry teams", href: "#paths" },
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
