"use client";

import { useEffect } from "react";

/**
 * Smooth scrolling for in-page anchors, and nothing else.
 *
 * ------------------------------------------------ why this is not a CSS rule
 *
 * It was `scroll-behavior: smooth` on `html`, and that broke every client-side
 * route change on the site. Next's App Router scrolls the window itself after a
 * navigation, and a global smooth behaviour turns that into an animation the
 * router does not wait for: it measures, animates, and settles somewhere else.
 *
 * Measured rather than guessed. Navigating from a course page to /courses landed
 * at scrollY 1277 on a 2349px document — near the bottom, in the middle of the
 * prose — every single time, by every link that goes there. The same navigation
 * under `prefers-reduced-motion: reduce`, where the media query already flipped
 * the property to `auto`, landed at 0. One property, two behaviours, and the
 * only readers getting the correct one were the readers who had asked for less
 * motion.
 *
 * So the property is gone from `html` and the intent is implemented here, where
 * it can apply to anchor clicks and stay out of the router's way.
 *
 * ---------------------------------------------------------------- what it does
 *
 * One listener, on the document, for clicks on links that point at a fragment of
 * the page you are already on. Everything else is left alone, which is the whole
 * point: a route change is not an anchor jump and must not be treated as one.
 *
 * `scroll-padding-top` still lives in CSS and still does its job — it is what
 * keeps a heading clear of the 72px sticky header — because `scrollIntoView`
 * honours it.
 *
 * Reduced motion is respected by asking at click time rather than at mount, so
 * somebody who changes the system setting mid-session gets the new answer
 * without a reload.
 */
export function SmoothAnchors() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      /* Let the browser handle anything that is not a plain left click: a
         modified click is "open this somewhere else" and hijacking it is how a
         link stops working in a new tab. */
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as Element | null)?.closest?.("a");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank") return;

      /* Same document, and there is a fragment to go to. A link to another page
         that happens to carry a hash is a navigation, not a jump. */
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname !== window.location.pathname) return;
      if (!url.hash || url.hash === "#") return;

      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;

      event.preventDefault();

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });

      /* Move focus as well as the viewport. Scrolling alone leaves a keyboard
         reader's position where it was, so the next Tab carries on from the top
         of the page rather than from the section they just asked for. */
      const restore = target.getAttribute("tabindex");
      if (restore === null) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      if (restore === null) target.removeAttribute("tabindex");

      /* Keep the URL honest, without adding a history entry the back button
         would have to walk through. */
      window.history.replaceState(null, "", url.hash);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
