import { NextRequest, NextResponse } from "next/server";

// TEMPORARY diagnostic — guarded by LIVE_WEBHOOK_SECRET. Reports whether the
// Worker sees RESEND_API_KEY at runtime and whether a send from inside the
// Worker succeeds. Delete this route once email is confirmed working.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!process.env.LIVE_WEBHOOK_SECRET || secret !== process.env.LIVE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.RESEND_API_KEY;
  const result: Record<string, unknown> = {
    hasResendKey: Boolean(key),
    keyPrefix: key ? key.slice(0, 6) : null,
    runtime_env_keys_present: {
      LIVE_WEBHOOK_SECRET: Boolean(process.env.LIVE_WEBHOOK_SECRET),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
    },
  };

  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Genesis Sports Foundation <noreply@gsfcbe.com>",
          to: ["connecting2soft@gmail.com"],
          subject: "Worker runtime email diagnostic",
          html: "<p>Sent from the Worker runtime via the debug route.</p>",
        }),
      });
      result.resendStatus = res.status;
      result.resendBody = await res.text();
    } catch (e) {
      result.resendError = String(e);
    }
  }

  return NextResponse.json(result);
}
