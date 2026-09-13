"use client";

import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon, XIcon } from "@phosphor-icons/react";
import { useReducedMotion } from "motion/react";

/** One shared trailer treatment for the homepage and public course page. */
export function FilmmakingPreview() {
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState<boolean | null>(null);
  const reduced = useReducedMotion();
  const shouldPause = paused ?? reduced ?? false;
  const video = useRef<HTMLVideoElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open || shouldPause) video.current?.pause();
    else void video.current?.play().catch(() => {});
  }, [open, shouldPause]);

  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    element?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <div className="relative aspect-video overflow-hidden rounded-[var(--radius-card)] bg-surface-sunken">
        <video
          ref={video}
          src="/videos/roan1.mp4"
          poster="/images/lessons/hybrid-filmmaking/slide-11.webp"
          autoPlay={!shouldPause}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Watch the Hybrid Filmmaking trailer"
          className="group absolute inset-0 grid size-full cursor-pointer place-items-center bg-black/10"
        >
          <span className="grid size-14 place-items-center rounded-full bg-white text-ink shadow-e2 transition-transform group-hover:scale-105">
            <PlayIcon size={22} weight="fill" aria-hidden="true" />
          </span>
        </button>
        <button
          type="button"
          onClick={() => setPaused(!shouldPause)}
          aria-label={shouldPause ? "Play preview loop" : "Pause preview loop"}
          className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-black/65 text-white"
        >
          {shouldPause ? (
            <PlayIcon size={16} weight="fill" aria-hidden="true" />
          ) : (
            <PauseIcon size={16} weight="fill" aria-hidden="true" />
          )}
        </button>
      </div>
      <dialog
        ref={dialog}
        aria-label="Hybrid Filmmaking trailer"
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        className="fixed inset-0 m-auto w-[min(1100px,94vw)] max-w-none overflow-visible rounded-[var(--radius-feature)] border border-white/20 bg-[#111] p-0 shadow-2xl backdrop:bg-black/80"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close trailer"
          className="absolute -top-12 right-0 grid size-10 place-items-center rounded-full bg-white text-ink"
        >
          <XIcon size={22} aria-hidden="true" />
        </button>
        {open && (
          <iframe
            title="Hybrid Filmmaking trailer"
            src="https://www.youtube-nocookie.com/embed/C1AwHog1tL0?autoplay=1&rel=0&playsinline=1"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="aspect-video max-h-[calc(100dvh-100px)] w-full rounded-[var(--radius-feature)] border-0"
          />
        )}
      </dialog>
    </>
  );
}
