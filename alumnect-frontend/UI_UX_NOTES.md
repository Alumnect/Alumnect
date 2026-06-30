# AlumNect — UI/UX Design Notes

> Living notes for the AlumNect web front-end. Branch: **`feature/premium-ui-ux`**.
> Stack: Vite + React 19 + TypeScript, **Tailwind CSS v4** (CSS-first `@theme`),
> **Framer Motion**, React Router v6, lucide-react. Architecture follows
> `FRONTEND_STRUCTURE.md` (enterprise feature-based).

## 1. Design direction

A **warm, soft, human community** that still feels **premium** — not a cold "techy/AI"
dark dashboard. Think pillowy white cards on a warm ivory canvas, friendly pastel
accents, rounded shapes, gentle shadows, and rich-but-tasteful micro-interactions.

- Light, warm **cream** background with subtle pastel radial washes (fixed).
- Pastel accent families: **periwinkle/lavender (brand)**, **violet**, **coral/peach**,
  **mint**, **sky**, **honey/gold** (alumni prestige).
- Warm **plum** ink for text (not pure black/grey).
- Soft, warm shadows; large radii (cards `rounded-3xl`).

## 2. Design tokens (`src/index.css`, Tailwind v4 `@theme`)

- Colors: `brand-*`, `violet-*`, `coral-*`, `mint-*`, `sky-*`, `aqua-*`, `gold-*`,
  `plum-*` (text), `cream-*` (surfaces). The legacy **`ink-*` scale is intentionally
  LIGHT** so any `bg-ink-*` resolves to warm cream.
- Fonts: `Sora` (display), `Plus Jakarta Sans` (body) — warm & rounded.
- Shadows: `--shadow-soft`, `--shadow-card`, `--shadow-glow`, `--shadow-glow-gold`.
- Composite utilities: `.text-gradient(-cool/-anim)`, `.glass`, `.glass-strong`,
  `.card-surface`, `.ring-gradient`, `.bg-grid`, `.bg-dots`, `.shimmer`, `.spotlight`,
  `.aurora-blob`, `.hover-lift`, `.press`, `.sheen`, `.underline-grow`.
- Animations (auto `animate-*`): `float`, `bob`, `breathe`, `aurora`, `gradient`,
  `shimmer`, `marquee(-rev)`, `pulse-glow`, `blob`, `rise`, `twinkle`, `sheen`, `pop`.
- Respects `prefers-reduced-motion`.

## 3. Effects & interactions

- **Scroll reveals** (`Reveal`, `Stagger`) on virtually every section.
- **Parallax**: `Parallax` (scroll-linked) + `ParallaxLayer`; hero visual + floating
  cards also react to the **cursor** (`useMousePosition`, depth-varied).
- **Marquees** (trusted-by logos, testimonials), pause on hover.
- **Animated counters** (`Counter`) for stats/KPIs.
- **TiltCard** (3D tilt + spotlight) and **Magnetic** buttons.
- **Sheen** sweep + **press** on buttons; **hover-lift** on cards.
- **Page transitions**: keyed fade/slide on route change in the app & admin shells;
  `ScrollProgress` bar on marketing.
- **Removed:** the global cursor-follow page glow (felt heavy on content pages).
  Per-element spotlight/tilt/magnetic interactions are kept.

## 4. Structure & routes

```
src/
  components/{ui, motion, layout, viz}   # shared, stateless
  features/{marketing, auth}             # feature modules (barrel index.ts)
  hooks/useMousePosition.ts
  lib/{utils, constants}                 # cn/format helpers + mock data
  pages/{LandingPage, auth/*, app/*, admin/*, NotFoundPage}
```

Routes (`src/App.tsx`):

- `/` — marketing landing (Hero · TrustBar · Modules · Stats · Network+Map ·
  Careers · Events · Insights · HowItWorks · Testimonials · CTA · Footer)
- `/login`, `/register`, `/forgot-password` — split-screen auth
- `/app` shell → feed, alumni, profile, jobs, events, forum, salary, map, career,
  messages, notifications, subscription
- `/admin` shell → overview, users, verifications, reports, revenue, broadcast,
  moderation
- `*` → 404

Pages are UI-only with mock data from `src/lib/constants.ts` (ready to wire to the
Spring Boot API via TanStack Query + the axios client described in `FRONTEND_STRUCTURE.md`).

## 5. Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build  (passes clean)
```

## 6. Conventions / gotchas

- Strict TS: `verbatimModuleSyntax` (use `import type`), `noUnusedLocals/Parameters`,
  `erasableSyntaxOnly` (no enums). `@/*` → `src/*`.
- lucide-react in this version has **no brand icons** (Github/LinkedIn/etc.) — use
  generic icons.
- White text is only used on gradient/photo-scrim surfaces; body/card text is `plum-*`.
