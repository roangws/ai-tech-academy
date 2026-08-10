/**
 * The TrustedSite trustmark, beside an enrol control.
 *
 * Roan: "did u added the trust ? add by the enroll now." It was added, as the floating
 * badge their script injects in the bottom-right corner; this is the same mark placed
 * where he asked for it.
 *
 * ------------------------------------------------- WHY THIS IS AN IMG AND NOT THEIR DIV
 *
 * TrustedSite ships a supported way to place an inline trustmark: a
 * `<div class="trustedsite-trustmark">` that their script fills in. It cannot be used
 * here, and the reason is in their own script rather than in a guess. `1.js` reads a
 * per-host config from
 * `s3-us-west-2.amazonaws.com/mfesecure-public/host/<host>/client.json`, and the inline
 * routine opens with:
 *
 *     if (!config.demo) { if (!config.secure || !config.pro) { return } }
 *
 * This account's config is `secure: 1, pro: 0`, so the div would sit there rendering
 * nothing for as long as the plan stays where it is. The floating badge works because
 * it is gated on `trustmark.enabled` instead, which is `1`.
 *
 * So this renders their meter asset directly. `cdn.ywxi.net/meter/<host>/205.svg` is
 * the exact URL the floating badge builds for itself, it is issued per host, and for
 * this host it returns a real 92x38 "TrustedSite CERTIFIED SECURE" mark rather than the
 * 43-byte placeholder GIF that the styles this plan lacks return. Checked before
 * shipping, because a badge asserting a certification is the one image on the site that
 * must not silently 404 into a broken frame.
 *
 * The link goes where their own badge goes when pressed, which is the verify page for
 * this host. Their script opens it in a modal; a plain link to the same page is the
 * version that works with no JavaScript, and the badge stays meaningful either way: a
 * trustmark nobody can resolve is decoration.
 *
 * ------------------------------------------------ ONE BADGE PER PAGE, AND IT IS THIS ONE
 *
 * `trustedsite-tm-float-disable` on the wrapper suppresses the corner badge. `1.js`
 * checks for that class before injecting, so on any page that carries this seal the
 * floating one stays away, and on pages with no enrol control the corner badge behaves
 * as before. Two copies of the same mark on one screen reads as a template rather than
 * as a claim.
 *
 * The class is on the wrapper rather than on a separate empty element on purpose: the
 * suppression and the replacement are one fact, and splitting them across two elements
 * is how a page ends up with neither badge or with both.
 *
 * ------------------------------------------------------------------------ a plain img
 *
 * Not `next/image`. The source is an SVG on a third-party host, and the optimizer
 * refuses SVG unless `dangerouslyAllowSVG` is set, which is a switch that exists
 * because an SVG can carry script and is not worth flipping for one 20KB file.
 * board-card.tsx has the same note for the same reason.
 *
 * `width` and `height` are the asset's own, so the row reserves its space and nothing
 * shifts when the badge arrives.
 */
export function TrustSeal({ className = "" }: { className?: string }) {
  return (
    <a
      href={`https://www.trustedsite.com/verify?host=${HOST}`}
      target="_blank"
      rel="noopener noreferrer"
      /* `trustedsite-tm-float-disable` is read by their script. See the note above. */
      className={`trustedsite-tm-float-disable inline-flex shrink-0 no-underline ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://cdn.ywxi.net/meter/${HOST}/205.svg`}
        alt={`${HOST} is certified secure by TrustedSite`}
        width={92}
        height={38}
        /* `loading="eager"`, against the usual instinct. This sits next to the primary
           control on the first screen, so it is above the fold by definition and a lazy
           badge is a badge that appears after the decision it exists to support. */
        loading="eager"
        className="h-[38px] w-[92px]"
      />
    </a>
  );
}

/**
 * The verified host, and it is a literal.
 *
 * TrustedSite issues its config and its meter asset per hostname, so this string is
 * what makes the badge resolve. It cannot be derived from the request without making
 * every page that shows a badge dynamic, and it must not follow the deployment: a
 * preview URL has no TrustedSite record, so deriving it would render a broken badge on
 * every preview and a correct one only in production.
 */
const HOST = "academy.roanweigert.com";
