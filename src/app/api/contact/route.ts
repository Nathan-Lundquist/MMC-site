import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";

const RATE_LIMIT_WINDOW = 900_000; // 15 minutes
const RATE_LIMIT_MAX = 3;

const rateLimitMap = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const now = Date.now();

  const timestamps = (rateLimitMap.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW,
  );
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { success: false, error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  let input: Record<string, string>;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const errors: Record<string, string> = {};
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim();
  const phone = (input.phone ?? "").trim();
  const subject = (input.subject ?? "").trim();
  const message = (input.message ?? "").trim();

  if (!name || name.length > 200) errors.name = "Name is required.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "A valid email is required.";
  if (phone && phone.length > 30) errors.phone = "Phone must be under 30 characters.";
  if (!subject || subject.length > 200) errors.subject = "Subject is required.";
  if (!message || message.length > 5000)
    errors.message = "Message is required (max 5000 characters).";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ success: false, errors }, { status: 422 });
  }

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const phoneDisplay = phone ? esc(phone) : "<em>Not provided</em>";
  const messageHtml = esc(message).replace(/\n/g, "<br>");

  const html = `
<h2>New Contact Form Submission</h2>
<table style="border-collapse:collapse;width:100%;max-width:600px;">
<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(name)}</td></tr>
<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${phoneDisplay}</td></tr>
<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Subject</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(subject)}</td></tr>
<tr><td style="padding:8px;font-weight:bold;vertical-align:top;">Message</td><td style="padding:8px;">${messageHtml}</td></tr>
</table>`;

  try {
    await sendMail({
      to: "office@mikescleancut.com",
      replyTo: email,
      subject: `Contact Form: ${name.slice(0, 60)} — ${subject.slice(0, 60)}`,
      html,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong. Please try again or call us at (248) 879-4504.",
      },
      { status: 500 },
    );
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  return NextResponse.json({ success: true });
}
