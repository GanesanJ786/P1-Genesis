"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { contactSchema } from "@/lib/validations";

export type ContactResult = { ok: boolean; error?: string };

/**
 * Internal recipients notified on every contact submission. Kept server-side
 * (this file is "use server") so the dev address isn't shipped in the client
 * bundle. The submission is also persisted to `contact_submissions` and visible
 * in the admin panel, so email is a convenience notification, not the record.
 */
const NOTIFY_EMAILS = [
  "connecting2soft@gmail.com",
  "genesissportsfoundation@gmail.com",
  "gsfcbe15@gmail.com",
];

// Must be an address on a domain verified in Resend (gsfteams.com).
const MAIL_FROM = "Genesis Sports Foundation <noreply@gsfteams.com>";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Best-effort email notification via the Resend HTTP API (works in the
 * Cloudflare Workers runtime — no SMTP). Never throws: if RESEND_API_KEY is
 * unset or the request fails, we log and move on so the submission still
 * succeeds (the DB row is the source of truth).
 */
async function sendContactEmail(data: {
  name: string;
  email: string;
  phone: string | null;
  message: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // email not configured yet

  const rows = [
    ["Name", data.name],
    ["Email", data.email],
    ["Phone", data.phone || "—"],
    ["Message", data.message],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;vertical-align:top">${label}</td>` +
        `<td style="padding:6px 12px;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#111">
      <h2 style="margin:0 0 12px">New enquiry from gsfteams.com</h2>
      <table style="border-collapse:collapse">${rows}</table>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: NOTIFY_EMAILS,
        reply_to: data.email,
        subject: `New enquiry from ${data.name} — Genesis Sports Foundation`,
        html,
      }),
    });
    if (!res.ok) {
      console.error("Resend email failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Resend email error:", err);
  }
}

/**
 * Handles a public contact submission. Validates server-side, persists via the
 * anon client (RLS allows anon INSERT only), then fires a best-effort email
 * notification. When Supabase isn't configured the submission is accepted
 * gracefully so the form still works in preview.
 */
export async function submitContact(
  _prev: ContactResult | null,
  formData: FormData,
): Promise<ContactResult> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const submission = {
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    message: parsed.data.message,
  };

  if (!isSupabaseConfigured) {
    // Preview mode: accept but don't persist.
    return { ok: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_submissions").insert(submission);

  if (error) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // Notify the team (best-effort; does not affect the success response).
  await sendContactEmail(submission);

  return { ok: true };
}
