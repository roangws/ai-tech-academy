import { readFile } from "node:fs/promises";
import { join } from "node:path";

/* eslint-disable @next/next/no-img-element -- every element in this file is
   rendered by satori into a PNG, never by a browser. `next/image` is a React
   component that emits a `<picture>` for a DOM to lay out; satori supports one
   image element and would not know what to do with it. */
import { ImageResponse } from "next/og";

import { brand } from "@/lib/content";
import type { VerifiedCompletion } from "@/lib/supabase/types";

import { groundHex, issuedOn } from "./certificates";

/**
 * The certificate, drawn once.
 *
 * ------------------------------------------------------ why this is an image
 *
 * Everything that shows a certificate shows this route: the learner's own page,
 * the public verification page, the admin console, and both downloads. There is
 * no second layout in markup that has to be kept looking like this one, because
 * the moment there is, the PNG somebody downloads and the page they downloaded
 * it from start drifting apart at the first CSS change.
 *
 * The cost is that the words on it are not selectable, so every page that embeds
 * it prints the same four facts as real text underneath. The image is the
 * document; the text beside it is the accessible copy of the document.
 *
 * ---------------------------------------------------------------- the sizing
 *
 * 2000 x 1414 is A4 landscape at 170dpi, which is the ratio the PDF wraps
 * without letterboxing and a high enough resolution to print at A4 without the
 * rules going soft.
 *
 * ------------------------------------------------------------ authorisation
 *
 * The reference is the capability. This route resolves it through
 * `verify_completion`, the same SECURITY DEFINER function the public
 * verification page uses, so it can render for a signed-out reader and still
 * exposes nothing the printed document does not already carry. A reference that
 * does not resolve is a 404, not a blank certificate.
 */

/** 2000 x 1414. A4 landscape at 170dpi, to within a pixel of √2. */
export const CERTIFICATE_SIZE = { width: 2000, height: 1414 } as const;

const WIDTH = CERTIFICATE_SIZE.width;
const HEIGHT = CERTIFICATE_SIZE.height;

/* Tokens, lifted from globals.css :root. The light values only — a certificate
   has one appearance, and it is the one that prints. */
const INK = "#101820";
const INK_SECONDARY = "#3d4f60";
const INK_MUTED = "#5c6e7f";
const LINE = "#d8e1e8";
const LINE_STRONG = "#aebecb";
const SURFACE = "#ffffff";

/* Read once at module scope, not per request: the bytes do not depend on the
   request, and re-reading 1.2MB of font on every certificate is 1.2MB of disk
   per certificate. The path is the one the Next docs use for this, and
   next.config.ts names the directory in outputFileTracingIncludes so the build
   ships it into the function. */
const FONT_DIR = join(process.cwd(), "assets", "fonts");
const fonts = Promise.all([
  readFile(join(FONT_DIR, "Inter-Regular.ttf")),
  readFile(join(FONT_DIR, "Inter-SemiBold.ttf")),
  readFile(join(FONT_DIR, "InterDisplay-SemiBold.ttf")),
]);

/*
  The crest, as a data URI.

  Same geometry as src/components/logo.tsx — grid 120 x 136, shield x 8-112, the
  rule a true 9-unit concentric inset at stroke 5 — because the brand package
  specifies it and two drawings of one mark drift. It is inlined rather than
  imported because satori renders SVG from a source string, and it is a data URI
  rather than a file read because it is 400 bytes.

  base64 rather than percent-encoded. `data:image/svg+xml;utf8,` names a media
  type parameter that no specification defines, and it survives in the wild only
  because browsers are forgiving about it; base64 needs nobody to be forgiving.
  (It is not what broke this route during the build — see
  `allowSvgRasterisation` below for that — but it was the first suspect, and
  there was no reason to put the ambiguous spelling back afterwards.)
*/
const svgUri = (markup: string) =>
  `data:image/svg+xml;base64,${Buffer.from(markup, "utf8").toString("base64")}`;

const CREST = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 136" fill="none">` +
    `<path d="M34 6H86A26 26 0 0 1 112 32V78A52 52 0 0 1 8 78V32A26 26 0 0 1 34 6Z" fill="#02B1E0"/>` +
    `<path d="M34 15H86A17 17 0 0 1 103 32V78A43 43 0 0 1 17 78V32A17 17 0 0 1 34 15Z" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linejoin="round"/>` +
    `<path d="M55 40 77 92H33Z" fill="#CFEDF9"/>` +
    `<path d="M69 40H87V92H69Z" fill="#FFFFFF" fill-opacity="0.5"/>` +
    `</svg>`,
);

/** The tick inside the seal, at the stroke weight the site's icons use. */
const TICK = (color: string) =>
  svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none">` +
      `<path d="M40 140 L100 200 L216 68" stroke="${color}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>` +
      `</svg>`,
  );

/**
 * The portrait, fetched here rather than handed to satori as a URL.
 *
 * satori will fetch a remote `src` itself, and if that fetch fails it throws and
 * the whole certificate becomes a 500. A learner whose avatar object was deleted
 * would lose their certificate, which is the wrong failure: the portrait is the
 * one optional thing on the document. Fetching it here means a dead URL costs
 * the portrait and nothing else.
 */
async function portrait(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    /* 4MB is well past the 2MB the avatars bucket accepts. Anything larger came
       from somewhere else and is not going on a certificate. */
    if (bytes.byteLength > 4_000_000) return null;
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Let libvips read the SVG that satori just produced.
 *
 * ------------------------------------------------------------------ the bug
 *
 * `ImageResponse` renders in two stages: satori turns the JSX into an SVG, and
 * something rasterises that SVG into a PNG. @vercel/og picks the rasteriser at
 * runtime — if `import("sharp")` resolves it uses sharp, and only falls back to
 * its bundled resvg WebAssembly build when sharp is absent. sharp is one of
 * Next's own optional dependencies, so in a Next app it is essentially always
 * present and the sharp path is essentially always taken.
 *
 * And Next blocks it. `getSharp` in next/dist/server/image-optimizer.js opens
 * with `sharp.block({ operation: ['VipsForeignLoad'] })` — every loader — and
 * then unblocks six by name: heif, jpeg, gif, png, tiff, webp. SVG is
 * deliberately absent from that list. libvips holds that state per process, so
 * from the first optimised `next/image` onwards, every ImageResponse in the
 * process fails with `Input buffer contains unsupported image format`: an error
 * about the SVG that names neither SVG nor sharp, raised from a code path this
 * file never calls.
 *
 * Verified rather than deduced: the identical `sharp(svgBytes).png()` call
 * succeeds in a plain node process against this exact sharp build, and fails
 * inside `next dev`.
 *
 * ------------------------------------------------------------- why this is safe
 *
 * The block exists because a hostile SVG reaching a rasteriser is an XSS and
 * SSRF surface, and that is a real risk for the image optimiser, whose input is
 * a URL somebody can put in an `<img src>`.
 *
 * It is not the risk here, twice over. The only SVG this unblock lets through is
 * the one satori generates from the JSX below, in this process, from a database
 * row — there is no request-controlled path into it. And the optimiser is not
 * exposed by this either: Next refuses to optimise SVG in the route handler,
 * before sharp is reached, unless `images.dangerouslyAllowSVG` is set, and
 * next.config.ts does not set it. The libvips block is the second lock on a door
 * whose first lock is untouched.
 *
 * One operation, by name. `block`/`unblock` are process-global and idempotent,
 * and this is called per render rather than once at import because the optimiser
 * initialises sharp lazily: whichever of the two runs second wins, and only this
 * one can be made to run last.
 */
async function allowSvgRasterisation(): Promise<void> {
  try {
    const sharp = (await import("sharp")).default;
    sharp.unblock({ operation: ["VipsForeignLoadSvg"] });
  } catch {
    /* No sharp, so @vercel/og is on its bundled resvg build and there is
       nothing to unblock. That path works untouched. */
  }
}

export async function renderCertificate(record: VerifiedCompletion): Promise<ImageResponse> {
  await allowSvgRasterisation();
  const [regular, semibold, display] = await fonts;
  const ground = groundHex(record.course_ground);
  const photo = await portrait(record.avatar_url);
  const holder = record.holder ?? "This learner";
  const verifyUrl = `${brand.domain}/verify/${record.reference}`;

  const label = {
    fontSize: 19,
    fontWeight: 600,
    letterSpacing: 3.4,
    textTransform: "uppercase" as const,
    color: INK_MUTED,
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: SURFACE,
          padding: 54,
        }}
      >
        {/* The double frame. Two rules of different weight and colour rather
            than one thick one: the outer holds the page, the inner holds the
            text, and the 20px between them is what makes a document read as a
            document instead of as a card. */}
        <div
          style={{
            display: "flex",
            flex: 1,
            border: `2px solid ${LINE_STRONG}`,
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
              border: `1px solid ${LINE}`,
              /* The vertical budget, and it is tight on purpose.

                 Frame height less its two paddings and two rules leaves 1148px
                 for content. A certificate with a portrait needs about 1074 of
                 them, which is the case this padding is set for; without one it
                 needs 250 fewer and the middle block absorbs the difference,
                 which is why that block is the flexible one. Adding a line here
                 without taking 30px out somewhere else squeezes the letterhead
                 into the title, and satori reports nothing when it happens. */
              padding: "56px 110px 56px",
            }}
          >
            {/* ------------------------------------------------ the letterhead */}
            <img src={CREST} width={96} height={109} alt="" />
            <div
              style={{
                marginTop: 14,
                fontSize: 21,
                fontWeight: 600,
                letterSpacing: 8,
                color: INK,
                textTransform: "uppercase",
              }}
            >
              {brand.name}
            </div>
            <div style={{ marginTop: 10, ...label, letterSpacing: 4.6, fontWeight: 400 }}>
              {brand.program}
            </div>

            {/* ------------------------------------------------- the middle
                flex: 1 and centred, so the block sits in the optical middle of
                the frame whether or not there is a portrait in it. That is the
                whole reason the portrait is centred above the name rather than
                beside it: two layouts that each look composed, from one
                stylesheet, and no reflow of everything else when a learner has
                no photograph. */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
                justifyContent: "center",
              }}
            >
              {/* An explicit gap rather than whatever the flexible block has
                  left over. With a portrait the leftover is about 40px, and at
                  that distance the letterhead and this line read as one
                  four-line block instead of as a mark and then a title. */}
              <div
                style={{ display: "flex", ...label, letterSpacing: 9, color: INK, marginTop: 34 }}
              >
                Certificate of Completion
              </div>
              <div
                style={{
                  display: "flex",
                  width: 180,
                  height: 1,
                  marginTop: 24,
                  backgroundColor: LINE_STRONG,
                }}
              />

              {photo ? (
                <img
                  src={photo}
                  width={128}
                  height={128}
                  alt=""
                  style={{
                    marginTop: 26,
                    borderRadius: 128,
                    objectFit: "cover",
                    border: `3px solid ${LINE_STRONG}`,
                  }}
                />
              ) : null}

              <div
                style={{
                  marginTop: photo ? 20 : 30,
                  fontSize: 22,
                  color: INK_MUTED,
                }}
              >
                This certifies that
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontFamily: "InterDisplay",
                  fontWeight: 600,
                  fontSize: holder.length > 26 ? 66 : 86,
                  letterSpacing: -1.5,
                  color: INK,
                  textAlign: "center",
                }}
              >
                {holder}
              </div>
              <div style={{ marginTop: 18, fontSize: 22, color: INK_MUTED }}>
                has completed every lesson of
              </div>
              <div style={{ display: "flex", marginTop: 22, ...label, color: ground }}>
                {record.course_badge}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 44,
                  fontWeight: 600,
                  letterSpacing: -0.6,
                  color: INK,
                  textAlign: "center",
                }}
              >
                {record.course_title}
              </div>
              <div
                style={{
                  marginTop: 22,
                  maxWidth: 1020,
                  fontSize: 21,
                  lineHeight: 1.5,
                  color: INK_SECONDARY,
                  textAlign: "center",
                }}
              >
                {/*
                  Exactly what was checked, and nothing beside it.

                  This line first read "A course completes when the workflow built
                  on it runs live and the result has been measured", which is the
                  program's canonical sentence and is a claim about a deployment
                  this document has not seen. What issues a certificate is every
                  lesson of the course being completed. Saying more than that on
                  the paper would be the site certifying something it never
                  checked, and the second sentence exists to send a reader to the
                  document that does carry that claim.
                */}
                Every lesson and every lab in this course was completed by the person
                named above. The workflow they built and the result they measured are
                recorded separately, on their outcome sheet.
              </div>
            </div>

            {/* --------------------------------------------------- the seal
                Concentric rules and a tick, in the course colour. Drawn rather
                than photographed, and deliberately not a badge graphic: the
                design spec bans decorative marks, and a seal that is two circles
                and a check is a seal by geometry rather than by ornament. */}
            <div
              style={{
                display: "flex",
                width: 112,
                height: 112,
                borderRadius: 112,
                border: `2px solid ${ground}`,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 22,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 90,
                  height: 90,
                  borderRadius: 90,
                  border: `1px solid ${LINE_STRONG}`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img src={TICK(ground)} width={46} height={46} alt="" />
              </div>
            </div>

            {/* ---------------------------------------------------- the foot

                Two columns and then one line, rather than three columns.

                The verification URL was a third column and it wrapped: it is a
                domain, a path and a twenty-two character reference, and a third
                of the measure will not hold that at a size anybody reads across
                a room. It is the widest single fact on the document, so it gets
                the full width and the two short facts share the row above it. */}
            <div style={{ display: "flex", width: "100%", height: 1, backgroundColor: LINE }} />
            <div
              style={{
                display: "flex",
                width: "100%",
                marginTop: 24,
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", ...label, fontSize: 15, letterSpacing: 2.6 }}>
                  Reference
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 26,
                    fontWeight: 600,
                    letterSpacing: 1.4,
                    color: INK,
                  }}
                >
                  {record.reference}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div style={{ display: "flex", ...label, fontSize: 15, letterSpacing: 2.6 }}>
                  Issued
                </div>
                <div style={{ marginTop: 8, fontSize: 26, color: INK }}>
                  {issuedOn(record.issued_at)}
                </div>
              </div>
            </div>

            {/* One template string, not text plus an expression. satori refuses
                any div with more than one child node unless it is told what
                display it has, and JSX counts those two as two children. */}
            <div style={{ marginTop: 18, fontSize: 20, color: INK_MUTED }}>
              {`Check this certificate at ${verifyUrl}`}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "Inter", data: semibold, weight: 600, style: "normal" },
        { name: "InterDisplay", data: display, weight: 600, style: "normal" },
      ],
    },
  );
}
