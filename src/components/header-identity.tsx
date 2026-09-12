"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import { Crest, Logo } from "@/components/logo";
import { brand } from "@/lib/content";

/** Stable brand and area switch across the public site and learning portal. */
export function HeaderIdentity({ area, signedIn = false }: { area: "website" | "learning"; signedIn?: boolean }) {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (menu.current && !menu.current.contains(event.target as Node)) menu.current.open = false;
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  if (!signedIn) return <div className="public-header-logo max-[360px]:[&_.font-display]:text-[11px] [&_.font-display]:text-[13px] [&_.font-display]:leading-[18px] sm:[&_.font-display]:text-[18px] sm:[&_.font-display]:leading-[23px] [&_.t-meta]:text-[11px] sm:[&_.t-meta]:text-[13px]">
    <Logo size={28} descriptor />
  </div>;
  return <div className="flex shrink-0 items-center gap-2 sm:gap-3">
    <Link href="/" aria-label={`${brand.name}, home`} className="flex min-h-11 items-center gap-2 text-ink no-underline">
      <Crest size={24} /><span className="text-[13px] font-semibold tracking-[-0.02em] sm:text-[14px]">{brand.short}</span>
    </Link>
    <span aria-hidden="true" className="text-line-strong">/</span>
    <details ref={menu} className="relative" onKeyDown={(event) => {
      if (event.key === "Escape" && menu.current) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    }}>
      <summary aria-label={`Current area: ${area === "website" ? "Website" : "My learning"}. Switch area`} className="flex min-h-11 w-[94px] cursor-pointer list-none items-center justify-between gap-1.5 text-[13px] text-ink-secondary [&::-webkit-details-marker]:hidden">
        {area === "website" ? "Website" : "My learning"}<CaretDownIcon size={12} aria-hidden="true" />
      </summary>
      <nav aria-label="Switch area" className="absolute left-0 top-full z-50 mt-1 w-44 rounded-[var(--radius-control)] border border-line bg-surface p-1 shadow-e2">
        {([{ key: "website", href: "/", label: "Website" }, { key: "learning", href: "/dashboard", label: "My learning" }] as const).map((item) =>
          <Link key={item.key} href={item.href} aria-current={area === item.key ? "true" : undefined} onClick={() => { if (menu.current) menu.current.open = false; }} className="flex min-h-11 items-center justify-between rounded-[var(--radius-control)] px-3 text-[13px] text-ink no-underline hover:bg-surface-subtle">
            {item.label}{area === item.key ? <CheckIcon size={14} aria-hidden="true" /> : null}
          </Link>)}
      </nav>
    </details>
  </div>;
}
