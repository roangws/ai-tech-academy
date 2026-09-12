"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import {
  XIcon,
  CheckCircleIcon,
  CalendarBlankIcon,
} from "@phosphor-icons/react";
import {
  updateCourseIntake,
  type IntakeResult,
} from "@/app/actions/course-intake";
import {
  courseIntakeHref,
  courseStartHref,
  OPEN_COURSE_SLUG,
  WAITLIST_START,
  type IntakeCourse,
  type IntakeSnapshot,
} from "@/lib/intake";

const Context = createContext<{
  snapshot: IntakeSnapshot | null;
  open: (slug: string) => void;
}>({ snapshot: null, open: () => {} });
const control =
  "t-button inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-wait";
const primary = `${control} bg-accent text-on-accent hover:bg-accent-hover`;
const secondary = `${control} border border-line-control bg-surface text-ink hover:bg-surface-subtle`;
const input =
  "mt-2 block w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 py-3 text-base text-ink placeholder:text-ink-muted";

export function IntakeProvider({
  children,
  initialSnapshot = null,
}: {
  children: ReactNode;
  initialSnapshot?: IntakeSnapshot | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<IntakeSnapshot | null>(
    initialSnapshot,
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [theme, setTheme] = useState("light");
  const dialog = useRef<HTMLDialogElement>(null);
  const pendingLoad = useRef<Promise<IntakeSnapshot> | null>(null);
  const openedIntent = useRef<string | null>(null);
  const load = useCallback(async () => {
    if (!pendingLoad.current) {
      pendingLoad.current = fetch("/api/course-intake", { cache: "no-store" })
        .then(async (r) => {
          if (!r.ok) throw new Error("Status unavailable");
          return r.json() as Promise<IntakeSnapshot>;
        })
        .finally(() => {
          pendingLoad.current = null;
        });
    }
    const value = await pendingLoad.current;
    setSnapshot(value);
    setLoadError(false);
    return value;
  }, []);
  const open = useCallback(
    (slug: string) => {
      setTheme(
        document
          .querySelector(".portal-shell[data-theme]")
          ?.getAttribute("data-theme") ?? "light",
      );
      setSelected(slug);
      load().catch(() => setLoadError(true));
    },
    [load],
  );

  useEffect(() => {
    let active = true;
    load()
      .then(() => {
        if (!active) return;
        const url = new URL(window.location.href);
        if (
          url.searchParams.get("intake") === "1" &&
          openedIntent.current !== url.href
        ) {
          const slug = /^\/courses\/([^/]+)$/.exec(pathname)?.[1];
          if (slug) {
            openedIntent.current = url.href;
            open(slug);
          }
        }
      })
      .catch(() => {
        if (!active) return;
        setLoadError(true);
        const url = new URL(window.location.href);
        const slug = /^\/courses\/([^/]+)$/.exec(pathname)?.[1];
        if (slug && url.searchParams.get("intake") === "1") setSelected(slug);
      });
    const refresh = () => {
      load().catch(() => setLoadError(true));
    };
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, [pathname, load, open]);

  useEffect(() => {
    if (!selected || !dialog.current) return;
    const element = dialog.current;
    const previous = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previous;
    };
  }, [selected]);

  function close() {
    openedIntent.current = null;
    setSelected(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has("intake")) {
      url.searchParams.delete("intake");
      window.history.replaceState(
        null,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }
  }
  const course = snapshot?.courses.find((c) => c.slug === selected);
  return (
    <Context.Provider value={{ snapshot, open }}>
      {children}
      {selected && (
        <dialog
          ref={dialog}
          data-theme={theme}
          aria-labelledby="intake-title"
          aria-describedby="intake-description"
          className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[560px] overflow-y-auto rounded-[var(--radius-feature)] border border-line bg-surface p-0 text-ink shadow-e3 backdrop:bg-[rgb(16_24_32/0.55)]"
          onCancel={(event) => {
            event.preventDefault();
            close();
          }}
        >
          <div className="relative p-5 sm:p-7">
            <button
              type="button"
              aria-label="Close dialog"
              onClick={close}
              className="absolute right-3 top-3 grid size-11 place-items-center rounded-lg text-ink-muted hover:bg-surface-subtle"
            >
              <XIcon size={20} />
            </button>
            {loadError ? (
              <>
                <h2 id="intake-title" className="t-h3 pr-10">
                  We could not load your course status
                </h2>
                <p
                  id="intake-description"
                  className="t-body-sm mt-3 text-ink-secondary"
                >
                  Check your connection and try again.
                </p>
                <button
                  className={`${primary} mt-5`}
                  onClick={() => {
                    load().catch(() => setLoadError(true));
                  }}
                >
                  Try again
                </button>
              </>
            ) : !snapshot ? (
              <>
                <h2 id="intake-title" className="t-h3">
                  Loading your course…
                </h2>
                <p id="intake-description" role="status" className="mt-3">
                  Checking your account.
                </p>
              </>
            ) : !course ? (
              <>
                <h2 id="intake-title" className="t-h3">
                  Course unavailable
                </h2>
                <p id="intake-description" className="mt-3">
                  Please choose another course from the catalog.
                </p>
              </>
            ) : !snapshot.signedIn ? (
              <>
                <p className="t-meta pr-10 text-ink-muted">{course.title}</p>
                <h2
                  id="intake-title"
                  className="mt-3 text-2xl font-medium tracking-tight"
                >
                  {course.slug === OPEN_COURSE_SLUG
                    ? "Sign in to apply"
                    : "Sign in to join the waitlist"}
                </h2>
                <p
                  id="intake-description"
                  className="t-body mt-3 text-ink-secondary"
                >
                  {course.slug === OPEN_COURSE_SLUG
                    ? "After signing in, answer a few questions and add your referral code if you have one."
                    : `The course starts in ${WAITLIST_START}. Sign in or create an account, then confirm your place on the waitlist.`}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link
                    onClick={close}
                    className={primary}
                    href={`/sign-in?next=${encodeURIComponent(courseIntakeHref(course.slug))}`}
                  >
                    Sign in
                  </Link>
                  <Link
                    onClick={close}
                    className={secondary}
                    href={`/sign-up?next=${encodeURIComponent(courseIntakeHref(course.slug))}`}
                  >
                    Create account
                  </Link>
                </div>
              </>
            ) : (
              <IntakeDialog
                key={`${snapshot.userId}-${selected}`}
                userId={snapshot.userId!}
                course={course}
                close={close}
                onSaved={(status) => {
                  setSnapshot(
                    (old) =>
                      old && {
                        ...old,
                        courses: old.courses.map((c) =>
                          c.slug === selected ? { ...c, status } : c,
                        ),
                      },
                  );
                  router.refresh();
                }}
              />
            )}
          </div>
        </dialog>
      )}
    </Context.Provider>
  );
}

export function IntakeDialog({
  course,
  userId,
  close,
  onSaved,
}: {
  course: IntakeCourse;
  userId: string;
  close: () => void;
  onSaved: (status: IntakeCourse["status"]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [success, setSuccess] = useState<
    "joined" | "left" | "applied" | "approved" | null
  >(null);
  const [editing, setEditing] = useState(false);
  const busyRef = useRef(false);
  const errorBox = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (result?.error) errorBox.current?.focus();
  }, [result]);
  const filmmaking = course.slug === OPEN_COURSE_SLUG;
  const draftKey = `intake-draft:${userId}:${course.slug}`;
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) ?? "null");
      return saved && Date.now() - saved.at < 30 * 60 * 1000
        ? saved.values
        : {};
    } catch {
      return {};
    }
  });
  async function submit(intent: "join" | "leave" | "apply", form?: FormData) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setResult(null);
    try {
      const saved = await updateCourseIntake(course.slug, intent, form);
      setResult(saved);
      if (!saved.error) {
        if (form)
          setDraft(
            Object.fromEntries(
              [...form.entries()].filter(
                (entry): entry is [string, string] =>
                  typeof entry[1] === "string",
              ),
            ),
          );
        try {
          sessionStorage.removeItem(draftKey);
        } catch {}
        onSaved(saved.status ?? null);
        setSuccess(
          intent === "join"
            ? "joined"
            : intent === "leave"
              ? "left"
              : saved.status === "approved"
                ? "approved"
                : "applied",
        );
      }
    } catch {
      setResult({
        error:
          "We couldn't save this. Please try again. Your answers are still here.",
      });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const title =
    success === "joined"
      ? "You're on the waitlist"
      : success === "left"
        ? "You've left the waitlist"
        : success === "approved"
          ? "You're in. Start the course."
          : success === "applied"
            ? "Application submitted"
            : filmmaking
              ? course.status === "approved"
                ? "Your course is unlocked"
                : course.status === "applied" && !editing
                  ? "Your application is in review"
                  : "Apply to join the workshop"
              : course.status === "waitlisted"
                ? "You're on the waitlist"
                : "Join the waitlist";
  return (
    <>
      <p className="t-meta pr-10 text-ink-muted">{course.title}</p>
      <h2
        id="intake-title"
        className="mt-3 pr-4 text-2xl font-medium leading-tight tracking-tight"
      >
        {title}
      </h2>
      <p id="intake-description" className="t-body-sm mt-3 text-ink-secondary">
        {success === "left"
          ? "Your place has been removed. You can join again at any time."
          : success === "approved" || course.status === "approved"
            ? "You have access to Hybrid AI Filmmaking. Your course is also saved in Your courses."
            : success === "applied" || (course.status === "applied" && !editing)
              ? "Your answers are saved. Check Your courses for your application status. Have a referral code? You can add it below."
              : filmmaking
                ? "Tell us about your work. All four questions are required. If you have a referral code, add it below before submitting."
                : course.status === "waitlisted" || success === "joined"
                  ? `Coming soon. Starts ${WAITLIST_START}. Your place is saved in your account.`
                  : `Coming soon. Starts ${WAITLIST_START}. Confirm below to save this course to your account.`}
      </p>
      {!filmmaking && (
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-accent-tint p-4 text-accent">
          <CalendarBlankIcon size={24} aria-hidden="true" />
          <span className="t-body-sm font-medium">Starts {WAITLIST_START}</span>
        </div>
      )}
      {result?.error && (
        <div
          ref={errorBox}
          tabIndex={-1}
          role="alert"
          className="mt-4 rounded-lg border border-line-control p-3 text-sm"
        >
          {result.error}
          {result.signIn && (
            <Link
              onClick={close}
              href={`/sign-in?next=${encodeURIComponent(courseIntakeHref(course.slug))}`}
              className="mt-2 block text-accent underline"
            >
              Sign in again
            </Link>
          )}
        </div>
      )}
      {success || course.status === "approved" ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {success === "applied" && (
            <button
              className={primary}
              onClick={() => {
                setSuccess(null);
                setEditing(true);
              }}
            >
              Add a referral code
            </button>
          )}
          {success === "approved" || course.status === "approved" ? (
            <Link
              href={courseStartHref(course.slug)}
              className={primary}
              onClick={close}
            >
              Start the course
            </Link>
          ) : (
            <button
              className={success === "applied" ? secondary : primary}
              onClick={close}
            >
              Done
            </button>
          )}
          <Link href="/dashboard" className={secondary} onClick={close}>
            Your courses
          </Link>
        </div>
      ) : !filmmaking ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            disabled={busy}
            className={primary}
            onClick={() =>
              course.status === "waitlisted" ? close() : submit("join")
            }
          >
            {busy
              ? "Saving…"
              : course.status === "waitlisted"
                ? "Keep my place"
                : "Join the waitlist"}
          </button>
          {course.status === "waitlisted" && (
            <button
              disabled={busy}
              className={secondary}
              onClick={() => submit("leave")}
            >
              {busy ? "Saving…" : "Leave waitlist"}
            </button>
          )}
        </div>
      ) : course.status === "applied" && !editing ? (
        <button className={`${primary} mt-6`} onClick={() => setEditing(true)}>
          Add a referral code
        </button>
      ) : (
        <form
          className="mt-6 space-y-5"
          onChange={(event) => {
            try {
              sessionStorage.setItem(
                draftKey,
                JSON.stringify({
                  at: Date.now(),
                  values: Object.fromEntries(new FormData(event.currentTarget)),
                }),
              );
            } catch {}
          }}
          onSubmit={(event) => {
            event.preventDefault();
            submit("apply", new FormData(event.currentTarget));
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              What company do you work for?
              <input
                name="company"
                defaultValue={draft.company ?? course.application?.company}
                autoComplete="organization"
                required
                maxLength={160}
                className={input}
                placeholder="Company or self-employed"
              />
            </label>
            <label className="block text-sm font-medium">
              What is your job title?
              <input
                name="job_title"
                defaultValue={draft.job_title ?? course.application?.job_title}
                autoComplete="organization-title"
                required
                maxLength={160}
                className={input}
                placeholder="Your role"
              />
            </label>
          </div>
          <label className="block text-sm font-medium">
            What kind of films or video projects are you working on right now?
            <textarea
              name="projects"
              defaultValue={draft.projects ?? course.application?.projects}
              required
              maxLength={4000}
              rows={3}
              className={`${input} resize-y`}
            />
          </label>
          <label className="block text-sm font-medium">
            What do you hope to create with AI filmmaking after this workshop?
            <textarea
              name="goals"
              defaultValue={draft.goals ?? course.application?.goals}
              required
              maxLength={4000}
              rows={3}
              className={`${input} resize-y`}
            />
          </label>
          <div className="rounded-xl border border-line bg-surface-subtle p-4 sm:p-5">
            <label
              htmlFor="referral-code"
              className="block text-lg font-medium"
            >
              Have a referral code?{" "}
              <span className="t-meta font-normal text-ink-muted">
                Optional
              </span>
            </label>
            <p id="referral-help" className="t-body-sm mt-1 text-ink-secondary">
              An invitation code can unlock your course as soon as you apply.
            </p>
            <input
              id="referral-code"
              name="referral_code"
              defaultValue={draft.referral_code}
              aria-describedby="referral-help"
              maxLength={80}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className={`${input} min-h-14 text-lg uppercase tracking-wider`}
              placeholder="Enter your code"
            />
          </div>
          <button type="submit" disabled={busy} className={`${primary} w-full`}>
            {busy ? "Submitting…" : "Submit application"}
          </button>
        </form>
      )}
    </>
  );
}

export function IntakeButton({
  slug,
  className = "",
  size = "lg",
  tone = "primary",
  withDate = true,
  onClick,
}: {
  slug: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  tone?: string;
  withDate?: boolean;
  href?: unknown;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const { snapshot, open } = useContext(Context);
  const status = snapshot?.courses.find((c) => c.slug === slug)?.status;
  const label =
    status === "waitlisted"
      ? "You're on the waitlist"
      : status === "approved"
        ? "Start the course"
        : status === "applied"
          ? "Application submitted"
          : slug === OPEN_COURSE_SLUG
            ? "Apply to join"
            : "Join the waitlist";
  const blue = status === "waitlisted" || status === "applied";
  return (
    <Link
      href={
        status === "approved" ? courseStartHref(slug) : courseIntakeHref(slug)
      }
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          status === "approved" ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        open(slug);
      }}
      className={`${control} ${blue ? "border border-accent bg-accent-tint text-accent hover:bg-surface-subtle" : tone === "secondary" ? "border border-line-control bg-surface text-ink" : "bg-accent text-on-accent hover:bg-accent-hover"} ${size === "sm" ? "px-3" : "px-5"} ${className}`}
    >
      <span className="flex flex-col items-center gap-0.5 leading-tight">
        <span className="inline-flex items-center gap-1.5">
          {blue && <CheckCircleIcon size={17} aria-hidden="true" />}
          {label}
        </span>
        {withDate && slug !== OPEN_COURSE_SLUG && (
          <span className="text-xs font-medium">Starts {WAITLIST_START}</span>
        )}
      </span>
    </Link>
  );
}

export function IntakeDescription({ slug }: { slug: string }) {
  const { snapshot } = useContext(Context);
  const status = snapshot?.courses.find((c) => c.slug === slug)?.status;
  return (
    <p className="t-meta mt-1 text-ink-muted">
      {slug !== OPEN_COURSE_SLUG
        ? `Coming soon. Starts ${WAITLIST_START}.`
        : status === "approved"
          ? "Course unlocked. Ready when you are."
          : status === "applied"
            ? "Application submitted. Awaiting review."
            : "Applications open"}
    </p>
  );
}
