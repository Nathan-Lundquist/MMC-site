---
date: 2026-10-16
topic: marketing-site-corporate-redesign
---

# Marketing Site Visual Redesign — Corporate / Cutting-Edge Direction

## Summary

Redesign mmc-next's public marketing site (all ~10 pages) from its current minimal, boutique visual language toward a bolder, more corporate, cutting-edge aesthetic — large-format real project photography, oversized confident typography, a minimal top nav, and sharper, higher-contrast styling — while keeping the existing brick-red brand color and page structure intact.

## Problem Frame

mmc-next's marketing site currently uses a minimal, boutique-feeling visual language: soft rounded corners (up to a 2.6x radius scale), a subtle film-grain texture overlay across the whole site, organic gradient divider lines, and gentle card hover-lift animations (see Sources/Research). Nathan wants the site to read as a modern, cutting-edge, large-corporation brand instead. The current aesthetic doesn't signal the scale and credibility Nathan wants a prospective customer to perceive on first visit — a judgment call made directly by Nathan as the business owner, not backed by customer research or competitor benchmarking (see Key Decisions).

## Key Decisions

- **Keep the brick-red brand color.** None of the three reference sites Nathan provided use red (they use blue, teal, and warm amber respectively), but preserving red keeps brand recognition for an established local business. The corporate/cutting-edge feel comes from typography, photography treatment, and structural patterns — not a palette swap.
- **Redesign all marketing pages together, not phased.** Avoids a visually inconsistent site mid-rollout where some pages look new and others look old.
- **Remove the current signature "boutique" details.** The film-grain overlay, generous corner rounding, and organic divider styling directly conflict with the corporate/cutting-edge target and are being retired, not layered under new content.
- **Use existing project photography, not new shoots.** The curated project-photo library (`public/images/site/`) has 16 real project photos, 13 of them at full-bleed-ready resolution (~1600-1920px wide); the other 3 are lower-resolution and excluded from full-bleed use (see Dependencies / Assumptions). This keeps the redesign a presentation-layer change rather than requiring new asset production, with the tradeoff that some pages will reuse the same photo.
- **Reference sites were chosen for structural patterns, not industry fit.** All three (a roofing lead-gen template, a biotech SaaS company, a short-term rental platform) are outside landscaping/home-services, and no in-vertical competitor sites were reviewed as alternatives. This is a deliberate, unvalidated bet that those patterns read as credible once combined with mmc-next's existing brand — accepted as reasonable risk for a visual refresh, not a reason to pause and benchmark competitors first.

## Requirements

**Visual direction**

- R1. The homepage and every other marketing page (about, blog, careers, contact, portfolio, quote, resources, services, testimonials) adopt a new, shared visual language that reads as corporate and cutting-edge rather than the current minimal/boutique aesthetic.
- R2. The existing brick-red brand color (the `--brand` / `--accent` tokens in `src/app/globals.css`) remains the primary accent color across the redesigned site.
- R3. Hero and other key imagery sections use large-format photography — either full-bleed or a large bounded panel placed beside the headline — rather than the current small, boxed/card-style imagery, drawn from the existing project photo library (`public/images/site/`). Lead-generation pages (quote, contact) use a reduced-height hero so the form stays prominent, rather than the full treatment used on other pages.
- R4. Headline typography shifts to a noticeably larger, bolder, more confident scale than the current treatment.
- R5. The current film-grain texture overlay (`body::before` in `src/app/globals.css`), the generous corner-rounding scale (`--radius` and its `-xl`/`-2xl`/`-3xl`/`-4xl` derivatives), and the organic divider styling (`.divider-organic`) are removed or substantially reduced in favor of sharper, higher-contrast treatment.

**Structural patterns** (drawn from the three reference sites, in service of the credibility/scale goal from the Problem Frame)

- R6. The header/nav stays minimal — a thin bar with few primary links — rather than growing denser.
- R7. Primary calls-to-action use a paired filled + outline button pattern (one solid, one outline, side by side), matching the pattern seen in two of the three reference sites (roofpro, rently).

**Accessibility & responsiveness**

- R8. Headline and CTA text placed over photography meets at least WCAG AA contrast (4.5:1 for normal text, 3:1 for large text), regardless of which hero treatment (dark-overlay or light-panel) planning selects.
- R9. The redesign works across mobile, tablet, and desktop — including a defined nav-collapse pattern, hero image cropping behavior, and typography scaling for small screens.
- R10. Any change to the existing motion/animation treatment preserves the current `prefers-reduced-motion` support.

**Rollout & assets**

- R11. All marketing pages are redesigned and shipped together in a single rollout, not phased page-by-page.
- R12. No new photography is commissioned or purchased for this redesign — the existing project photo library is the asset base.
- R13. Page copy/content and the site's information architecture (which pages exist, what each page covers) are unchanged by this redesign — only the visual presentation layer changes.

## Acceptance Examples

- AE1. Given the homepage hero uses a large-format project photo with bold headline text (R3, R4), when compared against the current hero, then the film-grain overlay (R5) and the current boxed/card-style hero imagery (R3) are no longer present.
- AE2. Given an interior content page that previously used heavily rounded cards (e.g. using `--radius-xl`/`-2xl`/`-3xl`/`-4xl`, up to ~1.95rem), when the redesign is applied (R5), then those elements use noticeably sharper corners consistent with the new direction.
- AE3. Given the existing brand red accent value, when the redesign ships (R2), then primary CTAs and key accents still use that red — not a new palette color.

## Success Criteria

- Nathan judges the redesigned site as comparably "corporate/cutting-edge" to the three reference sites, side-by-side.
- Mike's Clean Cut remains recognizable as the same brand (red accent, name, and logo retained).
- All ~10 marketing pages ship the new visual language together in one rollout, not a partial or visually inconsistent set.
- This is an aesthetic/positioning bet made without prior customer validation (see Key Decisions) — success is judged by Nathan's own assessment post-launch, not a measured conversion or analytics target.

## Scope Boundaries

**Deferred for later**

- The portal/app navigation redesign ("SIEM-style" top tabs, fewer sections) — a separate brainstorm, to be picked up after this one.
- A professional photography refresh, if the existing library proves insufficient once real page layouts are built against it — a real possibility given only 13 usable photos across ~10 pages (see Dependencies / Assumptions).
- The hero trust-signal badge (real rating + review count): dropped from this round. No real, non-fabricated rating data source (e.g. a live Google Business Profile integration) is available yet — `src/data/testimonials.ts` is local, fabricated 5-star content and was explicitly ruled out as a source. Revisit once real rating data is available.

**Outside this redesign's identity**

- Changing the brand color palette.
- Rewriting page copy, messaging, or the site's information architecture.

## Dependencies / Assumptions

- The project-photo library is `public/images/site/`, which has exactly 16 files (not the ~79 originally assumed — that figure wrongly included the ~63 unrelated legacy/stock/icon/logo files that live directly under the parent `public/images/` folder, which are not part of this library and are not used by this redesign). Of the 16: 13 are ~1600-1920px wide and usable for full-bleed hero/section treatment; 3 (`blue-stone.jpg` at 427x640, `fire-pit.jpg` at 640x428, `outdoor-kitchen.jpg` at 640x480) are well under full-bleed resolution and should be used only in smaller, bounded treatments, if at all. With 13 usable photos across ~10 pages, some repetition across pages is expected, and composition suitability (crop-safety for text overlay, aspect ratio) has not been checked beyond resolution — planning should confirm per-page before full-bleed layouts are built.
- Assumes the current stack (Tailwind CSS v4, shadcn/ui, Framer Motion) stays in place. This brainstorm does not mandate a new library; planning decides whether the existing Framer Motion effects (`float`, `fade-in`, `.card-hover` lift) are kept, toned down, or replaced as part of achieving the new visual direction, subject to R10's reduced-motion requirement.

## Outstanding Questions

**Deferred to Planning**

- Whether hero sections use a dark-overlay treatment over full-bleed photography (as in two of the three references — trilobio, rently) or a large bounded photo panel beside the headline with no overlay, on a light background (as in the third reference — roofpro) — a design-execution choice, not a product-scope one, constrained by R8's contrast requirement either way.
- The exact new typography scale, font pairing (keep the existing `--font-display`/`--font-body` or introduce a new type family), and corner-radius values.
- Whether the existing Framer Motion animation style is kept, toned down, or replaced (subject to R10).
- Interaction states (hover/focus/active/disabled) for the new paired-CTA button pattern (R7).

## Sources / Research

- Reference sites reviewed via live screenshot (2026-10-16):
  - `https://roofpro-template.webflow.io/` — light theme, blue accent, bold black headline, large bounded hero photo (text panel + image panel side-by-side, not full-bleed), paired filled+outline CTA buttons, floating review-avatar badge. Note: this is a generic, mass-distributed Webflow template, not an operating company's site — treated as a baseline pattern to adapt, not copy directly.
  - `https://www.trilo.bio/` — dark theme, teal accent, full-bleed hero video, minimal nav, oversized white headline. No paired CTA pattern (single buttons in nav and hero) and no trust-signal badge.
  - `https://rently.framer.website/` — dark theme, warm-amber accent, full-bleed hero photography, paired filled+outline CTA buttons, floating review-avatar badge.
  - Common pattern across all three: oversized bold headline typography, minimal thin nav, large-format hero photography (full-bleed in two of three — trilobio, rently), sharper corners than mmc-next's current styling. Two of three (roofpro, rently) also share the paired filled+outline CTA pattern and the floating review-avatar badge.
- Current brand tokens: `src/app/globals.css` — brick-red brand/accent (`oklch(0.464 0.161 26.2)`), generous border radius (`--radius: 0.75rem`, scaling up to 2.6x for `--radius-4xl`), film-grain `body::before` overlay, `.divider-organic` gradient line, `.card-hover` lift-on-hover treatment.
- Current marketing page list: `src/app/(marketing)/` — homepage, about, blog, careers, contact, portfolio, quote, resources, services, testimonials, sharing one `layout.tsx` with `Header`, `Footer`, `BackToTop`.
- Existing project photography: `public/images/site/` — 16 real project photos (patios, pools, fire pits, outdoor kitchens, lighting, hardscape); 13 verified at ~1600-1920px wide, 3 verified under 650px wide (see Dependencies / Assumptions). The parent `public/images/` folder has ~63 additional files (legacy/stock/icon/logo assets) that are explicitly not part of this library.
