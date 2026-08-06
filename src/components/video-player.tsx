"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { PlayIcon } from "@phosphor-icons/react";
import { PosterTitleCard } from "@/components/ui";

/**
 * Poster-first video.
 *
 * The native control bar stays hidden until the visitor presses play, so the
 * resting state is a clean still with one affordance, the same treatment the
 * hero lesson card uses. Playback is always visitor-initiated, with no
 * autoplay, no loop and no muted-autoplay trick.
 *
 * The resting poster now carries a title card, since a raw frame of somebody
 * mid-gesture told a reader nothing about what the preview covers. Google
 * Prompting Essentials titles its thumbnail the same way.
 */
export function VideoPlayer({
  src,
  poster,
  posterAlt,
  card,
  width = 1280,
  height = 720,
}: {
  src: string;
  poster: string;
  posterAlt: string;
  card?: { title: string; beats: readonly string[] };
  width?: number;
  height?: number;
}) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  function start() {
    setPlaying(true);
    // The element mounts with the same frame, so play on the next tick.
    requestAnimationFrame(() => ref.current?.play());
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-sunken">
      {playing ? (
        <video
          ref={ref}
          className="block h-full w-full"
          controls
          playsInline
          poster={poster}
          onEnded={() => setPlaying(false)}
        >
          <source src={src} type="video/mp4" />
          Your browser can play this preview from <a href={src}>the video file</a>.
        </video>
      ) : (
        <button
          type="button"
          onClick={start}
          className="group block h-full w-full cursor-pointer text-left"
          aria-label="Play the course preview"
        >
          <Image
            src={poster}
            alt={posterAlt}
            width={width}
            height={height}
            className="h-full w-full object-cover"
          />
          <span className="pointer-events-none absolute inset-x-0 top-0 bottom-[84px] flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white pl-0.5 shadow-e2 transition-transform duration-150 group-hover:scale-105">
              <PlayIcon size={20} weight="fill" className="text-ink" />
            </span>
          </span>
          {card ? <PosterTitleCard title={card.title} beats={card.beats} /> : null}
        </button>
      )}
    </div>
  );
}
