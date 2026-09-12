-- Align the public offer with the September intake and rebuild Hybrid
-- Filmmaking around the eleven recorded classes. Existing module and lesson
-- ids are retained so learner progress survives the editorial rewrite.

update public.courses
set stats = jsonb_set(stats, '{0,value}', '"Privileged access"'::jsonb, false),
    seo_title = regexp_replace(seo_title, '^Free ', 'Privileged access to ', 'i'),
    seo_description = regexp_replace(seo_description, '^A free,', 'A privileged-access,', 'i')
where jsonb_array_length(stats) > 0;

update public.courses
set summary = 'Combine traditional filmmaking craft with controllable AI production, then finish a hybrid film with a documented workflow.',
    tagline = 'Keep the craft. Add a controllable AI production layer.',
    seo_title = 'Hybrid filmmaking course with privileged access',
    seo_description = 'Apply for a hands-on hybrid filmmaking course covering story, production craft, AI tools, agent workflows, 3D and VFX, micro-drama, real-footage editing, and motion graphics.',
    keywords = array[
      'hybrid filmmaking course',
      'AI filmmaking course',
      'AI video production',
      'filmmaking with AI',
      'AI video workflow',
      'multimodal agent filmmaking'
    ],
    what_learn = array[
      'Translate filmmaking language into prompts and production specifications',
      'Build a seven-part story that gives generated images a reason to exist',
      'Choose image, video, audio, 3D, editing, and critic tools by production job',
      'Run a multimodal agent loop with written rules, self-checks, and stop conditions',
      'Produce tutorials, VFX scenes, micro-dramas, real-footage edits, and motion graphics',
      'Document rejected takes, costs, rights, and quality checks as part of the final film'
    ],
    requirements = array[
      'A phone or camera and footage you have permission to use',
      'A computer that can run a browser, ffmpeg, and an editing application',
      'Access to one agent workspace such as Codex or Claude Code',
      'Model API access is useful for the hands-on tutorials; exact providers may change',
      'No prior 3D or programming experience is required'
    ],
    description = array[
      'Hybrid filmmaking starts with the parts of production that models cannot replace: intention, story, framing, performance, sound, rhythm, and taste. The first classes establish that language before any tool is selected.',
      'The second half turns that craft into repeatable AI production systems. You will learn how to write a specification, lock references, generate in passes, keep rejected takes, and use a separate critic to check what the production model cannot reliably judge about itself.',
      'Every class page includes a written guide based on the presentation and transcript. Hands-on tutorials and downloadable setup materials are marked as placeholders until those assets are ready, so the curriculum is honest about what can be used today.'
    ]
where id = 'media';

-- The homepage hero and any other single-course feature resolve from this flag.
update public.courses set featured = false where featured;
update public.courses set featured = true where id = 'media';

with curriculum(n, name, summary, artifact) as (
  values
    ('01', 'Outcomes: what hybrid filmmaking changes', 'The production proof, the economics, and the range of work this course is designed to help you make.', 'Production target and cost baseline'),
    ('02', 'Filmmaking foundations', 'The six-stage production process and nine craft fundamentals that make prompts specific enough to direct.', 'Thirty-second production map'),
    ('03', 'Storytelling and the hero script', 'A seven-part story structure, plus hooks and comic reversals that earn attention before visual novelty wears off.', 'Hero script and opening hook'),
    ('04', 'Integrating AI into production', 'How generative models work, where they run, how to budget them, and four ways to protect consistency.', 'Hybrid shot plan and consistency strategy'),
    ('05', 'Choosing the right tools', 'A job-based map for writing, images, video, voice, music, polish, 3D, criticism, and editing.', 'Production tool map'),
    ('06', 'The multimodal agent loop', 'Turn a brief, references, and rules into an inspectable loop that makes, checks, rejects, and improves assets.', 'Agent specification and quality gate'),
    ('07', 'Use case: an AI-assisted video tutorial', 'Build a tutorial from one talking-head take, with word-timed graphics, checks, music, and a measured master.', 'Tutorial beat map and review sheet'),
    ('08', 'Use case: 3D and VFX', 'Keep a real camera move while replacing the world and stabilizing the actor through a reusable 3D reference.', 'Two-pass VFX scene and before-after'),
    ('09', 'Use case: a consistent micro-drama', 'Lock a cast, encode the story as one specification, and regenerate only the clips that fail.', 'Forty-five-second vertical episode'),
    ('10', 'Use case: a real-footage edit', 'Build a word-accurate edit whose overlays, grades, cutaways, and mix survive revision.', 'Versioned real-footage edit and QA sheet'),
    ('11', 'Use case: generated motion graphics', 'Generate voice, music, images, and motion, then keep the whole film moving and measured.', 'Launch reel with stems and critic report'),
    ('12', 'Capstone: a finished hybrid film', 'Choose one use case, document the production system behind it, and deliver a film that passes a repeatable review.', 'Finished film and production case study')
)
update public.modules m
set name = c.name,
    summary = c.summary,
    artifact = c.artifact
from curriculum c
where m.course_id = 'media' and m.n = c.n;

with lesson_copy(n, position, slug, name, kind) as (
  values
    ('01', 0, 'outcomes-and-production-economics', 'Class guide: outcomes and production economics', 'lesson'),
    ('01', 1, 'hands-on-define-your-production-target', 'Hands-on tutorial: define your production target', 'lab'),
    ('01', 2, 'resources-cost-baseline', 'Resources: cost baseline and production worksheet', 'template'),
    ('02', 0, 'filmmaking-foundations', 'Class guide: filmmaking foundations', 'lesson'),
    ('02', 1, 'hands-on-map-a-thirty-second-film', 'Hands-on tutorial: map a thirty-second film', 'lab'),
    ('02', 2, 'resources-foundations', 'Resources: brief, shot list, and sound map', 'template'),
    ('03', 0, 'storytelling-and-the-hero-script', 'Class guide: storytelling and the hero script', 'lesson'),
    ('03', 1, 'hands-on-write-the-hero-script', 'Hands-on tutorial: write the hero script', 'lab'),
    ('03', 2, 'resources-storytelling', 'Resources: story, hook, and joke worksheets', 'template'),
    ('04', 0, 'integrating-ai-into-production', 'Class guide: integrating AI into production', 'lesson'),
    ('04', 1, 'hands-on-build-a-consistency-plan', 'Hands-on tutorial: build a consistency plan', 'lab'),
    ('04', 2, 'resources-ai-production', 'Resources: prompt anatomy and cost worksheet', 'template'),
    ('05', 0, 'choosing-the-right-tools', 'Class guide: choosing the right tools', 'lesson'),
    ('05', 1, 'hands-on-build-your-tool-stack', 'Hands-on tutorial: build your tool stack', 'lab'),
    ('05', 2, 'resources-tool-map', 'Resources: tool map and comparison rubric', 'template'),
    ('06', 0, 'the-multimodal-agent-loop', 'Class guide: the multimodal agent loop', 'lesson'),
    ('06', 1, 'hands-on-write-an-agent-loop', 'Hands-on tutorial: write an agent loop', 'lab'),
    ('06', 2, 'resources-agent-loop', 'Resources: agent specification and quality gate', 'template'),
    ('07', 0, 'ai-assisted-video-tutorial', 'Class guide: an AI-assisted video tutorial', 'lesson'),
    ('07', 1, 'hands-on-build-a-video-tutorial', 'Hands-on tutorial: build a video tutorial', 'lab'),
    ('07', 2, 'resources-video-tutorial', 'Resources: brief, beat map, and review sheet', 'template'),
    ('08', 0, 'three-d-and-vfx', 'Class guide: 3D and VFX', 'lesson'),
    ('08', 1, 'hands-on-build-a-two-pass-vfx-shot', 'Hands-on tutorial: build a two-pass VFX shot', 'lab'),
    ('08', 2, 'resources-three-d-vfx', 'Resources: reference plan and pass log', 'template'),
    ('09', 0, 'consistent-micro-drama', 'Class guide: a consistent micro-drama', 'lesson'),
    ('09', 1, 'hands-on-build-a-micro-drama', 'Hands-on tutorial: build a micro-drama', 'lab'),
    ('09', 2, 'resources-micro-drama', 'Resources: cast bible, JSON spec, and reject log', 'template'),
    ('10', 0, 'real-footage-editing', 'Class guide: editing real footage', 'lesson'),
    ('10', 1, 'hands-on-build-a-versioned-edit', 'Hands-on tutorial: build a versioned edit', 'lab'),
    ('10', 2, 'resources-real-footage', 'Resources: EDL, anchors, and QA sheet', 'template'),
    ('11', 0, 'generated-motion-graphics', 'Class guide: generated motion graphics', 'lesson'),
    ('11', 1, 'hands-on-build-a-launch-reel', 'Hands-on tutorial: build a launch reel', 'lab'),
    ('11', 2, 'resources-motion-graphics', 'Resources: storyboard, mix sheet, and critic prompt', 'template'),
    ('12', 0, 'capstone-production-plan', 'Capstone guide: choose the film and define the system', 'lesson'),
    ('12', 1, 'hands-on-produce-and-review', 'Hands-on tutorial: produce, review, and revise', 'lab'),
    ('12', 2, 'resources-capstone-delivery', 'Resources: delivery checklist and case-study outline', 'template')
)
update public.lessons l
set slug = c.slug,
    name = c.name,
    kind = c.kind::public.lesson_kind
from public.modules m, lesson_copy c
where l.module_id = m.id
  and m.course_id = 'media'
  and m.n = c.n
  and l.position = c.position;

-- The main class pages get authored guides. The video note is kept separate so
-- a future video block can replace it without touching the written lesson.
with video_notes(n, md) as (
  values
    ('01', E'### Video\n\nThe finished class video will appear here. The written guide below follows the current presentation and edited transcript.'),
    ('02', E'### Video\n\nThe finished class video will appear here. Use the guide below now; it follows the current presentation and edited transcript.'),
    ('03', E'### Video\n\nThe finished class video will appear here. Use the guide below now; it follows the current presentation and edited transcript.'),
    ('04', E'### Video\n\nThe finished class video will appear here. Use the guide below now; it follows the current presentation and edited transcript.'),
    ('05', E'### Video\n\nThe finished class video will appear here. Tool names and prices can change, so confirm them before using the comparison tables.'),
    ('06', E'### Video\n\nThe finished class video will appear here. Use the guide below now; it follows the current presentation and edited transcript.'),
    ('07', E'### Video\n\nThe finished class video will appear here. The workflow and command examples are documented below.'),
    ('08', E'### Video\n\nThe class video is still in production. This guide is based on the complete 3D and VFX presentation.'),
    ('09', E'### Video\n\nThe finished class video will appear here. The workflow below follows the presentation and edited transcript.'),
    ('10', E'### Video\n\nThe finished class video will appear here. The workflow below follows the presentation and edited transcript.'),
    ('11', E'### Video\n\nThe finished class video will appear here. The workflow below follows the presentation and edited transcript.'),
    ('12', E'### Capstone\n\nUse this guide to plan the final film. The submission template and downloadable delivery pack will be added here.')
)
update public.lesson_blocks b
set payload = jsonb_build_object('md', v.md)
from public.lessons l, public.modules m, video_notes v
where b.lesson_id = l.id
  and l.module_id = m.id
  and b.key = 'scaffold'
  and l.position = 0
  and m.course_id = 'media'
  and m.n = v.n;

with guides(n, md) as (
  values
('01', $md$
## The outcome comes before the tool

Hybrid filmmaking is not a promise to replace production. It is a way to keep the parts that require judgment while using models for work that can be specified, generated, compared, and repeated. The class opens with production evidence: more than 1,600 videos, work across 480 companies and six countries, and a progression from a traditional production company in Brazil to an AI-assisted studio in San Francisco.

## Read the portfolio as a set of production patterns

The portfolio slides are not a reel of unrelated tricks. They show recurring jobs that can become systems:

1. **Interview selection:** transcription and semantic search narrow long recordings before a human makes the final editorial choice.
2. **AI VFX on real footage:** the photographed camera move remains the source of truth while the model changes the environment or selected elements.
3. **Face mapping and avatars:** identity consistency, consent, and use limits matter as much as the render.
4. **Word-synced motion graphics:** transcript timecodes turn spoken phrases into repeatable animation cues.
5. **Architecture in 3D:** geometry gives the production a stable world instead of asking diffusion to reinvent the space in every shot.
6. **AI studio and marketing systems:** briefs, references, generation, review, and delivery become one traceable loop.
7. **Micro-drama:** a character bible and fixed specification make many episodes possible without letting the cast drift.

## Compare the complete cost, not one API call

The editing example compares an estimated $900 traditional service with $116.26 in listed model and platform usage, an estimated 87 percent lower cash cost. Treat that as a case study, not a universal rate. The model bill leaves out your labor, hardware, failed attempts, storage, approvals, and the value of the craft that makes a usable result possible.

A better baseline has five columns: **human hours, external spend, accepted outputs, rejected outputs, and revision cycles**. Measure the same five after the hybrid workflow. A cheaper first render is not a saving if it creates more review, rights risk, or repair work later.

## Your decision for this course

Pick one kind of film you can actually finish. Write its audience, duration, format, deadline, and quality bar. Then record how you would make it today. That baseline is what lets the rest of the course prove whether the AI layer improved anything.
$md$),
('02', $md$
## Models learned from footage, so direct them with filmmaking language

The class maps a conventional six-stage process to hybrid production: **brief, script, production, edit, delivery, distribution**. AI can enter any stage, but it does not remove the need for the stage. A generated clip without a brief is still an unapproved idea; an impressive master in the wrong aspect ratio is still the wrong delivery.

## Six stages, one chain of decisions

- **Brief:** name the audience, problem, promise, proof, and call to action. Make the objective measurable and get approval before making shots.
- **Script:** for a short piece, place the hook in seconds 0 to 3, the problem in 3 to 8, the reveal in 8 to 16, proof in 16 to 24, and the call to action in 24 to 30. Timing is a constraint, not a guarantee; rewrite when a beat cannot breathe.
- **Production:** decide what must be photographed, what can be generated, and what needs both.
- **Edit:** arrange meaning through selection, rhythm, sound, and contrast. The timeline is where real and generated material must become one film.
- **Delivery:** make intentional 16:9, 9:16, 1:1, and short breakdown versions. Cropping after the fact is not the same as composing for the frame.
- **Distribution:** the platform changes the opening seconds, duration, and framing. YouTube, vertical feeds, LinkedIn, and web placements reward different cuts.

## The nine craft controls

Framing tells the eye where to look. Shot size changes emotional distance: a wide shot establishes place, a medium shot relates people, a close shot carries feeling, and a macro shot proves detail. Composition uses leading lines, negative space, and depth to make the image readable. Camera angle changes power. Lens choice changes spatial feeling: wide lenses stretch, longer lenses compress.

Movement needs a reason. Lock for certainty, pan to reveal, track to follow, push to focus attention, and orbit when the subject earns a heroic reveal. Light separates subject from world through key, fill, and rim. Color temperature carries mood, with tungsten around 3200K reading warmer and daylight around 5600K reading cooler. Sound combines voice, foley, room, music, and a measured master. If the audience hears the world, they are more likely to believe it.

## Prompt with relationships, not adjectives

Instead of “cinematic portrait,” specify “close shot, 85 mm lens, eye-level camera, shallow depth of field, soft key from camera left, warm practical behind the subject.” Each phrase controls a production decision and can be tested separately.
$md$),
('03', $md$
## Pretty footage is not yet a story

The deck begins with the failure mode: no goal, no character, no stakes, no payoff. The viewer may admire an image and still have no reason to watch the next one. The job of the script is to make the viewer recognize a desire or problem and say, “that is me.”

## The seven-part hero script

1. **Character:** someone wants something for a reason. Write: “My character is a… They want… because…”
2. **Problem:** separate the external event, the internal feeling, and the philosophical unfairness. The internal problem is often what makes the situation human.
3. **Guide:** earn trust with empathy and authority. “I understand the problem” and “I know a credible way through it” are different claims; use both.
4. **Plan:** reduce the path to three concrete steps. More steps can exist behind the scenes, but the viewer needs a route they can hold in working memory.
5. **Call:** give the character one choice. A vague invitation weakens the turn.
6. **Stakes:** show both success and failure. Stakes are not volume; they are the cost of doing nothing and the value of acting.
7. **Change:** finish the sentence “from ___ to ___.” If the ending cannot fill it, the story has movement but no transformation.

## The hero is not always the brand

For branded work, the customer or participant is usually the character. The product is more useful as the guide or the plan. Making the brand the hero often removes the person the audience is meant to identify with.

## Hooks buy time; they do not replace payoff

The presentation offers six hook families: shock, stakes, confession, pattern break, dare, and question. Each should create a specific unanswered question. “You will not believe this” is not a hook unless the next beat names what is at risk.

Comedy adds a second engine: setup, build, punchline. Establish expected result A, then deliver result B through an opposite result, an overreaction, a hard cut, or on-screen text that contradicts the picture. The reversal still has to advance the story rather than pause it for a joke.

## A fast script test

Read only the first sentence of each of the seven parts. If the causal chain still works, the structure is clear. Then remove any generated shot that does not change what the viewer knows, feels, or expects.
$md$),
('04', $md$
## A prompt is a shot description the model can read

The class uses a simplified path from prompt to image: the prompt is encoded, diffusion turns noise into structure over many steps, and a decoder returns the result as an image. The practical lesson is not the internal math. It is that the model samples a plausible result rather than retrieving one exact frame, so variation is expected and consistency has to be designed.

## Understand the stack

An agent can call tools; those tools call an API; the API schedules a model on a GPU. Traditional tools still sit beside that stack: camera, microphone, Premiere, Resolve, or CapCut. Knowing which layer failed prevents random prompt changes. A timeout is not an art-direction problem, and a drifting face is not fixed by buying a faster GPU.

## Four ways to run a model

Local hardware gives control and can reduce marginal cost, but requires setup and capital. A subscription is convenient but may hide limits behind credits or fair-use rules. An official API gives metered, automatable access. A rented cloud GPU can run open models without owning the machine, but it must be stopped when the job ends. The prices in the presentation are dated examples; verify current rates before budgeting.

## Write prompts as a production specification

Use four blocks:

- **Subject:** the exact person, product, or object.
- **Frame:** shot size, lens feeling, camera angle, and movement.
- **Light:** direction, quality, and color temperature.
- **Preserve:** what must remain identical and what must not appear.

Negative instructions work best beside the thing they constrain. “Keep the printed logo exactly as photographed; add no new lettering” is more useful than a long generic negative list at the end.

## Four consistency strategies

1. **References:** bind a product, character, costume, or set once.
2. **Image to video:** approve the first frame before asking for motion.
3. **Start and end frames:** lock both ends when the transition matters.
4. **Video to video:** preserve the photographed movement while changing the world.

The hybrid rule is simple: record hands, faces, materials, and any action where authenticity carries risk; modify light, backgrounds, and extensions; generate the shot the camera cannot capture; edit all of it into one rhythm and one color system.
$md$),
('05', $md$
## Pick one tool per production job

The map separates nine jobs: write and run, image, video, voice, music and sound effects, polish, 3D, critic, and cut. This matters because “best AI tool” is not a useful category. A model that holds a face across clips may be weaker at readable text. An image model used for character sheets is doing a different job from one used for a hero plate.

## Ask three questions about video models

Does it hold the face or product? Does it generate usable speech or sound? Does it accept the footage and references you already have? Then compare accepted seconds, not list price. A cheaper generation that takes twelve attempts can cost more than a higher-priced take that passes in two.

The deck maps current examples: Seedance for reference-heavy consistency and video-to-video, Kling for longer clips and value, Veo for talking people and synchronized sound, Runway for an editing environment around the model, Luma for smooth movement, and Higgsfield for presets and talking-head workflows. Treat those as a 2026 snapshot, not permanent rankings.

## Separate image jobs

Use character or product sheets before individual frames. Nano Banana is positioned for verbal edits and sheets, gpt-image for readable text and layouts, Seedream for plates and backgrounds, Midjourney for early style exploration, Flux for open local workflows, and Magnific for final polish. The broader rule is stable even when model names change: one tool establishes the system, another may finish the hero image.

## Build sound line by line

Generate voice one line per request when timing matters. Trim silence and place each line by timecode. Keep music instrumental under speech, and transcribe the bed to catch accidental vocals. Measure the mix: the class targets voice around -17 dB, music roughly 12 to 20 LU below it, and a final master around -14 LUFS.

## Use a separate critic

The production model should not be the only judge of its own work. TwelveLabs or Gemini can inspect a clip or contact sheet with a fixed schema. Ask observable questions such as “is the mouth moving?” or “is every line heard once?” before asking for a subjective score. Use ffmpeg for deterministic cuts, sheets, overlays, ducking, and loudness; finish by hand in Resolve when a human needs the wheel.
$md$),
('06', $md$
## Anything with a repeatable pattern can become a loop

The class connects three examples: a go-to-market system that produced thirty assets and 137 leads from $48.40 in ad spend, a research workflow that narrowed about 5,000 papers through forty criteria to one accepted article, and a product-photo workflow that turns a phone image into a studio result. The numbers are examples. The reusable idea is the pattern.

## What goes in and what comes out

The loop starts with a **brief, references, and rules**. The agent receives seven explicit elements: role, task, tools, rules, self-check, output format, and stop condition. It acts, checks, and repeats. It returns the asset, a report, and named rejects.

The output report is part of the production, not paperwork added later. It tells the next person what was attempted, what failed, what changed, and why the final version passed.

## Example: phone photo to studio product shot

The tote-bag specification protects identity before style. It names the straps, tabs, handle wrap, navy base, front pocket, and printed logos that must remain. Only the wall and light may change. A contact sheet is required before generation, then again after it. Each image answers the same questions: same product, same logo, anything added, light clean. A failure is moved into a reject folder with the fault in its filename.

That naming rule turns failure into data. If the same fault appears twice, rewrite the shared rule rather than patching each prompt independently.

## Turn-based and goal-based control

In a turn-based loop, you review every screenshot or clip. It is slower but appropriate for one-off work and high-risk identity decisions. In a goal-based loop, a critic repeats until a threshold or try limit. Use it only when the quality criteria can be observed reliably.

Scores are noisy. Booleans are steadier. “Realism 7 of 10” can drift between reviews; “mouth moving: true,” “squirrel present: true,” “duplicate line: false,” and a timestamp are easier to reproduce. A human still watches the final.

## Stop conditions protect the work

Every loop needs a maximum number of tries, a cost cap, and a clear request for human help. Without them, automation turns uncertainty into spend. A good stop condition says what counts as pass, when to stop, and what evidence to show when the system cannot finish safely.
$md$),
('07', $md$
## Start with one strong take

The tutorial workflow treats the presenter as the anchor. One clear 4K or 1080p talking-head take, one microphone, a short brief, and accurate words are enough to build the rest. The goal is not to cover every second with graphics. The goal is to move attention when a visual earns its place.

## The workflow from take to master

1. **Brief:** audience, benefit, call to action, original script, real numbers, logos, and screenshots.
2. **Transcribe:** use per-word timing when overlays must land on spoken phrases.
3. **Write the beat map:** each beat begins on the word that triggers it. Use a small vocabulary of graphic forms so the piece feels directed rather than decorated.
4. **Generate:** make only the art, b-roll, or music the beat map calls for.
5. **Compose:** keep the presenter full screen until a graphic earns a docked layout. One timeline should control every timed change.
6. **Lint and look:** automated checks can catch technical faults; snapshot sheets catch the visual ones.
7. **Critic, mix, render:** run a machine critique, then a human timestamp review, then measure the final master.

## Guardrails from the presentation

Keep the top and bottom 64 pixels clear for player chrome. Never cover a screen recording or the presenter’s face. Use a short guard at both ends of each overlay. Show only real numbers with a source. The deck demonstrates nine talking-head windows, but the principle is more important than the count: return to the presenter often enough that the tutorial still feels taught by a person.

## Synchronize to meaning

A beat should start on the spoken phrase that causes it, not at an arbitrary whole second. If a revision changes the edit, anchor the graphic to the source word rather than to the old timeline second. That is what keeps graphics attached to meaning across recuts.

## Review the last second

Many animation bugs happen after the main action: an icon disappears, a card snaps back, or the end frame is empty. Snapshot each beat and sample the final second in small increments. A clean lint report is necessary, but it cannot tell you whether two adjacent beats accidentally reused the same icon or whether the presenter is hidden by a panel.
$md$),
('08', $md$
## Consistency is often a geometry problem

The Twin Sunset homage begins with real footage of a walk and a look upward on a San Francisco pier. Diffusion can replace the world, but separate runs may invent a different dome, number of suns, face, or costume. The solution in this class is to keep the real camera move and stabilize the generated world and actor with references and 3D geometry.

## Build in passes

The flow is **footage, concept, portrait, 3D model, set pass, actor pass, compare, final**. Each stage solves one problem and produces an artifact the next stage can reuse.

- The real footage preserves timing, parallax, and the physical camera move.
- One approved concept frame locks the horizon, dome, two suns, and dusk light.
- A neutral front portrait becomes the costume image.
- Image-to-3D creates stable turnarounds for the actor.
- The set pass combines footage with the concept.
- The actor pass combines the approved set pass with 3D references.

Trying to solve set, actor, costume, and camera motion in one generation makes diagnosis almost impossible. Two passes let you rerun only the layer that failed.

## Shoot for replacement

Use a clean move, simple light, and a costume that is easy to distinguish from the planned environment. The bright red hoodie in the example is intentional: it makes the source actor easy to track and replace. Capture wide and close versions, and pull reference frames that clearly show the target horizon, light, and pose.

## Approve before spending

Show the concept frame before generating video. Check the set pass at 1080p before adding the actor. Put before and after frames side by side after every pass. If the face drifts, rerun the actor pass. If the costume is structurally wrong, fix the 3D source once so every later shot benefits.

## Rights and homage

Use reference scenes to measure light, horizon, pose, pacing, or composition. Do not ask a model to copy protected characters or a film frame wholesale. Record which qualities you are learning from and which original decisions make the new scene yours.
$md$),
('09', $md$
## Choose the road by the number of clips

For one hero shot, a visual tool workflow can be fastest: upload a face, prompt in the interface, review by eye, repeat. For a season, the manual path becomes thirty opportunities for drift. The specification path takes longer to set up but makes the character block, references, rejects, and quality checks reusable.

## Lock the cast before the episode

Create one sheet per character and one for the set. The class uses front, body, gesture, and peak-emotion views, with a specific rule that the face is formed in the fruit skin itself. Reference count matters: the production found three references held better than five to eight. More context can compete rather than reinforce.

## Encode the viral rules as story constraints

The workflow extracts four observable rules from strong vertical reels: state an injustice in the first two seconds, give the character one anchor gesture, keep scenes roughly three to five seconds, and end each with a reversal or cliffhanger. Dialogue stays in front, music stays under, and a short silence creates room before the twist.

## One specification per take

The JSON payload fixes model, reference images, duration, ratio, audio, style, setting, exact character descriptions, timecoded shots, dialogue, and negatives. Paste the character block verbatim into every clip. Use timecodes as the cut, and ask for each line exactly once. A repeated fault becomes a new shared rule.

## Keep the rejects

The example retained twenty-six rejected clips and needed as many as eleven tries for one shot. That is not clutter; it is the production history. Move each failure to a reject folder with the fault in the filename. Regenerate only the failed clip, never the whole episode.

## Check in layers

First tile the clip and inspect frames. Then ask a critic for a JSON verdict with timestamps. Then transcribe the generated audio to verify that every line appears once. The loop may say clean, but a human still watches the stitched episode before delivery.
$md$),
('10', $md$
## Touch the footage once, at the end

The real-footage workflow turns camera clips, phone extras, an approved story shape, fonts, and a LUT into a versioned edit. Transcription, story selection, overlays, music planning, and checks happen as data first. The expensive render happens after those decisions agree.

## Build the edit on words and anchors

Transcribe every clip per word. Propose the story in plain language and get human approval before cutting. Then write the edit decision list. Every cut edge snaps to a word, with small audio padding and fades to avoid pops or sliced syllables.

Cards and cutaways are anchored to a source clip plus a source second, not only to timeline time. When the edit changes, the anchor is remapped and the overlay stays with the moment it explains.

## Separate four tracks

Think in camera, b-roll, cards, and music. A second camera angle is useful only when it is lip-synchronized and short enough not to reveal drift. Cards and titles should be rendered independently from the base edit. Music is selected per act and ducked under speech.

## Check before anyone watches

The automated review asks: does the story shape have approval, do cuts have pops, are words sliced, is the second angle synchronized, are beds instrumental, do overlay offsets match the true rendered lengths, and does every card sit over the correct frame? Generate a contact sheet of every card and cutaway so a reviewer can scan the entire visual system at once.

## Grade and mix from measured sources

Apply the camera LUT as a starting transform, then make restrained exposure and balance corrections rather than treating the LUT as a finished grade. Transcribe music beds to catch vocals. Keep music roughly 12 to 20 LU below the voice, add short fades at edits, and measure the final around -14 LUFS.

Version every review. Timestamp notes should produce a new file and preserve the previous one, so a later change can be compared or reversed without reconstructing the earlier cut.
$md$),
('11', $md$
## Generation is only the source material

The class produces six vertical launch reels with generated voice, music, images, and faces. The shipped work took ten renders and three visual directions. The useful lesson is not that one model made a film. It is that each rejection became a production rule.

## Turn subjective notes into observable rules

“Not enough movement” became a slow push, a drifting grid, and a rising counter. “Does not look like an app” became a real interface with a prompt, caret, spinners, and completion ticks. “Music is almost not there” became a measured level change. “The memes are scary” became a fixed frame that always contains them. A good revision translates taste into something the next render can check.

## Build five acts and three sound layers

The example moves through prompt, work, intentional silence, the second attempt with the meme, then stats and installation. Voice is generated one line per call and placed by timecode. Music is silent where the joke needs silence, then returns in measured sections. Whooshes, pops, hits, and risers are synthesized as a separate effects layer.

## Keep every held frame alive

Anything on screen for more than a second should continue to change through a push, drift, float, counter, wipe, or small interface action. Movement must express state or attention; random motion only makes the film harder to read. Inspect the last second of the reel in 0.2-second steps to catch elements that stall or vanish after their main animation.

## Let the critic reject a generation

The critic sent back a music scene because nobody was visibly singing. Another generation mispronounced the brand name. The solution was not an edit around the evidence. The clip or audio was regenerated, and the brand rule changed so the name appears on screen rather than in lyrics.

## Measure the master

The class targets a voice near -17 dB, music around -22.7 dB in the example mix, and a final master near -14 LUFS. Those numbers are starting points, not a substitute for listening. Deliver the voice, music, and sound effects as stems alongside the final render and keep one critic report per version.
$md$),
('12', $md$
## Choose one film the system can finish

The capstone is a film and the production case study behind it. Choose one route from the course: a tutorial, a two-pass VFX scene, a vertical micro-drama, a real-footage edit, or a generated motion-graphics launch film. Keep the scope small enough to complete and review.

## Define the production before making assets

Write the audience, story change, duration, aspect ratio, deadline, rights boundary, available footage, references, tool jobs, cost cap, quality questions, and stop condition. Record the traditional or current baseline in human hours, external spend, accepted outputs, rejects, and revision cycles.

## Produce in inspectable passes

Lock story before shots, references before generation, and one approved still before a video pass when possible. Keep prompts, API records, contact sheets, critic reports, and named rejects beside the assets they describe. Regenerate only the failed layer.

## Deliver the evidence

The final case study should include the film, a one-paragraph brief, the production map, the baseline and final measurements, three before-and-after frames, the quality gate, a reject that changed a rule, the rights and consent notes, and a short reflection on what still required human judgment.

The capstone passes when the film meets its written criteria and another person can understand how it was made. Novelty alone is not the standard.
$md$)
)
insert into public.lesson_blocks (lesson_id, key, position, kind, title, payload)
select l.id, 'class-guide', 1, 'prose'::public.lesson_block_kind, null,
       jsonb_build_object('md', g.md)
from guides g
join public.modules m on m.course_id = 'media' and m.n = g.n
join public.lessons l on l.module_id = m.id and l.position = 0
on conflict (lesson_id, key) do update
set payload = excluded.payload,
    position = excluded.position,
    kind = excluded.kind,
    title = excluded.title;

-- The tutorial and resource lessons are deliberately marked as placeholders,
-- but each says what will be built and what the future download will contain.
with placeholders(n, position, md) as (
  values
    ('01', 1, E'## Hands-on tutorial placeholder\n\nYou will choose one film you can finish, define the audience and delivery, then record the current human hours, external spend, accepted outputs, rejects, and revision cycles. The guided worksheet and completed example will be added here.'),
    ('01', 2, E'## Resource placeholder\n\nComing here: a production baseline worksheet, cost calculator, accepted-take ratio table, and a sample completed baseline from the editing case study.'),
    ('02', 1, E'## Hands-on tutorial placeholder\n\nYou will turn a thirty-second idea into a brief, five-beat script, shot-size plan, camera and lens choices, light map, sound layers, master formats, and distribution cutdowns.'),
    ('02', 2, E'## Resource placeholder\n\nComing here: the five-answer brief, timed script sheet, shot list, lighting diagram, sound map, and delivery matrix.'),
    ('03', 1, E'## Hands-on tutorial placeholder\n\nYou will write all seven hero-script steps for one idea, compress the chain to one sentence per step, then create three opening hooks and one comic reversal.'),
    ('03', 2, E'## Resource placeholder\n\nComing here: character and problem prompts, guide and plan sheet, stakes test, change statement, hook library, and setup-build-punchline worksheet.'),
    ('04', 1, E'## Hands-on tutorial placeholder\n\nYou will choose one real shot, mark what must be preserved, approve a reference frame, and compare reference, image-to-video, start-end, and video-to-video strategies.'),
    ('04', 2, E'## Resource placeholder\n\nComing here: prompt anatomy cards, consistency decision tree, local-versus-cloud budget sheet, and a rights and provenance log.'),
    ('05', 1, E'## Hands-on tutorial placeholder\n\nYou will map one film across the nine production jobs, choose one primary tool and one fallback for each, then compare them on accepted output, time, cost, control, and failure recovery.'),
    ('05', 2, E'## Resource placeholder\n\nComing here: the editable tool map, model comparison rubric, sound-level worksheet, critic schema, and current provider links.'),
    ('06', 1, E'## Hands-on tutorial placeholder\n\nYou will write the seven elements of an agent loop, run one asset through act and check, name every reject, and stop at a written pass threshold or try limit.'),
    ('06', 2, E'## Resource placeholder\n\nComing here: agent specification, input and output folder structure, boolean critic template, cost cap, stop-condition card, and run log.'),
    ('07', 1, E'## Hands-on tutorial placeholder\n\nYou will take one talking-head recording through transcription, a word-anchored beat map, four reusable graphic forms, snapshot review, music and voice balance, and a measured 1080p master.'),
    ('07', 2, E'## Resource placeholder\n\nComing here: tutorial brief, beats.json example, safe-area overlay, snapshot checklist, review log, and final mix sheet.'),
    ('08', 1, E'## Hands-on tutorial placeholder\n\nYou will shoot one clean camera move, approve a concept frame, create an actor turnaround, generate the set pass and actor pass separately, and compare each against the source.'),
    ('08', 2, E'## Resource placeholder\n\nComing here: footage checklist, reference-frame board, concept approval sheet, 3D turnaround guide, pass log, and before-after layout.'),
    ('09', 1, E'## Hands-on tutorial placeholder\n\nYou will build a cast and set sheet, write one fifteen-second timecoded specification, generate with audio, inspect a contact sheet, transcribe the lines, and regenerate only the failed take.'),
    ('09', 2, E'## Resource placeholder\n\nComing here: cast bible, reference checker, JSON specification, viral-rule worksheet, critic schema, reject naming guide, and stitch command.'),
    ('10', 1, E'## Hands-on tutorial placeholder\n\nYou will transcribe real footage, approve the story in plain language, cut on word edges, anchor cards and cutaways to source clips, add instrumental beds, and run a no-pops review.'),
    ('10', 2, E'## Resource placeholder\n\nComing here: EDL schema, source-anchor map, card and b-roll JSON, LUT notes, music check, contact-sheet template, and version review log.'),
    ('11', 1, E'## Hands-on tutorial placeholder\n\nYou will turn a short product script into five acts, generate voice one line at a time, build a measured instrumental bed and effects layer, animate the edit, and revise from a blunt critic report.'),
    ('11', 2, E'## Resource placeholder\n\nComing here: storyboard table, design specification, voice audition sheet, sound-effects recipe, motion checklist, critic prompt, and mastering worksheet.'),
    ('12', 1, E'## Hands-on tutorial placeholder\n\nYou will produce one scoped film in passes, keep the rejects, run the written quality gate, take timestamped feedback, and revise only what failed.'),
    ('12', 2, E'## Resource placeholder\n\nComing here: capstone brief, production map, rights log, cost and time comparison, quality gate, delivery checklist, and case-study outline.')
)
update public.lesson_blocks b
set payload = jsonb_build_object('md', p.md)
from public.lessons l, public.modules m, placeholders p
where b.lesson_id = l.id
  and l.module_id = m.id
  and b.key = 'scaffold'
  and l.position = p.position
  and m.course_id = 'media'
  and m.n = p.n;
