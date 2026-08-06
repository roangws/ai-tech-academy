Organization marks for the instructor roster and the review board.

The slot is already built. src/components/media-slots.tsx renders a marked-empty
frame when an entry has no `logo`, and the real mark the moment it has one.

To fill one:

  1. Drop the file here. SVG preferred, or a PNG at 2x with a transparent
     background. Name it after the organization, lowercase and hyphenated:
     acme-corp.svg
  2. Add the line to the entry in src/lib/content.ts:

       logo: { src: "/images/logos/acme-corp.svg", alt: "Acme Corp" },

Two rules, both from the program's imagery policy:

  - Only add a mark whose owner has cleared its use. A logo on this page reads
    as an endorsement by that organization, which is a stronger claim than a
    name, and it is the claim this project will not fabricate.
  - The slot renders the mark at 20px tall against white, so ship a version
    that holds up small and monochrome. Wordmarks work; dense crests do not.

Files here are served at /images/logos/<name>. The directory is intentionally
empty until the first clearance lands.
