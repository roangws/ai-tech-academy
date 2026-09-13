"use client";

import { useId, type PointerEvent } from "react";
import Link from "next/link";
import { motion, useSpring, useReducedMotion } from "motion/react";
import { PlayIcon, CheckCircleIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { filmmakingLessons, filmmakingHref, filmmakingPoster } from "@/lib/filmmaking-lessons";
import styles from "./floating-lessons.module.css";

function LessonCover({ index, done, requireLogin }: { index: number; done: boolean; requireLogin: boolean }) {
  const lesson = filmmakingLessons[index];
  const reduced = useReducedMotion();
  const rotateX = useSpring(0, { stiffness: 160, damping: 24 });
  const rotateY = useSpring(0, { stiffness: 160, damping: 24 });
  function move(event: PointerEvent<HTMLLIElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    rotateX.set(-((event.clientY - rect.top) / rect.height - .5) * 7);
    rotateY.set(((event.clientX - rect.left) / rect.width - .5) * 7);
  }
  function reset() { rotateX.set(0); rotateY.set(0); }
  const href = filmmakingHref(index);
  return <motion.li className={styles.slot} onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset} style={{ rotateX, rotateY, transformPerspective: 1000 }}>
    <Link href={requireLogin ? `/sign-in?next=${encodeURIComponent(href)}` : href} className={styles.card} aria-label={`Lesson ${index + 1}: ${lesson.title}${done ? ", completed" : ""}`}>
      <div className={styles.cover}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={filmmakingPoster(lesson)} alt="" width={480} height={270} loading="lazy" />
        <span className={styles.play} aria-hidden="true"><PlayIcon size={19} weight="fill" /></span>
        {done && <CheckCircleIcon className={styles.check} size={23} weight="fill" aria-hidden="true" />}
      </div>
      <div className={styles.caption}><span className={styles.number}>{String(index + 1).padStart(2,"0")}</span><span className={styles.title}>{lesson.title}</span><ArrowUpRightIcon className={styles.arrow} size={15} aria-hidden="true" /></div>
    </Link>
  </motion.li>;
}

export function FloatingLessons({ completed = [], preview = false, requireLogin = false }: { completed?: number[]; preview?: boolean; requireLogin?: boolean }) {
  const headingId = useId();
  const Heading = preview ? "h2" : "h3";
  return <section aria-labelledby={headingId} className={styles.section}>
    <div className={styles.heading}><div>
      {preview && <p className="t-label mb-3 text-accent">Inside hybrid filmmaking</p>}
      <Heading id={headingId} className="t-h3 text-ink">{preview ? "Explore the ten classes" : "Your next scene starts here"}</Heading>
      <p className="t-body-sm mt-2 max-w-[64ch] text-ink-secondary">{preview ? "From framing and storytelling to working with AI. Each class connects the video to visual notes and a hands-on cookbook." : "Ten lessons. Choose a cover and start watching."}</p>
    </div></div>
    <div className={styles.stage}><ol className={styles.wall}>{filmmakingLessons.map((lesson, i) => <LessonCover key={lesson.slug} index={i} done={completed.includes(i)} requireLogin={requireLogin} />)}</ol></div>
    <p className="t-meta text-ink-muted">{preview ? "Select a class to enter the course. Sign in is required, and course access applies." : "Opening a video marks that lesson done. You can change it back inside the lesson."}</p>
  </section>;
}
