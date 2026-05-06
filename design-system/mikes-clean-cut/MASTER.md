# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Mikes Clean Cut
**Generated:** 2026-04-01 14:54:21
**Category:** Landscaping & Hardscaping Services

---

## Global Rules

### Color Palette

| Role | Hex | OKLCH | CSS Variable |
|------|-----|-------|--------------|
| Brand/CTA | `#a02323` | `oklch(0.464 0.161 26.2)` | `--brand` / `--accent` |
| Primary (dark) | `#1a1a1a` | `oklch(0.13 0 0)` | `--primary` |
| Background | `#f5f5f5` | `oklch(0.975 0 0)` | `--background` |
| Card | `#ffffff` | `oklch(1 0 0)` | `--card` |
| Secondary | `#ebebeb` | `oklch(0.95 0 0)` | `--secondary` |
| Muted text | `#666666` | `oklch(0.42 0 0)` | `--muted-foreground` |
| Border | `#e0e0e0` | `oklch(0.91 0 0)` | `--border` |

**Color Notes:** Deep brick red brand + near-black primary + neutral grey scale. Red conveys authority and craftsmanship without being aggressive.

### Typography

- **Heading Font:** Poppins
- **Body Font:** Open Sans
- **Mood:** modern, professional, clean, corporate, friendly, approachable
- **Google Fonts:** [Poppins + Open Sans](https://fonts.google.com/share?selection.family=Open+Sans:wght@300;400;500;600;700|Poppins:wght@400;500;600;700)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Components

All UI primitives use **shadcn/ui** (Radix Nova) installed via CLI.
Colors reference CSS variables — never hardcode hex in components.

| Component | Import | Notes |
|-----------|--------|-------|
| Button | `@/components/ui/button` | `default` = brand red, `outline`, `outline-brand`, `ghost`, `link` |
| Input | `@/components/ui/input` | h-11, rounded-lg, focus ring = brand |
| Textarea | `@/components/ui/textarea` | min-h-120px, resizable |
| Label | `@/components/ui/label` | Always pair with Input |
| Badge | `@/components/ui/badge` | cva variants |
| Dialog | `@/components/ui/dialog` | Radix — requires DialogTitle + DialogDescription |
| Card | `@/components/ui/card` | Compound: Card, CardHeader, CardTitle, CardContent, CardFooter |
| Accordion | `@/components/ui/accordion` | For FAQ sections |
| Select | `@/components/ui/select` | For form dropdowns |
| Sheet | `@/components/ui/sheet` | Side panels / mobile drawers |
| Separator | `@/components/ui/separator` | Dividers |

---

## Style Guidelines

**Style:** Trust & Authority

**Keywords:** Certificates/badges displayed, expert credentials, case studies with metrics, before/after comparisons, industry recognition, security badges

**Best For:** Healthcare/medical landing pages, financial services, enterprise software, premium/luxury products, legal services

**Key Effects:** Badge hover effects, metric pulse animations, certificate carousel, smooth stat reveal

### Page Pattern

**Pattern Name:** Minimal Single Column

- **Conversion Strategy:** Single CTA focus. Large typography. Lots of whitespace. No nav clutter. Mobile-first.
- **CTA Placement:** Center, large CTA button
- **Section Order:** 1. Hero headline, 2. Short description, 3. Benefit bullets (3 max), 4. CTA, 5. Footer

---

## Anti-Patterns (Do NOT Use)

- ❌ Playful design
- ❌ Hidden credentials
- ❌ AI purple/pink gradients

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
