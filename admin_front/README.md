# BebraMe Admin Panel

Admin panel for the BebraMe quiz/survey platform. Provides a visual drag-and-drop constructor for building personalized quiz flows — inspired by chatbot flow editors like Botpress and Typebot.

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build:** Vite 7
- **Styling:** Tailwind CSS + Shadcn/ui (Radix UI primitives)
- **Routing:** React Router v7
- **State:** Zustand (client) + TanStack Query (server)
- **Forms:** React Hook Form + Zod validation
- **Canvas:** React Flow (`@xyflow/react`) for the visual node editor
- **Other:** Motion (animations), dnd-kit (drag & drop), WebSocket support

## Getting Started

### Prerequisites

- Node.js 22+
- Running backend API (default `http://localhost:8000`)

### Setup

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env if your backend runs on a different URL

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |
| `npx playwright test` | Run E2E tests |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

## Project Structure

```
src/
├── components/ui/       # Shadcn/ui components (Button, Card, Input, etc.)
├── features/
│   └── quiz-editor/     # Core feature — visual quiz constructor
│       ├── components/  # Canvas, TopBar, RightPanel, NodePalette, etc.
│       ├── edges/       # Custom React Flow edge types (ConditionalEdge)
│       ├── hooks/       # Feature-specific hooks (auto-save, etc.)
│       ├── nodes/       # Custom node types (Question, InfoPage, Offer)
│       ├── pages/       # QuizEditorPage — main entry point
│       ├── store/       # Zustand stores (flow, editor, attributes)
│       ├── utils/       # Graph ↔ Flow conversions, DAG layout, ID generation
│       ├── mocks/       # Mock data for development
│       ├── types.ts     # Core type definitions
│       └── constants.ts # Shared constants
├── hooks/               # Global hooks (auth, etc.)
├── lib/                 # Shared utilities
│   ├── api.ts           # Fetch wrapper (api.get/post/put/patch/delete)
│   ├── query-client.ts  # TanStack Query client config
│   └── utils.ts         # cn() helper (clsx + tailwind-merge)
├── pages/               # Top-level pages (Login, Register)
├── providers/           # App-wide providers (QueryClient, Toaster)
├── store/               # Global Zustand stores (auth)
├── App.tsx              # Router + auth guards
└── main.tsx             # Entry point
```

## Architecture

### Quiz Editor

The quiz editor is a visual node-based canvas where admins build quiz flows:

- **Question nodes** — single/multi choice, text or number input. Each answer option carries attribute values that get added to the user's profile when selected.
- **Info Page nodes** — display informational content between questions.
- **Offer/Finish nodes** — represent the end of a quiz branch with result offers.
- **Edges** — conditional transitions between nodes based on accumulated user attributes.

The graph is converted to/from the backend format using utilities in `utils/flow-to-graph.ts` and `utils/graph-to-flow.ts`. Auto-layout is handled via dagre (`utils/dag.ts`).

### Auth Flow

Cookie-based authentication. On app load, `AuthBootstrap` calls `/me` to restore session. Protected routes use `RequireAuth`; login/register use `GuestOnly` guards.

### API Layer

A thin fetch wrapper in `src/lib/api.ts` that:
- Reads `VITE_API_URL` from environment
- Sends credentials (cookies) with every request
- Throws on non-OK responses
- Exports typed `get/post/put/patch/delete` methods

## Docker

```bash
# Build and run with Docker Compose
docker-compose up --build
```

Serves the production build via nginx on port `3000`. The Dockerfile uses a multi-stage build (Node 22 Alpine → nginx Alpine).

## Design Decisions

See [`docs/decisions/`](docs/decisions/) for architectural decision records:

- [UI approach](docs/decisions/UI.md) — visual drag-and-drop constructor
- [Constructor logic](docs/decisions/CONSTRUCTOR_LOGIC.md) — attribute-based routing model