"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { CaretDownIcon } from "@phosphor-icons/react";
import { HeaderLink } from "./header-link";

type PortalLink = { href: string; label: string; count?: number };

export function PortalNavigation({ links }: { links: PortalLink[] }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  const hrefs = links.map((link) => link.href);
  const primary = links.filter((link) => link.href.startsWith("/dashboard") || link.href === "/courses");
  const workspaces = links.filter((link) => !primary.includes(link));
  const current = workspaces.find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`));
  const label = (link: PortalLink) => <>{link.label}{link.count ? <span className="ml-1.5 text-[11px] tabular-nums text-ink-muted">{link.count}<span className="sr-only"> pending invitations</span></span> : null}</>;

  return <>
    <nav aria-label="Portal" className="hidden h-16 items-stretch gap-5 lg:flex">
      {links.map((link) => <HeaderLink key={link.href} href={link.href} siblings={hrefs} variant="tab">{label(link)}</HeaderLink>)}
    </nav>
    <nav aria-label="Portal" className="col-span-2 row-start-2 flex h-11 items-stretch gap-5 border-t border-line lg:hidden">
      {primary.map((link) => <HeaderLink key={link.href} href={link.href} siblings={hrefs} variant="tab">{label(link)}</HeaderLink>)}
      {workspaces.length ? <details ref={menu} className="relative ml-auto" onKeyDown={(event) => {
        if (event.key === "Escape" && menu.current) {
          menu.current.open = false;
          menu.current.querySelector("summary")?.focus();
        }
      }}>
        <summary className={`flex h-11 cursor-pointer list-none items-center gap-1 border-b-2 text-[13px] [&::-webkit-details-marker]:hidden ${current ? "border-ink font-medium text-ink" : "border-transparent text-ink-secondary"}`}>
          {current?.label ?? "Workspace"}<CaretDownIcon size={12} aria-hidden="true" />
        </summary>
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-[var(--radius-control)] border border-line bg-surface p-1 shadow-e2" onClick={() => { if (menu.current) menu.current.open = false; }}>
          {workspaces.map((link) => <HeaderLink key={link.href} href={link.href} siblings={hrefs} className="w-full">{label(link)}</HeaderLink>)}
        </div>
      </details> : null}
    </nav>
  </>;
}
