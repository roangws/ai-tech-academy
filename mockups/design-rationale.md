# Academy Home v1 · Design rationale

## What it matches (from the benchmark design system)
- Tokens taken verbatim from DESIGN-SYSTEM-AND-LMS-UX.md: ink-950 #101820, primary-700 #0B5F86, canvas #F5F7FA, border #D8E0E8, success #157A55, primary-100 #DDF3FB.
- Typography per spec: Inter for UI/body (16/24), Manrope 600-800 for large public headings only. Type scale follows title-lg 32/40 and display-md 48/56.
- Header: 72 px, 1280 px inner max, single nav tier, search + sign in + primary CTA right (OpenAI Academy shell pattern).
- Hero: the exact gradient recipe from the spec (radial violet accent over 125deg blue/teal), original artwork, 4.5:1 text contrast.
- Cards: 12 px radius, border plus soft shadow, card anatomy per spec (eyebrow, title, one-sentence outcome, metadata row, one primary action).
- Section rhythm: 80 px public sections, 4 px spacing grid, sentence case, CTA labels that state action and state ("Start Module 1 free").
- Decision patterns borrowed from benchmarks: hero-to-proof-to-curriculum flow (Google), featured course + compact grid (DeepLearning.AI), enrollment-fact clustering (Coursera).

## Creative deviations and rationale
- "Learn by Deploying" 5-step strip: no benchmark equivalent; it is the product's core differentiator so it sits directly under the proof strip.
- Outcome-sheet mock card: turns the evidence methodology into a tangible UI artifact; builds credibility better than testimonials the brand does not yet have.
- Track letter monograms on original gradients: gives each track identity without stock art, keeps imagery original per the research doc's rule.
- Access-model section: the Module 1 gate is the conversion mechanic in the brief, so it gets its own numbered section instead of being buried in FAQ.

## Placeholders
- Hero video poster (16:9, play overlay), Module 1 preview video still, 4 people portraits (circle). All are drag-and-drop slots; drop real images and they persist.
- Tweaks panel: hero media can switch between video card and learner photo; trust strip can be toggled.

## Review process
Each version is passed to an independent review agent that checks layout, contrast, console errors, and design-system adherence, and returns actionable defects. Fixes are applied and re-reviewed; three cycles or until no defects remain.

## Confidence
V1 self-assessment: 88%. Remaining risk: real photography and video posters are placeholders; final copy for track outcomes pending review cycles.
