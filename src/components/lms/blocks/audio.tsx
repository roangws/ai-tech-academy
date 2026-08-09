"use client";

import { useEffect, useRef, useState } from "react";
import {
  PlayIcon,
  PauseIcon,
  ArrowCounterClockwiseIcon,
  ArrowClockwiseIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { timecode, spokenDuration } from "@/lib/lms/format";
import { cn } from "@/lib/utils";

/**
 * A podcast episode, with the controls a listener actually expects.
 *
 * ------------------------------------------------------- why not <audio controls>
 *
 * The native control set has no speed, no fixed-interval skip, no chapters, and
 * renders differently in every browser. Every one of those is table stakes for
 * spoken-word audio: people listen to podcasts at 1.5x, skip back fifteen
 * seconds when they lose the thread, and jump to the part they came for.
 *
 * `preload="metadata"`, never `auto`. A lesson page with `auto` starts pulling
 * tens of megabytes before anyone has pressed anything, which on a phone is the
 * learner's data spent on a decision they have not made. Metadata is enough to
 * know the duration and draw the scrubber.
 *
 * ---------------------------------------------------------------- resume
 *
 * Position is remembered per block and offered rather than applied. A silent
 * seek to 12:04 is hostile to someone who came back to re-listen from the start,
 * so the player shows "Resume from 12:04" as a control and stays at zero until
 * it is pressed.
 *
 * Written to the server through a route handler on an interval and on the events
 * that mean "stopped" — see the position sync below. NOT through a server
 * action: every action in this app calls `revalidatePath`, which re-renders the
 * page and remounts this element, so a fifteen-second autosave would restart the
 * episode four times a minute.
 *
 * ------------------------------------------------------------- Media Session
 *
 * `navigator.mediaSession` is what makes the lock screen, the AirPod stem and
 * the car stereo work. Twenty lines, and it is the whole difference between a
 * podcast and an `<audio>` tag.
 */

const SKIP_BACK = 15;
const SKIP_FORWARD = 30;
const SPEEDS = [0.8, 1, 1.25, 1.5, 1.75, 2] as const;

/** How often a playing episode reports its position. */
const SYNC_MS = 15_000;

export function AudioBlock({
  blockId,
  src,
  title,
  duration: authoredDuration,
  chapters,
}: {
  blockId: string;
  src: string | null;
  title: string;
  duration?: number;
  chapters?: readonly { t: number; title: string }[];
}) {
  const el = useRef<HTMLAudioElement>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);
  const [length, setLength] = useState(authoredDuration ?? 0);
  const [rate, setRate] = useState(1);
  const [resumeAt, setResumeAt] = useState<number | null>(null);

  /* Position is reported on an interval while playing and on the events that
     mean the listener stopped. `keepalive` rather than sendBeacon because the
     payload is JSON and beacon would send it as text/plain. */
  useEffect(() => {
    const report = (seconds: number) => {
      if (!Number.isFinite(seconds) || seconds < 1) return;
      void fetch("/api/media-position", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId, seconds: Math.floor(seconds), duration: Math.floor(length) }),
        keepalive: true,
      }).catch(() => {});
    };

    const now = () => el.current?.currentTime ?? 0;
    const onHide = () => document.visibilityState === "hidden" && report(now());
    const timer = window.setInterval(() => playing && report(now()), SYNC_MS);

    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      report(now());
    };
  }, [blockId, playing, length]);

  /* Fetch the saved position once, and offer it. */
  useEffect(() => {
    let live = true;
    fetch(`/api/media-position?blockId=${encodeURIComponent(blockId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (live && d?.seconds > 5) setResumeAt(d.seconds);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [blockId]);

  /* Lock screen, AirPods, car stereo. */
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title, album: "AI Tech Education Academy" });
    const seek = (delta: number) => () => {
      const a = el.current;
      if (a) a.currentTime = Math.max(0, a.currentTime + delta);
    };
    navigator.mediaSession.setActionHandler("play", () => void el.current?.play());
    navigator.mediaSession.setActionHandler("pause", () => el.current?.pause());
    navigator.mediaSession.setActionHandler("seekbackward", seek(-SKIP_BACK));
    navigator.mediaSession.setActionHandler("seekforward", seek(SKIP_FORWARD));
  }, [title]);

  const skip = (delta: number) => {
    const a = el.current;
    if (a) a.currentTime = Math.max(0, Math.min(a.duration || Infinity, a.currentTime + delta));
  };

  const setSpeed = (value: number) => {
    setRate(value);
    const a = el.current;
    if (a) {
      a.playbackRate = value;
      /* Without this, 1.5x turns a voice into a chipmunk. Prefixed spelling for
         older Safari, which is exactly where spoken-word audio gets listened to. */
      const withPitch = a as HTMLAudioElement & { preservesPitch?: boolean };
      withPitch.preservesPitch = true;
    }
  };

  if (!src) {
    return (
      <p className="t-body-sm rounded-[var(--radius-card)] border border-line bg-surface-subtle p-4 text-ink-secondary">
        This episode is not available yet.
      </p>
    );
  }

  const pct = length > 0 ? (at / length) * 100 : 0;

  return (
    <figure className="rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-5">
      <figcaption className="t-card-title text-ink">{title}</figcaption>

      <audio
        ref={el}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          setLength(e.currentTarget.duration || authoredDuration || 0);
          setReady(true);
        }}
        onTimeUpdate={(e) => setAt(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      {/* ------------------------------------------------------------ transport */}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => (playing ? el.current?.pause() : void el.current?.play())}
          aria-label={playing ? `Pause ${title}` : `Play ${title}`}
          className="grid size-11 place-items-center rounded-full bg-accent text-on-accent transition-colors hover:bg-accent-hover"
        >
          {playing ? (
            <PauseIcon size={19} weight="fill" aria-hidden="true" />
          ) : (
            <PlayIcon size={19} weight="fill" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={() => skip(-SKIP_BACK)}
          aria-label={`Back ${SKIP_BACK} seconds`}
          className="grid size-11 place-items-center rounded-full border border-line-control text-ink-secondary transition-colors hover:border-accent hover:text-accent"
        >
          <ArrowCounterClockwiseIcon size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => skip(SKIP_FORWARD)}
          aria-label={`Forward ${SKIP_FORWARD} seconds`}
          className="grid size-11 place-items-center rounded-full border border-line-control text-ink-secondary transition-colors hover:border-accent hover:text-accent"
        >
          <ArrowClockwiseIcon size={16} aria-hidden="true" />
        </button>

        <span className="t-meta ml-1 tabular-nums text-ink-muted">
          {timecode(at)} / {ready || authoredDuration ? timecode(length) : "--:--"}
        </span>

        <a
          href={src}
          download
          aria-label={`Download ${title}`}
          title="Download"
          className="ml-auto grid size-11 place-items-center rounded-full text-ink-muted transition-colors hover:text-ink"
        >
          <DownloadSimpleIcon size={17} aria-hidden="true" />
        </a>
      </div>

      {/* ------------------------------------------------------------ scrubber */}
      <input
        type="range"
        min={0}
        max={Math.max(1, Math.floor(length))}
        step={1}
        value={Math.floor(at)}
        onChange={(e) => {
          const v = Number(e.currentTarget.value);
          setAt(v);
          if (el.current) el.current.currentTime = v;
        }}
        aria-label={`Seek within ${title}`}
        /* A screen reader announcing "743" tells a listener nothing. */
        aria-valuetext={`${spokenDuration(at)} of ${spokenDuration(length)}`}
        className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-sunken accent-[var(--accent)]"
        style={{
          background: `linear-gradient(to right, var(--accent) ${pct}%, var(--surface-sunken) ${pct}%)`,
        }}
      />

      {/* ----------------------------------------------------- speed and resume */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div role="group" aria-label="Playback speed" className="flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              aria-pressed={rate === s}
              className={cn(
                "t-meta min-h-[32px] rounded-full px-2.5 tabular-nums transition-colors",
                rate === s
                  ? "bg-accent-tint text-accent"
                  : "text-ink-muted hover:bg-surface hover:text-ink",
              )}
            >
              {s}&times;
            </button>
          ))}
        </div>

        {resumeAt !== null ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (el.current) el.current.currentTime = resumeAt;
                setAt(resumeAt);
                setResumeAt(null);
                void el.current?.play();
              }}
              className="t-button rounded-full bg-accent px-3.5 py-1.5 text-on-accent transition-colors hover:bg-accent-hover"
            >
              Resume from {timecode(resumeAt)}
            </button>
            <button
              type="button"
              onClick={() => setResumeAt(null)}
              className="t-meta text-ink-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Start over
            </button>
          </div>
        ) : null}
      </div>

      {/* ------------------------------------------------------------ chapters */}
      {chapters?.length ? (
        <nav aria-label={`Chapters in ${title}`} className="mt-5 border-t border-line pt-4">
          <ul className="flex flex-col gap-0.5">
            {chapters.map((c) => {
              const active = at >= c.t && !chapters.some((o) => o.t > c.t && at >= o.t);
              return (
                <li key={c.t}>
                  <button
                    type="button"
                    onClick={() => {
                      if (el.current) el.current.currentTime = c.t;
                      setAt(c.t);
                    }}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-baseline gap-3 rounded-[var(--radius-control)] px-2 py-1.5 text-left transition-colors",
                      active ? "bg-accent-tint text-accent" : "text-ink-secondary hover:bg-surface",
                    )}
                  >
                    <span className="t-meta tabular-nums">{timecode(c.t)}</span>
                    <span className="t-body-sm">{c.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </figure>
  );
}
