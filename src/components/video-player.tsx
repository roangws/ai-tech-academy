"use client";

import { useEffect, useRef, useState } from "react";
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
  card?: { title: string };
  width?: number;
  height?: number;
}) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  const frame = useRef(0);

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    },
    [],
  );

  function start() {
    setPlaying(true);
    // The element mounts with the same frame, so play on the next tick.
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const el = ref.current;
      if (!el) return;
      /*
        Focus moves with the control. The button unmounts the instant this
        state flips, so without this `activeElement` falls to `<body>` and a
        keyboard user who just started the video has to tab from the top of the
        document to reach pause.
      */
      el.focus();
      // A rejected play() is an unhandled rejection otherwise, and the poster
      // has already been replaced by a video that is not playing.
      el.play().catch(() => setPlaying(false));
    });
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-sunken">
      {playing ? (
        <video
          ref={ref}
          className="block h-full w-full"
          controls
          playsInline
          /* No `poster`. The still is already on screen from the optimized
             `<Image>` below; pointing the video at the raw file downloaded the
             unoptimized original a second time the moment anyone pressed play. */
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
            /* The only image on the page that was missing this, so it was
               fetching a 3840px source for a slot at most 700 CSS px wide. */
            sizes="(max-width: 1024px) 100vw, 700px"
            className="h-full w-full object-cover"
          />
          {/* Tracks the title card's height, so the play button centres in the
              frame above it rather than in the whole poster. Two values because
              the card is two heights: `t-card-title` is 18/25 from md and 16/22
              below it, so 12 + 25 + 12 and 12 + 22 + 12. It was a single 84
              while the card carried a row of beat chips, and measured 1.5px out
              at 390 as a single 49. */}
          <span className="pointer-events-none absolute inset-x-0 top-0 bottom-[46px] flex items-center justify-center md:bottom-[49px]">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white pl-0.5 shadow-e2 transition-transform duration-150 group-hover:scale-105">
              <PlayIcon size={20} weight="fill" className="text-ink" />
            </span>
          </span>
          {card ? <PosterTitleCard title={card.title} /> : null}
        </button>
      )}
    </div>
  );
}
