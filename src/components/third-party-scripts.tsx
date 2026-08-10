import Script from "next/script";

/**
 * The two third-party scripts this site loads, and the only two.
 *
 * Roan supplied both on 9 Aug: the TrustedSite trustmark and a Google tag for
 * G-907QZ06PRR.
 *
 * ------------------------------------------------------- `next/script`, not raw tags
 *
 * Google's own instructions say to paste the snippet "immediately after the <head>
 * element", which is advice written for a hand-authored HTML page. In an App Router
 * document, a raw `<script src>` in the layout is not deduplicated across client
 * navigations and is not ordered against Next's own bootstrap. `next/script` handles
 * both, and `afterInteractive` is the strategy Next's own `GoogleAnalytics` component
 * uses for exactly this tag.
 *
 * NOT `@next/third-parties`, which is the packaged version of the same thing. It is a
 * dependency for two script tags in a project that hand-rolled a Markdown renderer
 * rather than ship `react-markdown` and draws its charts in CSS rather than ship a
 * charting library. The component it exports is thirty lines and this is those lines.
 *
 * NOT `beforeInteractive` either, for either script. That strategy blocks on the
 * network before any first-party code and the docs reserve it for "critical scripts";
 * a measurement tag and a trust badge are neither. Analytics that loads a quarter of a
 * second later is analytics; a hero that renders a quarter of a second later is a
 * slower site.
 *
 * -------------------------------------------------------------- development is excluded
 *
 * Two guards, and they fail in opposite directions on purpose.
 *
 * `NODE_ENV` keeps `next dev` out of the numbers. Without it every local page load,
 * every screenshot run and every headless QA pass lands in the same property as real
 * visitors, and the first month of data is mostly me.
 *
 * `NEXT_PUBLIC_VERCEL_ENV !== "preview"` keeps preview deployments out. It is written
 * as "not preview" rather than "is production" because the variable is supplied by the
 * platform: if it is ever absent the scripts still load, which is the safe direction to
 * fail for the one thing on this page that silently reports nothing when it is broken.
 *
 * -------------------------------------------------------------------- the policy
 *
 * `content.ts` had to change with this, and that is not a formality. The privacy page
 * said, in the site's own words, that "there is no third-party analytics or tracking
 * script on this site" and that "there is no cookie banner because there are no
 * tracking cookies". Both were true until this file existed and neither is now: gtag
 * sets `_ga` and `_ga_*`, and TrustedSite is a third party. A policy that describes a
 * site that no longer exists is worse than no policy, so the two answers were rewritten
 * in the same commit.
 *
 * THE EEA CONSENT QUESTION IS OPEN and is a decision rather than an oversight. Google's
 * setup page flags it: with visitors in the EEA, consent mode is what keeps ads
 * personalisation and measurement lawful, and that means a banner and a `gtag('consent',
 * 'default', …)` call before this tag fires. Nothing here implements one, because a
 * consent banner is a product decision about a site whose privacy page currently boasts
 * about not having one.
 */
export function ThirdPartyScripts() {
  /* Read once, so both guards are stated in one place and the JSX below reads as
     "these are the scripts" rather than as a condition. */
  const enabled =
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_VERCEL_ENV !== "preview";

  if (!enabled) return null;

  return (
    <>
      {/*
        TrustedSite's trustmark. `async` in Roan's snippet, which is what
        `afterInteractive` already produces, so the attribute is not repeated here:
        `next/script` owns the loading behaviour and a hand-set `async` beside a
        `strategy` is two instructions for one thing.
      */}
      <Script id="trustedsite" src="https://cdn.ywxi.net/js/1.js" strategy="afterInteractive" />

      {/*
        The Google tag. Two parts, and they have to stay two: the loader is a `src`
        and the configuration is inline, and the inline half must not run before
        `dataLayer` exists. `next/script` guarantees the order of two
        `afterInteractive` scripts by document order, which is the whole reason the
        config is a second `<Script>` rather than an `onLoad` handler.

        `GA_ID` is a literal rather than an env var. A measurement ID is public by
        design, it is in the HTML of every page that loads the tag, and putting it in
        the environment would mean a deploy where the variable is missing quietly
        reports to nowhere.
      */}
      <Script
        id="gtag-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-config" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}

/** The Google Analytics 4 measurement ID Roan supplied. Public by design. */
const GA_ID = "G-907QZ06PRR";
