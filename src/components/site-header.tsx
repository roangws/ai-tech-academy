"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ListIcon, XIcon } from "@phosphor-icons/react";
import { Logo } from "@/components/logo";
import { ButtonLink, Container } from "@/components/ui";
import { cta, nav } from "@/lib/content";

/**
 * Single-tier product header, 72px.
 *
 * The docked search field was removed at Roan's request. It had been carrying
 * the argument that a catalog product keeps search in its chrome, and the brand
 * lockup gained its descriptor line with the room that released, which the
 * header had been dropping to buy horizontal space for the field.
 *
 * The audience strip that used to sit above this bar is gone too, so this is
 * the whole of the chrome: one 72px tier carrying the lockup, five nav links
 * and the primary control.
 *
 * Removed with it: the "/" focus shortcut, the shortcut hint, and the icon
 * button that stood in for the field below md. All three existed only to serve
 * the field.
 *
 * Two behaviours from the 6 Aug review stay. The nav marks the section you are
 * reading with a 2px accent rule, and the header gains a hairline shadow once
 * the page scrolls, so the chrome separates from the content under it.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /*
    Current-section tracking, computed from scroll position rather than from an
    IntersectionObserver.

    The observer version was wrong twice over. It fires only when an
    intersection changes, so a jump straight to the top of the page produced no
    entry for sections that were outside the band both before and after, and the
    rule kept marking whatever had been read last. Any transient state during
    that jump could also stick. Reading the geometry on scroll is deterministic:
    the same scroll position always resolves to the same section.

    The line that counts as "being read" sits just under the sticky chrome. Above
    the first section the rule clears, which is correct, since the hero belongs
    to no nav item.
  */
  useEffect(() => {
    const ids = nav
      .map((n) => n.href.replace("#", ""))
      .filter((id) => document.getElementById(id));
    if (ids.length === 0) return;

    let frame = 0;

    function measure() {
      const line = window.scrollY + 88 + 24;
      let current = "";
      // Sections are read in document order, so the last one whose top has
      // passed the line is the one being read.
      ids
        .map((id) => ({ id, top: document.getElementById(id)!.offsetTop }))
        .sort((a, b) => a.top - b.top)
        .forEach(({ id, top }) => {
          if (top <= line) current = id;
        });
      setActive(current);
    }

    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    }

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-surface transition-shadow duration-150 ${
        scrolled ? "border-line shadow-e1" : "border-line"
      }`}
    >
      <Container className="flex h-[72px] items-center gap-4 lg:gap-6">
        {/*
          The lockup carries its descriptor line here now. It fits because the
          search field released roughly 300px of the row, and the two stacked
          lines measure 41px inside a 72px bar. Below sm the wordmark still
          drops to the mark alone, per the logo package.
        */}
        <Logo size={36} descriptor compact />

        {/*
          All five nav links now fit from lg up. The three-link cut existed
          because the row carried the search field as well, and the full set
          measured 1050px against a 1024px viewport. Without the field the
          measurement clears, so Methodology and Outcomes no longer wait for xl.
        */}
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {nav.map((item, i) => {
            const current = active === item.href.replace("#", "");
            const secondary = i === 1 || i === 3;
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                aria-current={current ? "true" : undefined}
                className={`t-nav relative rounded-[6px] px-3 py-2.5 no-underline transition-colors hover:bg-surface-subtle hover:text-ink ${
                  current ? "text-ink" : "text-ink-secondary"
                } ${secondary ? "hidden xl:block" : ""}`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-accent transition-opacity duration-150 ${
                    current ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3 md:ml-5">
          <Link
            href="/sign-in"
            className="t-nav hidden text-ink-secondary no-underline transition-colors hover:text-ink lg:block"
          >
            Sign in
          </Link>

          {/* The primary CTA stays visible at every width. */}
          <ButtonLink href="#paths" size="md" className="max-sm:px-3">
            {cta.primary}
          </ButtonLink>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-line text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <XIcon size={20} /> : <ListIcon size={20} />}
          </button>
        </div>
      </Container>

      {open ? (
        <div id="mobile-nav" className="border-t border-line bg-surface lg:hidden">
          <Container className="py-4">
            <nav aria-label="Primary, mobile" className="flex flex-col">
              {nav.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="t-card-title border-b border-line py-3.5 text-ink no-underline"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2.5 pb-1">
              <ButtonLink href="#paths" onClick={() => setOpen(false)}>
                {cta.primary}
              </ButtonLink>
              <ButtonLink href="/sign-in" tone="secondary" onClick={() => setOpen(false)}>
                Sign in
              </ButtonLink>
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
