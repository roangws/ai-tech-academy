"use client";

import { useEffect, useRef, useState } from "react";
import { XIcon } from "@phosphor-icons/react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { TeamTrainingForm } from "@/components/team-training-form";

export function TeamTrainingDialog({ courses }: { courses: { slug: string; title: string }[] }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
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

  return <>
    <LiquidButton type="button" variant="onDark" onClick={() => setOpen(true)} aria-haspopup="dialog" className="t-button mt-6">Request team training</LiquidButton>
    <dialog ref={dialog} aria-labelledby="team-training-title" aria-describedby="team-training-description" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }} className="fixed inset-0 m-auto max-h-[90dvh] w-[min(680px,94vw)] max-w-none overflow-y-auto overscroll-contain rounded-[var(--radius-feature)] border border-white/20 bg-ink-band p-0 shadow-2xl backdrop:bg-black/65">
      <div className="relative p-5 sm:p-8">
        <button type="button" onClick={() => setOpen(false)} aria-label="Close team training request" className="absolute top-3 right-3 grid size-11 cursor-pointer place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><XIcon size={22} aria-hidden="true" /></button>
        <h2 id="team-training-title" className="t-h3 pr-12 text-white">Plan your team's training</h2>
        <p id="team-training-description" className="t-body-sm mt-2 pr-8 text-white/80">Share your team size, course interests, and goals. We will follow up by email to discuss the next steps.</p>
        <TeamTrainingForm courses={courses} />
      </div>
    </dialog>
  </>;
}
