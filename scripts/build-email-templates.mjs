/**
 * Builds the six auth email templates into supabase/templates/.
 *
 *   node scripts/build-email-templates.mjs
 *
 * ------------------------------------------------------------- why generated
 *
 * Every one of these is the same card: eyebrow, heading, a paragraph or two, a
 * button, a plain-text fallback link, a footer. Hand-written they would be six
 * copies of one shell, and the copy that gets forgotten is the one somebody
 * reads at the worst moment, when they are locked out. So the shell is here
 * once and the six files are output.
 *
 * The files are committed rather than gitignored, because the deployed project
 * reads its templates from the dashboard and somebody has to paste them. A
 * build output nobody can see is no use when the thing you need is text to copy.
 * Run this after editing the shell, and re-paste whatever changed.
 *
 * ----------------------------------------------------------------- the links
 *
 * Not `{{ .ConfirmationURL }}`. That goes through gusexlvelgmgnecvytxf.supabase.co
 * and lands the reader on a project ref in the one email we most need them to
 * trust. It also comes back as a PKCE `?code=`, and @supabase/ssr keeps the
 * verifier in a cookie, so signing up on a laptop and opening the mail on a
 * phone fails with nothing on screen to explain it.
 *
 * Instead every link is built from `token_hash`, which `verifyOtp` checks
 * server-side with no cookie involved, pointed at this site's own
 * /auth/confirm. Different device works.
 *
 * `{{ .RedirectTo }}` is the URL the app passed as `emailRedirectTo`, already
 * carrying its own `?next=`, so the token is appended with `&`. It is empty for
 * anything sent without one, an invite issued from the dashboard being the case
 * that will actually happen, and the `{{ if }}` falls back to `{{ .SiteURL }}`
 * so those links work too rather than rendering a bare `&token_hash=`.
 *
 * ------------------------------------------------------------------ the HTML
 *
 * Tables and inline styles, because this is email. Outlook renders through
 * Word: no flexbox, no grid, no `<style>` block worth relying on. Colours are
 * the site's tokens from globals.css, hardcoded because there are no custom
 * properties here either. The font stack is system faces, since Inter does not
 * load in a mail client and asking for it only picks a fallback we did not
 * choose.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "templates");

/* globals.css, light theme. */
const INK = "#101820";
const INK_SECONDARY = "#3d4f60";
const INK_MUTED = "#5c6e7f";
const SURFACE = "#ffffff";
const LINE = "#d8e1e8";
const ACCENT = "#0a3fe0";
const PAGE = "#f4f7f9";

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/**
 * The link, both branches of it.
 *
 * `type` is the EmailOtpType /auth/confirm hands to verifyOtp. It has to match
 * the template it is written into: a `recovery` token presented as `signup` is
 * rejected, and the reader gets the dead-link screen for a link that was fine.
 */
const link = (type) =>
  `{{ if .RedirectTo }}{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=${type}` +
  `{{ else }}{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}{{ end }}`;

const p = (text, { size = 16, line = 26, color = INK_SECONDARY, top = 0 } = {}) =>
  `<p style="margin:${top === 0 ? "0" : `${top}px`} 0 0 0;font-size:${size}px;line-height:${line}px;color:${color};">${text}</p>`;

/**
 * One message.
 *
 * `blocks` is the middle of the card. Everything around it is fixed, so a new
 * template is a heading, some paragraphs and a button, and cannot accidentally
 * be a different email.
 */
function shell({ heading, blocks }) {
  return `<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAGE};margin:0;padding:32px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:${SURFACE};border:1px solid ${LINE};border-radius:12px;">

        <tr>
          <td style="padding:32px 32px 0 32px;font-family:${FONT};">
            <p style="margin:0;font-size:13px;line-height:20px;letter-spacing:0.02em;text-transform:uppercase;color:${INK_MUTED};font-weight:600;">AI Tech Education Academy</p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px 0 32px;font-family:${FONT};">
            <h1 style="margin:0;font-size:26px;line-height:33px;font-weight:700;color:${INK};letter-spacing:-0.02em;">${heading}</h1>
          </td>
        </tr>

${blocks}

      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
        <tr>
          <td align="center" style="padding:20px 32px 0 32px;font-family:${FONT};">
            <p style="margin:0;font-size:12px;line-height:20px;color:${INK_MUTED};">AI Tech Education Academy. Free courses by Roan Weigert.</p>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>
`;
}

const prose = (html, { pad = "16px 32px 0 32px" } = {}) =>
  `        <tr>
          <td style="padding:${pad};font-family:${FONT};">
${html
  .split("\n")
  .map((l) => `            ${l}`)
  .join("\n")}
          </td>
        </tr>
`;

/*
  32px below as well as 28 above, because what follows the button is not always
  the same thing. In three of these it is another paragraph and in two it is the
  footer rule, and with no bottom padding that rule drew hard against the button
  in exactly those two. Owning the space on the button rather than on whatever
  comes next means a new template cannot reintroduce it: anything after a button
  opens at `0` on top and gets the same gap.
*/
const button = (label, href) =>
  `        <tr>
          <td style="padding:28px 32px 32px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background:${ACCENT};border-radius:8px;">
                  <a href="${href}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;">${label}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
`;

/**
 * The footer every link email ends with.
 *
 * The pasteable URL is not optional politeness. Corporate mail clients strip
 * buttons, and a reader whose button does nothing has no other way through.
 *
 * `expiry` is stated because a link that silently stopped working reads as a
 * broken site rather than an expired token. One hour is `otp_expiry = 3600`
 * in supabase/config.toml; change one and change the other.
 */
const linkFooter = (href, closing) =>
  `        <tr>
          <td style="padding:28px 32px 32px 32px;font-family:${FONT};border-top:1px solid ${LINE};">
            <p style="margin:0;font-size:13px;line-height:21px;color:${INK_MUTED};">If the button does not work, paste this into your browser:</p>
            <p style="margin:8px 0 0 0;font-size:13px;line-height:21px;word-break:break-all;"><a href="${href}" style="color:${ACCENT};text-decoration:underline;">${href}</a></p>
            <p style="margin:20px 0 0 0;font-size:13px;line-height:21px;color:${INK_MUTED};">The link is good for one hour and can be used once. ${closing}</p>
          </td>
        </tr>
`;

const TEMPLATES = [
  {
    file: "confirm-signup.html",
    subject: "Confirm your email and open your account",
    dashboard: "Confirm signup",
    build() {
      const href = link("signup");
      return shell({
        heading: "{{ if .Data.first_name }}Welcome, {{ .Data.first_name }}.{{ else }}Welcome.{{ end }}",
        blocks:
          prose(
            p(
              "Confirm this address and your account is open. It opens every module after the first, in every one of the five courses, and it stays free.",
            ),
          ) +
          button("Confirm your email address", href) +
          prose(
            p(
              "After that, pick a course and start module 1. You write a brief and record a baseline in the first module, and every module after it builds on that one piece of your own work.",
              { size: 15, line: 25 },
            ),
            { pad: "0 32px 32px 32px" },
          ) +
          linkFooter(href, "If you did not create this account, ignore this message and nothing further happens."),
      });
    },
  },

  {
    file: "invite.html",
    subject: "You have been invited to AI Tech Education Academy",
    dashboard: "Invite user",
    build() {
      const href = link("invite");
      return shell({
        heading: "You have been invited.",
        blocks:
          prose(
            p(
              "Somebody at AI Tech Education Academy has set up an account for {{ .Email }}. Accept it and you can pick a password and start straight away.",
            ),
          ) +
          button("Accept the invitation", href) +
          prose(
            p(
              "Five role-based courses, 52 modules in total. You build an AI workflow on your own data, deploy it, and measure the result.",
              { size: 15, line: 25 },
            ),
            { pad: "0 32px 32px 32px" },
          ) +
          linkFooter(href, "If you were not expecting this, ignore it and no account is opened."),
      });
    },
  },

  {
    file: "magic-link.html",
    subject: "Your sign-in link",
    dashboard: "Magic Link",
    build() {
      const href = link("magiclink");
      return shell({
        heading: "Your sign-in link.",
        blocks:
          prose(p("Click below and you are signed in as {{ .Email }}. No password needed.")) +
          button("Sign in", href) +
          prose(
            p(
              `Or enter this code if you were asked for one: <strong style="color:${INK};letter-spacing:0.08em;">{{ .Token }}</strong>`,
              { size: 15, line: 25 },
            ),
            { pad: "0 32px 32px 32px" },
          ) +
          linkFooter(
            href,
            "If you did not ask to sign in, ignore this message. Nobody can use it without this inbox.",
          ),
      });
    },
  },

  {
    file: "change-email.html",
    subject: "Confirm your new email address",
    dashboard: "Change Email Address",
    build() {
      const href = link("email_change");
      return shell({
        heading: "Confirm the change.",
        blocks:
          prose(
            p(
              "Your account is moving from {{ .Email }} to {{ .NewEmail }}. Confirming here is one half of that, and the same request goes to the other address.",
            ),
          ) +
          button("Confirm this address", href) +
          linkFooter(
            href,
            "If you did not ask to change your email, ignore this and the address on your account stays as it is.",
          ),
      });
    },
  },

  {
    file: "reset-password.html",
    subject: "Set a new password",
    dashboard: "Reset Password",
    warning:
      "DO NOT PASTE THIS ONE YET. The mail sends and the token verifies, but\n" +
      "  /auth/confirm has nowhere to put a `recovery` reader: it exchanges the token,\n" +
      "  which signs them in, and redirects to /dashboard. So the button says \"Choose a\n" +
      "  new password\" and delivers a dashboard, which is worse than the sign-in form\n" +
      "  saying recovery is not open yet, because it reads as a site that lost the\n" +
      "  request. This template goes live with the screen that sets the password, not\n" +
      "  before it.",
    build() {
      const href = link("recovery");
      return shell({
        heading: "Set a new password.",
        blocks:
          prose(p("Somebody asked to reset the password on {{ .Email }}. If that was you, carry on below.")) +
          button("Choose a new password", href) +
          linkFooter(
            href,
            "If it was not you, ignore this message. Your current password keeps working and nothing has changed.",
          ),
      });
    },
  },

  {
    /*
      The one without a link. Reauthentication asks somebody who is already
      signed in to prove it before a sensitive change, so there is nothing to
      navigate to: the code goes back into the page they are already on.
    */
    file: "reauthentication.html",
    subject: "Your confirmation code",
    dashboard: "Reauthentication",
    build() {
      return shell({
        heading: "Your confirmation code.",
        blocks:
          prose(p("Enter this code on the page you were on to confirm it is you.")) +
          prose(
            `<p style="margin:0;font-size:32px;line-height:40px;font-weight:700;letter-spacing:0.12em;color:${INK};">{{ .Token }}</p>`,
            { pad: "24px 32px 0 32px" },
          ) +
          prose(
            p("The code is good for one hour. If you did not ask for it, ignore this message.", {
              size: 13,
              line: 21,
              color: INK_MUTED,
            }),
            /* 24px on top, not the `0` the blocks after a button use. What is
               above this one is the code itself, which owns no space below it. */
            { pad: "24px 32px 32px 32px" },
          ),
      });
    },
  },
];

mkdirSync(OUT, { recursive: true });

const header = (t) => `<!--
  ${t.dashboard}. Subject: ${t.subject}
${t.warning ? `\n  ${t.warning}\n` : ""}
  GENERATED by scripts/build-email-templates.mjs. Edit that, not this, then run
  it and paste the result into the dashboard at Authentication > Emails >
  ${t.dashboard}. The deployed project reads templates from there, not from this
  repository, so a change here reaches nobody until it is pasted.
-->
`;

for (const t of TEMPLATES) {
  writeFileSync(join(OUT, t.file), header(t) + t.build());
  console.log(`${t.file.padEnd(26)} ${t.dashboard} — "${t.subject}"`);
}

console.log(`\n${TEMPLATES.length} templates written to supabase/templates/`);
