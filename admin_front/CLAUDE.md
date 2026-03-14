# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server (http://localhost:5173)
npm run build     # Type-check and build for production
npm run lint      # Run ESLint
npm run preview   # Preview production build
npx playwright test          # Run all E2E tests
npx playwright test <file>   # Run a single test file
```

## Project Purpose

Admin panel for a quiz/survey builder ("constructor"). The core domain:

- **Questions** are assigned attributes (e.g. age, gender, goal) that are specified per-task
- **Answer options** each add attribute values to the user's profile when selected
- **Transitions** between questions are configured by the admin based on the accumulated user profile attributes — i.e. conditional routing
- **End result / plan** is generated from the final set of user attributes after the quiz completes

## Architecture

**Stack:** React 19 + TypeScript, Vite, Tailwind CSS, Shadcn/ui (Radix UI), React Router v7, Zustand, TanStack Query, React Hook Form + Zod.

**Notable libraries:** `motion` (animations), `ogl` (WebGL), `react-use-websocket` (real-time).

**Entry points:** `src/main.tsx` mounts the app; `src/providers/index.tsx` wraps with QueryClientProvider and toast; `src/App.tsx` owns routing via React Router `BrowserRouter`.

**API layer (`src/lib/api.ts`):** Generic `fetch` wrapper exported as `api.get/post/put/patch/delete`. Sends credentials (cookies), reads `VITE_API_URL` (defaults to `http://localhost:8000`). Throws `Error` on non-OK responses.

**State management:**
- Server state → TanStack Query (`src/lib/query-client.ts`)
- Auth/user state → Zustand store (`src/store/auth.store.ts`): `useAuthStore` exposes `user`, `setUser`, `clearUser`

**UI components:** Shadcn/ui components live in `src/components/ui/`. Use the `cn()` utility from `src/lib/utils.ts` (wraps `clsx` + `tailwind-merge`) for conditional class names. Add new Shadcn components via `npx shadcn@latest add <component>`.

**Path alias:** `@/*` resolves to `src/*`.

**Environment:** Copy `.env.example` to `.env` and set `VITE_API_URL` to point at the backend.

**E2E tests:** Playwright tests go in `./tests/`. The config auto-starts `npm run dev` before running tests.

## Planned UI: Visual Constructor

The admin panel UI is a drag-and-drop canvas builder inspired by chatbot flow editors (e.g. Botpress, Typebot).

- A freeform **canvas** where the admin drags and drops three component types: **questions**, **answers**, and **transitions**
- Components are freely positioned and connected on the canvas to represent the quiz flow visually
- Each component's **attributes are edited inline** within the component itself — no separate properties panel
- Transitions encode the conditional routing logic: which question to go to next based on current user profile attributes
