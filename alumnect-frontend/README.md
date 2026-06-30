# AlumNect — Frontend

The web client for **AlumNect (ACCP)** — the verified, official home for the FPT
University alumni community (FPTU SEP490 capstone). A premium, warm, human social
platform: verified profiles, community feed, jobs, events, mentorship, a Q&A forum,
an anonymous salary board, an interactive alumni map, direct messaging and an admin
dashboard.

> Full product requirements live in the root [`README.md`](../README.md) (SRS).
> Architecture conventions: [`FRONTEND_STRUCTURE.md`](./FRONTEND_STRUCTURE.md).
> Design system & changelog: [`UI_UX_NOTES.md`](./UI_UX_NOTES.md).

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Build / dev | **Vite 8** |
| UI | **React 19** + **TypeScript** (strict) |
| Styling | **Tailwind CSS v4** (CSS-first `@theme`) |
| Animation | **Framer Motion** |
| Routing | **React Router v6** |
| Server state | **TanStack Query v5** |
| Client state | **Zustand** (persisted) |
| Forms / validation | **React Hook Form** + **Zod** |
| HTTP | **Axios** (JWT + auto-refresh queue) |
| Icons | **lucide-react** |

Design direction: warm cream canvas, pastel periwinkle/violet/coral/mint/sky/honey
accents, plum ink, soft shadows, and rich micro-interactions (scroll reveals,
parallax, tilt, magnetic buttons, marquees, counters, page transitions).

---

## Getting started

```bash
# 1. install
npm install

# 2. environment
cp .env.example .env.local   # then set VITE_API_BASE_URL

# 3. run
npm run dev                  # http://localhost:5173
```

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server (HMR). |
| `npm run build` | Type-check (`tsc -b`) + production build. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |

### Environment variables

| Var | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1` | Base URL of the Spring Boot REST API. |

`.env.local` is git-ignored; commit only `.env.example`.

---

## Project structure (Enterprise Feature-Based)

```text
src/
├── app/                # (reserved) app-level wiring
├── assets/             # static assets
├── components/
│   ├── ui/             # stateless design-system primitives (Button, Card, Avatar, SmartImage…)
│   ├── motion/         # animation primitives (Reveal, Parallax, Counter, TiltCard, Marquee…)
│   ├── layout/         # MarketingLayout, AppShell (top header), AdminShell
│   └── viz/            # data-viz (WorldMap…)
├── features/           # self-contained modules: marketing, auth (+ api/components/hooks/model)
├── hooks/              # shared hooks (useMousePosition…)
├── lib/                # http.ts (axios+refresh), queryClient.ts, utils.ts, constants.ts (mock)
├── pages/              # route pages — LandingPage, auth/*, app/*, admin/*, NotFoundPage
├── store/              # Zustand stores (authStore)
├── App.tsx             # providers + router
└── main.tsx            # entry
```

Import flow is one-way: `app → pages → features → shared (components/hooks/store/lib)`.
Features expose a public API via `index.ts` (no deep imports, no cross-feature imports).

---

## Routes

- `/` — marketing landing
- `/login` · `/register` · `/forgot-password` — auth
- `/app` — member shell (Facebook/LinkedIn-style top header) → feed, alumni, profile,
  jobs, events, forum, salary, map, career, messages, notifications, subscription
- `/admin` — admin shell → overview, users, verifications, reports, revenue, broadcast, moderation

---

## Data layer

- `src/lib/http.ts` — Axios instance that attaches the JWT, unwraps `response.data`,
  and transparently refreshes the access token on `401` (single refresh + request queue).
- `src/store/authStore.ts` — persisted Zustand store (`user`, tokens, `role`).
- `src/lib/queryClient.ts` — shared TanStack Query client.

Pages currently render mock data from `src/lib/constants.ts`. Wiring to the API is
done per feature under `features/<name>/{api,hooks,model}` behind TanStack Query —
see `FRONTEND_STRUCTURE.md` for the canonical patterns.

---

## Conventions

- Strict TS: `verbatimModuleSyntax` (use `import type`), `noUnusedLocals/Parameters`,
  `erasableSyntaxOnly` (no enums). Path alias `@/*` → `src/*`.
- Keep components stateless/presentational; business logic lives in feature hooks.
- Commits follow Conventional Commits. Work on `feature/*` branches → PR into `dev`.

---

## Status

UI/UX layer is complete (all screens, mock data) and the production build passes.
Next: real auth + RBAC route guards, then replace mock data feature-by-feature.
