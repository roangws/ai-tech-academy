import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { isValidCourseReferral } from "../src/lib/referral-validation.ts";
import { passwordConfirmationError } from "../src/lib/password-confirmation.ts";

for (const code of ["MASTERCLASS", "masterclass", " MasterClass "]) assert.equal(isValidCourseReferral(code), true);
for (const code of ["", " ", "MASTERCLASS1", "MASTER CLASS", null, 12, {}, " ".repeat(80) + "MASTERCLASS"]) assert.equal(isValidCourseReferral(code), false);
assert.equal(passwordConfirmationError("sample-password", "sample-password"), null);
for (const confirmation of ["", null, undefined, {}, "sample-Password", "sample-password "]) assert.ok(passwordConfirmationError("sample-password", confirmation));
const sql = readFileSync(new URL("../supabase/migrations/20260912200000_course_intakes.sql", import.meta.url), "utf8");
assert.match(sql, /code <> 'MASTERCLASS'/, "The preflight and database must accept the same code");
const intake = readFileSync(new URL("../src/components/course/intake-provider.tsx", import.meta.url), "utf8");
assert.equal((intake.match(/\n\s+required\n/g) ?? []).length, 4);
assert.doesNotMatch(intake, /workshop/i);
assert.match(intake, /profile\?\.company/);
assert.match(intake, /<LiquidButton asChild variant=\{variant\}/);
assert.equal(existsSync(new URL("../src/app/qa-course-flow/page.tsx", import.meta.url)), false, "Never deploy the local visual fixture");
console.log("PASS: referral normalization/rejection, password confirmation, database code parity, required course fields, saved company, and original CTA component.");
