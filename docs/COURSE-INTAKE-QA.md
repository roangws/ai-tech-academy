# Course intake verification, September 12, 2026

Implemented authenticated course waitlists, filmmaking applications, referral-code approval, and an admin approval queue. Existing filmmaking enrollments retain access. Upcoming courses show October consistently in the new controls and account cards.

## Verification

- ESLint, TypeScript, and the production build pass.
- Database regression tests run against the production schema inside transactions that roll back all fixtures and writes. The suite covers join/leave, duplicate requests, independent course waitlists, required answers, oversized answers, invalid codes, pending applications, case-insensitive MASTERCLASS approval, enrollment creation, preserving approval on resubmission, private records, anonymous content denial, direct-write denial, admin approval, and rejection of non-admin approval.
- The live signed-in waitlist flow was exercised through joining, viewing the blue dashboard state, reopening its dialog, and leaving. The user's original waitlist state was restored.
- Local browser checks verified the sign-in destination retains the course and intake intent, required form fields prevent submission, session-expiry errors retain answers, and those answers survive refresh. These application component checks used a temporary visual fixture that was removed before deployment; no application was submitted using the user's identity.
- Screenshots were reviewed for the public login prompt, live waitlist confirmation and removal dialog, dashboard, and the application form. The application was also rendered inside a 390px viewport fixture to check label wrapping, field sizing, the referral section, and the submit button.
- Screenshot review prompted larger application labels, removal of a duplicate in-progress course card, clearer unlocked-course copy, and keeping the add-code action available immediately after submitting without a code.

## Operations

### CTA restoration

Roan requested restoration of the original CTA design. Course intake controls now use the unchanged LiquidButton component, with the original tone defaults, sizes, glass layers, and two-line date typography. Dialog controls use the same component. Joined waitlists keep the blue state and the existing join/leave behavior. AGENTS.md records that functional changes never authorize a CTA redesign.

The signed-in website header now has a direct My learning button. Unlocked courses are separate from applications and waitlists on the account page. The dashboard's existing featured course card now also appears for an unlocked course with no completed lessons.

## Backend operations

- Migration: `supabase/migrations/20260912200000_course_intakes.sql`.
- Reusable SQL tests: `supabase/tests/course_intakes.sql`. Run as the database owner against a seeded academy schema with an admin. The script rolls back its changes.
- Pending filmmaking applications appear at `/admin/applications`. Approval grants course access and creates an enrollment in one transaction.
- The referral code is validated in Postgres. A browser cannot grant itself approval by writing a status directly.
- Draft answers are stored per user in the current browser tab for up to 30 minutes and removed after successful submission.
- No outbound email delivery was exercised or added in this change. Existing account verification remains in place.
