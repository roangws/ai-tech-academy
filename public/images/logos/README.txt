Organization marks. Three places draw from this directory:

  - the instructor roster        an employer's mark, 18px tall on a light chip
  - the review judge board       the same, on the board cards
  - the community partners       44px tall, in sections/partners.tsx

To fill one:

  1. Add it to scripts/prepare-logos.mjs and run `node scripts/prepare-logos.mjs`
     rather than dropping a file here by hand. Marks arrive in whatever shape
     their owner ships them — a 2152x314 SVG, a 320x320 PNG whose wordmark
     floats in 60% transparent padding — and rendered at a common height those
     come out at wildly different sizes. The script trims each file to the box
     its own ink occupies, then resizes. That is why a single `h-[18px] w-auto`
     is correct for every mark in the roster.

     The source may be a path or a published https:// URL; the script fetches
     the latter, which keeps the provenance in the file instead of in somebody's
     Downloads folder.

  2. Add the line to the entry in src/lib/content.ts:

       logo: { src: "/images/logos/acme-corp.png", alt: "Acme Corp" },

Rules, from the program's imagery policy:

  - Only add a mark whose owner has cleared its use. A logo on this site reads
    as an endorsement by that organization, which is a stronger claim than a
    name, and it is the claim this project will not fabricate. content.ts has
    the note on the one deliberate reversal of this for employer marks on the
    roster cards, made on Roan's instruction, and on what it does not cover.
  - Ship a version that holds up small. Wordmarks work; dense crests do not.
  - A mark whose background is part of the design — an app icon, a badge — is
    the exception to every trim and every chip. `keepBox` in the script stops it
    being trimmed, and `markHasOwnGround` on a partner draws it edge to edge
    instead of on the light chip. A black square on a white chip is a frame
    around something that did not ask for one.
  - A mark with no name in it needs the name set in type beside it, or a reader
    sees an emblem and learns nothing. `Partner.setNameInType` is that switch,
    and `Seat.wordmark` is the same decision for a company that publishes no
    mark at all.

Files here are served at /images/logos/<name>.
