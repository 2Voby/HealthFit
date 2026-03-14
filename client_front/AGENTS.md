# Repository Guidelines

## Project Structure & Module Organization
This is a Vite + React 19 + TypeScript frontend.

- `src/main.tsx`: app entry point.
- `src/App.tsx`: top-level routing (`/`, `/quiz`, `/result`).
- `src/pages/*`: page-level features (`MainPage`, `QuizPage`, `ResultPage`).
- `src/pages/QuizPage/components/*`: quiz-specific UI blocks.
- `src/components/ui/*`: shared Shadcn/Radix primitives.
- `src/lib/*`: API client, query client, and utilities.
- `src/store/*`: Zustand state.
- `src/pages/QuizPage/__tests__/*`: Vitest unit tests.
- `public/`: static assets; `dist/`: production build output.

Use the `@/*` alias for imports from `src`.

## Build, Test, and Development Commands
- `npm run dev`: start local dev server on `http://localhost:5173`.
- `npm run build`: type-check (`tsc -b`) and create production build.
- `npm run preview`: serve the built app locally.
- `npm run lint`: run ESLint for TS/TSX files.
- `npm run test`: run Vitest once.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run dev-ngrok`: expose local dev server through ngrok.

## Coding Style & Naming Conventions
- Prefer TypeScript and functional React components.
- Match existing style in touched files (formatting is not fully uniform across the repo).
- Run `npm run lint` before opening a PR.
- Component naming:
  - Page and feature components: `PascalCase` (`QuizPage.tsx`).
  - Shadcn UI files follow existing lowercase naming (`button.tsx`, `card.tsx`).
- Keep modules focused; colocate quiz-specific logic inside `src/pages/QuizPage/`.

## Testing Guidelines
- Framework: Vitest (`src/pages/QuizPage/__tests__`).
- Test files use `*.test.ts` naming.
- Write tests close to feature code for business logic (utils, config guards, branching rules).
- Run `npm run test` locally before pushing.

## Commit & Pull Request Guidelines
- Current history uses short, imperative commit subjects (e.g., `add ngrok`, `init client frontend`).
- Keep commit titles concise and action-oriented; avoid vague messages.
- PRs should include:
  - what changed and why,
  - manual test steps and command results (`npm run test`, `npm run build`),
  - screenshots/GIFs for UI changes,
  - linked issue/task when available.

## Security & Configuration Tips
- Copy `.env.example` to `.env` and set `VITE_API_URL`.
- Do not commit secrets or environment-specific credentials.

## Required Development Workflow
- Every completed feature must immediately include tests written with React Testing Library and Vitest.
- A feature is not considered complete until its required tests are added and passing.
- After finishing a feature and its tests, create a commit immediately.
- Do not postpone tests.
- Do not leave completed work uncommitted.
- Workflow for every feature is strict:
  1. Implement the feature.
  2. Immediately add or update tests for it using React Testing Library and Vitest.
  3. Run the tests and make sure they pass.
  4. Commit the finished feature right away.