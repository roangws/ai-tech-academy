"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowsOutIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, XIcon } from "@phosphor-icons/react";

export function LessonImage({ src, title, alt, width, height }: { src: string; title: string; alt: string; width: number; height: number }) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    element?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = previousOverflow; };
  }, [open]);
  return <>
    <button type="button" onClick={() => { setZoomed(false); setOpen(true); }} aria-haspopup="dialog" aria-label={`Enlarge: ${title}`} className="block w-full cursor-zoom-in overflow-hidden rounded-xl border border-line bg-surface text-left focus-visible:outline-2 focus-visible:outline-accent">
      {/* Session-protected images must bypass the image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={width} height={height} loading="lazy" className="h-auto w-full" />
      <span className="t-meta flex min-h-11 items-center justify-end gap-2 border-t border-line px-4 text-accent"><ArrowsOutIcon size={16} aria-hidden="true" />Enlarge image</span>
    </button>
    <dialog ref={dialog} aria-labelledby={titleId} onKeyDown={event => {
      if (event.key !== "Tab") return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }} className="fixed inset-0 m-auto max-h-[94dvh] w-[min(1400px,96vw)] max-w-none overflow-hidden open:flex open:flex-col rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/75">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2">
        <h4 id={titleId} className="t-body-sm font-medium">{title}</h4>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => setZoomed(!zoomed)} aria-label={zoomed ? "Fit image to screen" : "Zoom into image"} aria-pressed={zoomed} className="grid size-11 place-items-center rounded-lg hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-accent">{zoomed ? <MagnifyingGlassMinusIcon size={22} /> : <MagnifyingGlassPlusIcon size={22} />}</button>
          <button type="button" autoFocus onClick={() => setOpen(false)} aria-label="Close image" className="grid size-11 place-items-center rounded-lg hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-accent"><XIcon size={22} /></button>
        </div>
      </div>
      {open && <div tabIndex={0} role="region" aria-label="Image area" className="min-h-0 overflow-auto overscroll-contain bg-surface-subtle p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} width={width} height={height} className={zoomed ? "h-auto max-w-none" : "mx-auto h-auto max-h-[calc(94dvh-126px)] w-auto max-w-full object-contain"} style={zoomed ? { width } : undefined} />
      </div>}
      <p className="t-meta shrink-0 border-t border-line px-4 py-2 text-ink-secondary">{zoomed ? "Scroll to explore the image. Use fit to see the whole slide." : "Use zoom for small labels. Close to return to your lesson."}</p>
    </dialog>
  </>;
}
