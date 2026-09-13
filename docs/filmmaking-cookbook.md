# Filmmaking cookbook content

The classroom renders a hands-on cookbook immediately below each video description. The existing video order, lesson routes, saved progress, and supplemental material remain in use.

## Source material

- `/Users/roan/Repo/intros-GMI/video-kits/web/*.md`: kit descriptions and intended outcomes.
- `/Users/roan/Repo/intros-GMI/video-kits/kits/*/START-HERE.md`: starter prompts and learner workflow.
- `/Users/roan/Repo/intros-GMI/video-kits/MASTER_PLAN.md`: shared production and review rules.
- `/Users/roan/Repo/intros-GMI/roan-classes/hybrid-07/work/sentences.txt`: tutorial recording, brief, visual layout, and quality review.
- `/Users/roan/Repo/intros-GMI/roan-classes/hybrid-10/work/sentences.txt`: raw footage, transcription, B-roll, and revision workflow.
- `/Users/roan/Repo/intros-GMI/roan-classes/hybrid-11/work/sentences.txt`: narrated launch films, generated ads, motion graphics, and visual review.
- `src/lib/filmmaking-lessons.ts`: video sequence, foundation topics, and lesson outcomes.

## Placement

| Classroom lesson | Hands-on output | Kit |
| --- | --- | --- |
| 1. What you will learn | Client brief and use-case selection | Links to all five recipes |
| 2. Filmmaking foundations | Three-shot plan | No separate skill required |
| 3. Storytelling | Hook, change, and payoff | No separate skill required |
| 4. AI video generation | Test shot and reusable prompt | No separate skill required |
| 5. Tool selection | Tool list and representative test | No separate skill required |
| 6. Multimodal agentic loop | Brief, rules, and a reviewed iteration | Links forward to the practical lessons |
| 7. Video tutorial | Edited recording with graphics | tutorial |
| 8. Micro-drama | Consistent cast and first episode | micro-drama |
| 9. Real footage | Story edit with B-roll | vlog |
| 10. Motion graphics | Narrated launch film or vertical ad | launch, promo |

Each practical recipe includes the required inputs, complete kit and standalone skill downloads, numbered steps, the supplied starter prompt, review criteria, and a cost note. The two recipes in lesson 10 stay visible and have independent fragment links.

## Download packaging

`resources/video-kits` contains the five supplied ZIP packages and a separate copy of each SKILL.md. Markdown em dashes were normalized for the learner-facing downloads. The scripts and bundled reference files are otherwise preserved. These files are included in the download route's production trace by `next.config.ts`.

`/api/course-kits/[kit]` serves a complete ZIP. `?file=skill` serves the standalone Markdown skill. The route uses the same course access check as the classroom, allows only the five known names, and sends private, non-cacheable attachment responses.

The standalone skill is useful for inspection or reuse in an existing project. The UI recommends the complete kit because its scripts and references are required by the skill.
