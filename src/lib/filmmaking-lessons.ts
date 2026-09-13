import type { CourseModule } from "@/lib/content";

/** Video sequence supplied in roan-course/CLASS_TITLES.md. Existing lesson
 * routes remain the home for guides, exercises, and saved progress. */
export const filmmakingLessons = [
  {
    title: "What You Will Learn",
    group: "Start here",
    youtubeId: "Nm0s6sPDUgE",
    slide: 1,
    module: "01",
    slug: "outcomes-and-production-economics",
    description:
      "See the kinds of videos you can create, how the course works, and what you will be able to make by the end.",
    practice:
      "Choose one video you want to make during the course. Write down who it is for, what they should take away, and how you will know it worked.",
  },
  {
    title: "Filmmaking Foundations",
    group: "Fundamentals",
    youtubeId: "N1wDz9A5lXA",
    slide: 2,
    module: "02",
    slug: "filmmaking-foundations",
    description:
      "Learn the core production process and how framing, composition, lenses, camera movement, lighting, sound, and editing shape a video.",
    practice:
      "Sketch three shots for your video. For each shot, note the framing, camera movement, and sound you need.",
  },
  {
    title: "Storytelling That Keeps People Watching",
    group: "Fundamentals",
    youtubeId: "WVkNjAMf1N0",
    slide: 3,
    module: "03",
    slug: "storytelling-and-the-hero-script",
    description:
      "Build a clear story with a strong character, problem, plan, stakes, transformation, opening hook, and payoff.",
    practice:
      "Write your opening hook and final payoff. Check that the story between them gives the viewer a reason to keep watching.",
  },
  {
    title: "How AI Video Generation Works",
    group: "Fundamentals",
    youtubeId: "_ew5xw08mao",
    slide: 6,
    module: "04",
    slug: "integrating-ai-into-production",
    description:
      "Understand how AI image and video models work, where to run them, how to write prompts, and how to keep characters consistent.",
    practice:
      "Choose one shot to generate. Describe the subject, action, camera, lighting, and details that must stay consistent between attempts.",
  },
  {
    title: "Choosing the Right AI Tools",
    group: "Fundamentals",
    youtubeId: "E9wpEVlPpPg",
    slide: 5,
    module: "05",
    slug: "choosing-the-right-tools",
    description:
      "Compare tools for writing, images, video, voice, music, visual effects, 3D, quality checks, and editing.",
    practice:
      "List the jobs your project needs, then choose a tool for each job. Test one representative shot before committing to a paid plan.",
  },
  {
    title: "The Multimodal Agentic Loop",
    group: "Methodology",
    youtubeId: "l1fpp2IcR4k",
    slide: 4,
    module: "06",
    slug: "the-multimodal-agent-loop",
    description:
      "Learn how an AI agent uses a brief, tools, rules, and self-checks to create work, fix failures, and repeat the process at scale.",
    practice:
      "Write a small production brief with a clear output and a pass-or-fail check. Decide which failures the agent can retry and which need your review.",
  },
  {
    title: "Creating a Video Tutorial with AI",
    group: "Practical workflows",
    youtubeId: "ZvFoiS3aBOw",
    slide: 7,
    module: "07",
    slug: "ai-assisted-video-tutorial",
    description:
      "Turn a talking-head recording into a finished tutorial with timed graphics, generated media, quality checks, captions, and a final mix.",
    practice:
      "Choose a short teaching segment. Mark where a graphic, demonstration, or caption would make the explanation easier to follow.",
  },
  {
    title: "Creating a Micro-Drama with Consistent Characters",
    group: "Practical workflows",
    youtubeId: "KXXgGLFINd4",
    slide: 8,
    module: "09",
    slug: "consistent-micro-drama",
    description:
      "Create a short serialized drama with the same characters in every shot using reference sheets, reusable prompts, and automated checks.",
    practice:
      "Create a reference sheet for your main character. Test it in two different shots and compare the face, wardrobe, and proportions.",
  },
  {
    title: "Editing Real Footage with AI",
    group: "Practical workflows",
    youtubeId: "vnt_nU7e0mk",
    slide: 10,
    module: "10",
    slug: "real-footage-editing",
    description:
      "Turn raw camera footage into a finished video with transcript-based cuts, B-roll, graphics, color, music, and review rounds.",
    practice:
      "Build a rough cut from one recording. Watch it once for story and once for sound, then make a specific revision list.",
  },
  {
    title: "Creating Motion Graphics with AI",
    group: "Practical workflows",
    youtubeId: "v0UilzGaGHU",
    slide: 11,
    module: "11",
    slug: "generated-motion-graphics",
    description:
      "Build a short animated video with generated voice, music, images, sound effects, motion design, and automated quality checks.",
    practice:
      "Plan a short sequence around one message. Give each scene a purpose and check that the text stays readable long enough.",
  },
] as const;

export type FilmmakingLesson = (typeof filmmakingLessons)[number];
export const filmmakingPoster = (lesson: FilmmakingLesson) =>
  `/images/lessons/hybrid-filmmaking/slide-${lesson.slide}.webp`;
export const filmmakingHref = (index: number) =>
  `/learn/hybrid-filmmaking?lesson=${index + 1}`;

export const filmmakingCurriculum: CourseModule[] = [
  ...new Set(filmmakingLessons.map((l) => l.group)),
].map((group, i) => ({
  n: String(i + 1).padStart(2, "0"),
  name: group,
  summary: {
    "Start here":
      "Choose the video you want to make and understand how to work through the course.",
    Fundamentals:
      "Learn the craft and the AI tools before planning your production.",
    Methodology:
      "Build a repeatable process for creating, checking, and revising your work.",
    "Practical workflows":
      "Follow the production process for tutorials, micro-dramas, real footage, and motion graphics.",
  }[group],
  step: 1,
  access: i === 0 ? "open" : "account",
  artifact: "",
  lessons: filmmakingLessons
    .filter((l) => l.group === group)
    .map((l) => ({
      slug: l.slug,
      name: l.title,
      kind: "lesson",
      thumbnail: filmmakingPoster(l),
    })),
}));
