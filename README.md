# AI Tech Education Academy

Frontend for **AITechEducation.academy**, the public site for the Applied AI
Implementation program. This repo currently holds the marketing homepage; the
authenticated learner surfaces (dashboard, course player, assessments) are not
built yet.

## Stack

| Piece | Choice |
| --- | --- |
| Framework | Next.js 16, App Router, React 19, Turbopack |
| Styling | Tailwind v4 with CSS-variable design tokens |
| Motion | `motion/react`, isolated in client leaf components |
| Icons | `@phosphor-icons/react` (one family, no hand-rolled SVG except the brand crest) |
| Fonts | Inter, Inter Tight, IBM Plex Mono via `next/font` |

```bash
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

## Where things live

```
src/
  app/
    globals.css        design tokens, light + dark palettes, base layer
    layout.tsx         fonts, metadata, pre-paint theme script
    page.tsx           section order for the homepage
  components/
    ui.tsx             Container, ButtonLink, Eyebrow, SectionHeading, Photo
    logo.tsx           brand crest and wordmark
    site-header.tsx    sticky 72px header, mobile sheet
    site-footer.tsx
    theme-toggle.tsx
    reveal.tsx         scroll reveal, honours prefers-reduced-motion
    sections/          one file per homepage section
  lib/
    content.ts         all copy and data, plus the outstanding image manifest
mockups/               the design-canvas mockups this was built from (reference only)
```

All copy lives in `src/lib/content.ts`. Change words there, not in components.

## Design system

The tokens come from
`mockups/uploads/aitecheducationacademy/reserch/lms-ui-benchmark-2026-08-05/DESIGN-SYSTEM-AND-LMS-UX.md`
and the colour direction settled in "Academy Home v6". Three locks are enforced
across the page and should be preserved:

- **Accent lock.** One blue accent, `--accent`, carries every interactive
  surface. On the dark bands it lightens to `--accent-on-dark`, the same hue at
  AA contrast. Green is reserved for genuine state (a module that is open with
  no signup). Nothing else is coloured.
- **Radius lock.** Control 8px, card 12px, feature 16px. Full-round is reserved
  for status chips and the path tab row.
- **Theme lock.** One theme for the whole page, light or dark, following
  `prefers-color-scheme` with a manual override stored in `localStorage`. The
  two dark zones (the methodology band, and the closing CTA plus footer) keep
  their colours in both themes; they are compositional devices, not a second
  theme.

## Placeholder assets

Every photograph is a `picsum.photos` placeholder. The shot list is in the
`IMAGE_MANIFEST` comment at the bottom of `src/lib/content.ts`. Nothing here
should reach production with stock imagery. Also placeholder: the learner quote
in the story section, which is labelled as such on the page until a signed
impact letter excerpt is available.

The Practitioner Review Board deliberately has no portraits. The six seats are
described by the work they review rather than by named people, so placeholder
faces would be inventing people who do not exist yet.

## Accessibility

WCAG 2.2 AA is the baseline, per the design system doc. Currently in place:
skip link, landmark regions, visible 3px focus rings, 44px minimum targets,
`aria-expanded` accordion with associated regions, roving-tabindex tab list with
arrow-key navigation, and no reliance on colour alone for state. Motion is
gated on `prefers-reduced-motion`.
