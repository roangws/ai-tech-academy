"use client";

import Link from "next/link";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
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
  validateCourseReferral,
  type IntakeResult,
} from "@/app/actions/course-intake";
import {
  courseIntakeHref,
  courseStartHref,
  OPEN_COURSE_SLUG,
  OPEN_COURSE_START,
  WAITLIST_START,
  type IntakeCourse,
  type IntakeSnapshot,
} from "@/lib/intake";

const Context = createContext<{
  snapshot: IntakeSnapshot | null;
  open: (slug: string) => void;
}>({ snapshot: null, open: () => {} });
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
                <LiquidButton variant="accent"
                  className="t-button mt-5"
                  onClick={() => {
                    load().catch(() => setLoadError(true));
                  }}
                >
                  Try again
                </LiquidButton>
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
                    ? "Your filmmaking course starts here"
                    : "Sign in to join the waitlist"}
                </h2>
                <p
                  id="intake-description"
                  className="t-body mt-3 text-ink-secondary"
                >
                  {course.slug === OPEN_COURSE_SLUG
                    ? "Create your free account to apply and keep all your lessons in one place. Have a referral code? Use it in the next step to unlock the course."
                    : `The course starts in ${WAITLIST_START}. Sign in or create an account, then confirm your place on the waitlist.`}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <LiquidButton asChild variant="accent" className="t-button">
                  <Link
                    onClick={close}
                    href={`/sign-up?next=${encodeURIComponent(courseIntakeHref(course.slug))}`}
                  >
                    Create account
                  </Link>
                  </LiquidButton>
                  <LiquidButton asChild className="t-button">
                  <Link
                    onClick={close}
                    href={`/sign-in?next=${encodeURIComponent(courseIntakeHref(course.slug))}`}
                  >
                    Sign in
                  </Link>
                  </LiquidButton>
                </div>
              </>
            ) : (
              <IntakeDialog
                key={`${snapshot.userId}-${selected}`}
                userId={snapshot.userId!}
                course={course}
                profile={snapshot.profile}
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
  profile,
  close,
  onSaved,
  validateReferral = validateCourseReferral,
}: {
  course: IntakeCourse;
  userId: string;
  profile?: IntakeSnapshot["profile"];
  close: () => void;
  onSaved: (status: IntakeCourse["status"]) => void;
  validateReferral?: typeof validateCourseReferral;
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
  const [referralCode, setReferralCode] = useState(draft.referral_code ?? "");
  const [validatedCode, setValidatedCode] = useState<string | null>(null);
  const [codeError, setCodeError] = useState("");
  const [validating, setValidating] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const codeRequest = useRef(0);
  const codeInput = useRef<HTMLInputElement>(null);
  const normalizedCode = referralCode.trim().toUpperCase();
  const codeValid = Boolean(normalizedCode && validatedCode === normalizedCode);
  async function validateCode() {
    const request = ++codeRequest.current;
    setValidating(true);
    setCodeError("");
    try {
      const response = await validateReferral(referralCode);
      if (request !== codeRequest.current) return;
      setValidatedCode(response.valid ? normalizedCode : null);
      setCodeError(response.error ?? "");
      if (response.valid) setCelebrate((count) => count + 1);
    } catch {
      if (request === codeRequest.current) setCodeError("We could not check your code. Try again.");
    } finally {
      if (request === codeRequest.current) setValidating(false);
    }
  }
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
        if (intent === "apply" && saved.status === "approved") {
          window.location.assign(courseStartHref(course.slug));
        }
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
                  : "Apply to join the course"
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
            ? "Your course is unlocked. Open it now or find it in My courses."
            : success === "applied" || (course.status === "applied" && !editing)
              ? "Your application is saved in My courses. Have a referral code? Add it below to start now."
              : filmmaking
                ? "Answer all four questions. Have a referral code? Enter it below and click Validate to start the course without waiting for review."
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
            <LiquidButton variant="accent"
              className="t-button"
              onClick={() => {
                setSuccess(null);
                setEditing(true);
              }}
            >
              Add a referral code
            </LiquidButton>
          )}
          {success === "approved" || course.status === "approved" ? (
            <LiquidButton asChild variant="accent" className="t-button">
            <Link
              href={courseStartHref(course.slug)}
              onClick={close}
            >
              Start the course
            </Link>
            </LiquidButton>
          ) : (
            <LiquidButton
              variant={success === "applied" ? "default" : "accent"} className="t-button"
              onClick={close}
            >
              Done
            </LiquidButton>
          )}
          <LiquidButton asChild className="t-button">
          <Link href="/dashboard" onClick={close}>
            My courses
          </Link>
          </LiquidButton>
        </div>
      ) : !filmmaking ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <LiquidButton variant="accent"
            disabled={busy}
            className="t-button"
            onClick={() =>
              course.status === "waitlisted" ? close() : submit("join")
            }
          >
            {busy
              ? "Saving…"
              : course.status === "waitlisted"
                ? "Keep my place"
                : "Join the waitlist"}
          </LiquidButton>
          {course.status === "waitlisted" && (
            <LiquidButton
              disabled={busy}
              className="t-button"
              onClick={() => submit("leave")}
            >
              {busy ? "Saving…" : "Leave waitlist"}
            </LiquidButton>
          )}
        </div>
      ) : course.status === "applied" && !editing ? (
        <LiquidButton variant="accent" className="t-button mt-6" onClick={() => setEditing(true)}>
          Add a referral code
        </LiquidButton>
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
            if (normalizedCode && !codeValid) {
              setCodeError("Click Validate to check your code before starting, or clear it to submit for review.");
              codeInput.current?.focus();
              return;
            }
            submit("apply", new FormData(event.currentTarget));
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              What company do you work for?
              <input
                name="company"
                defaultValue={draft.company ?? course.application?.company ?? profile?.company}
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
                defaultValue={draft.job_title ?? course.application?.job_title ?? profile?.jobTitle}
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
            What do you hope to create with AI filmmaking after this course?
            <textarea
              name="goals"
              defaultValue={draft.goals ?? course.application?.goals}
              required
              maxLength={4000}
              rows={3}
              className={`${input} resize-y`}
            />
          </label>
          <div className="relative rounded-xl border border-line bg-surface-subtle p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="referral-code"
              className="block min-w-0 text-base font-medium sm:text-lg"
            >
              Have a referral code?{" "}
              <span className="t-meta block font-normal text-ink-muted">
                Optional
              </span>
            </label>
            <LiquidButton type="button" size="sm" variant={codeValid ? "accent" : "default"} className="t-button min-h-11" disabled={busy || validating || !normalizedCode || codeValid} onClick={validateCode}>
              {validating ? "Checking…" : codeValid ? "Validated" : "Validate"}
            </LiquidButton>
            </div>
            <p id="referral-help" className="t-body-sm mt-1 text-ink-secondary">
              Enter your code and click Validate. Then complete the required answers and click Start now.
            </p>
            <input
              id="referral-code"
              name="referral_code"
              ref={codeInput}
              value={referralCode}
              onChange={(event) => {
                ++codeRequest.current;
                setReferralCode(event.target.value);
                setValidatedCode(null);
                setValidating(false);
                setCodeError("");
              }}
              aria-invalid={Boolean(codeError)}
              aria-describedby="referral-help referral-status"
              maxLength={80}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className={`${input} min-h-14 text-lg uppercase tracking-wider`}
              placeholder="Enter your code"
            />
            <p id="referral-status" role={codeError ? "alert" : "status"} className={`t-body-sm mt-3 ${codeError ? "text-danger" : "text-accent"}`}>
              {codeError || (codeValid ? "Code accepted! Complete your answers, then click Start now. No review needed." : "No code? Leave this blank to submit your application for review.")}
            </p>
            {codeValid && celebrate > 0 && <span key={celebrate} aria-hidden="true" className="intake-confetti pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
              {Array.from({ length: 24 }, (_, i) => <i key={i} style={{ left: `${(i * 43) % 100}%`, background: ["var(--accent)", "#02B1E0", "#e8bd54"][i % 3], animationDelay: `${(i % 6) * 55}ms`, "--drift": `${(i % 2 ? 1 : -1) * (20 + i * 2)}px` } as import("react").CSSProperties} />)}
            </span>}
          </div>
          <LiquidButton variant="accent" type="submit" disabled={busy || validating} className="t-button w-full">
            {busy ? codeValid ? "Opening your course…" : "Submitting…" : codeValid ? "Start now" : "Submit application"}
          </LiquidButton>
        </form>
      )}
    </>
  );
}

export function IntakeButton({
  slug,
  className = "",
  size = "lg",
  tone = slug === OPEN_COURSE_SLUG ? "primary" : "secondary",
  withDate = false,
  onClick,
}: {
  slug: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  tone?: "primary" | "secondary" | "onDark";
  withDate?: boolean;
  href?: unknown;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const { snapshot, open } = useContext(Context);
  const pathname = usePathname();
  const status = snapshot?.courses.find((c) => c.slug === slug)?.status;
  const homeApplication = pathname === "/" && slug === OPEN_COURSE_SLUG && !status;
  const label =
    status === "waitlisted"
      ? "You're on the waitlist"
      : status === "approved"
        ? "Open course"
        : status === "applied"
          ? "Application submitted"
          : slug === OPEN_COURSE_SLUG
            ? "Apply to join"
            : "Join the waitlist";
  const blue = status === "waitlisted" || status === "applied";
  const variant = blue || tone === "primary" ? "accent" : tone === "onDark" ? "onDark" : "default";
  const showDate = withDate && status !== "approved" && status !== "applied";
  return (
    <LiquidButton asChild variant={variant} size={size} className={`t-button ${showDate ? "h-auto py-2.5" : ""} ${className}`}>
    <Link
      href={
        status === "approved" ? courseStartHref(slug) : homeApplication ? `/courses/${slug}` : courseIntakeHref(slug)
      }
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          status === "approved" ||
          homeApplication ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        open(slug);
      }}
    >
      <span className="flex flex-col items-center leading-tight">
        <span className="inline-flex items-center gap-1.5">
          {blue && <CheckCircleIcon size={17} aria-hidden="true" />}
          {label}
        </span>
        {showDate && (
          <span className={`t-micro font-semibold ${variant === "default" ? "text-ink-muted" : "opacity-90"}`}>Starts {slug === OPEN_COURSE_SLUG ? OPEN_COURSE_START : WAITLIST_START}</span>
        )}
      </span>
    </Link>
    </LiquidButton>
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
