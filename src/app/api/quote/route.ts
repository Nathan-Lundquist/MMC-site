import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";

const RATE_LIMIT_WINDOW = 900_000; // 15 minutes
const RATE_LIMIT_MAX = 3;

const rateLimitMap = new Map<string, number[]>();

const VALID_SERVICES = [
  "turf-management",
  "landscape-design",
  "hardscape-installation",
  "outdoor-lighting",
  "pool-spa",
  "forestry",
  "irrigation",
  "snow-plowing",
  "other",
];

const SERVICE_LABELS: Record<string, string> = {
  "turf-management": "Turf Management",
  "landscape-design": "Landscape Design",
  "hardscape-installation": "Hardscape Installation",
  "outdoor-lighting": "Outdoor Lighting",
  "pool-spa": "Pool & Spa",
  "forestry": "Forestry",
  "irrigation": "Irrigation",
  "snow-plowing": "Snow Plowing",
  "other": "Other",
};

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
  const firstName = (input.firstName ?? "").trim();
  const lastName = (input.lastName ?? "").trim();
  const email = (input.email ?? "").trim();
  const phone = (input.phone ?? "").trim();
  const address = (input.address ?? "").trim();
  const serviceType = (input.serviceType ?? "").trim();
  const description = (input.description ?? "").trim();
  const contactMethod = (input.contactMethod ?? "").trim();

  if (!firstName || firstName.length > 100) errors.firstName = "First name is required.";
  if (!lastName || lastName.length > 100) errors.lastName = "Last name is required.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "A valid email is required.";
  if (!phone || phone.length > 30) errors.phone = "Phone is required.";
  if (!address || address.length > 500) errors.address = "Property address is required.";
  if (!serviceType || !VALID_SERVICES.includes(serviceType))
    errors.serviceType = "Please select a valid service.";
  if (!description || description.length > 5000)
    errors.description = "Project description is required (max 5000 characters).";
  if (!contactMethod || !["phone", "email", "text"].includes(contactMethod))
    errors.contactMethod = "Please select a contact method.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ success: false, errors }, { status: 422 });
  }

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const descriptionHtml = esc(description).replace(/\n/g, "<br>");
  const fullName = `${firstName} ${lastName}`;
  const serviceLabel = SERVICE_LABELS[serviceType] ?? serviceType;

  const html = `
<h2>New Quote Request</h2>
<table style="border-collapse:collapse;width:100%;max-width:600px;">
<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(fullName)}</td></tr>
<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(phone)}</td></tr>
<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Property Address</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(address)}</td></tr>
<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Service</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(serviceLabel)}</td></tr>
<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Preferred Contact</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(contactMethod.charAt(0).toUpperCase() + contactMethod.slice(1))}</td></tr>
<tr><td style="padding:8px;font-weight:bold;vertical-align:top;">Description</td><td style="padding:8px;">${descriptionHtml}</td></tr>
</table>`;

  try {
    await sendMail({
      to: "office@mikescleancut.com",
      replyTo: email,
      subject: `Quote Request: ${fullName.slice(0, 60)} — ${serviceLabel}`,
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
