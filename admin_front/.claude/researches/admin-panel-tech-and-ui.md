# Admin Panel: Tech Stack & UI Research

## Context

The admin panel is a **visual DAG editor** for building personalized wellness quiz funnels (BetterMe challenge). Admins create question flows where:

- **Node types:** Question nodes (single/multi choice, text/number input) and Info page nodes (motivational messages)
- **Edges:** directed, conditional transitions based on accumulated user attributes
- **Structure:** DAG (directed acyclic graph) — branching trees, no cycles, potentially unlimited nodes
- **Output:** each path through the graph leads to one or more personalized offers (7 offer types)
- **Branching conditions** can combine multiple attributes (age + goal + constraints + level, etc.)
- **Answer options** on the same question can vary depending on prior answers

---

## 1. Canvas / Flow Editor Library

### Winner: **React Flow (`@xyflow/react`)** — v12+, MIT license

React Flow is the de facto standard for node-based editors in React (~800k weekly downloads). No other library comes close for this use case.

**Why it fits:**
- Any React component can be a node → embed Shadcn forms, dropdowns, inline editing directly inside nodes
- Custom edges with `EdgeLabelRenderer` → render HTML condition labels on edges (not just SVG text)
- Built-in: minimap, controls (zoom/fit), background grid, box selection, keyboard shortcuts
- Nodes/edges are plain JS objects → trivial JSON serialization for API persistence
- Multiple named handles per node → model "answer option A → question X", "answer option B → question Y"
- `isValidConnection` callback → enforce DAG constraint (reject cycles via DFS check)
- Performant with 100+ nodes (viewport culling, batched updates)

**What it does NOT include (must build):**
- Auto-layout (integrate dagre or elkjs)
- Undo/redo (implement with state history stack)
- Cycle detection (DFS in `isValidConnection`)

**Alternatives considered and rejected:**
| Library | Why rejected |
|---|---|
| **Rete.js v2** | Steeper learning curve, smaller community. Built-in dataflow execution engine is overkill — we don't execute quiz logic in the admin editor. |
| **Flume** | Unmaintained since 2021, limited node UI customization, likely broken on React 19 |
| **beautiful-react-diagrams** | Unmaintained since 2022, no edge labels, no minimap, too basic |
| **react-diagrams (@projectstorm)** | Inconsistent maintenance, complex API |

---

## 2. Auto-Layout Library

### Winner: **`@dagrejs/dagre`** (community fork of dagre, MIT)

For a DAG quiz builder, dagre is the pragmatic choice.

| | @dagrejs/dagre | elkjs | d3-dag |
|---|---|---|---|
| **Bundle** | ~30 KB | ~140 KB | ~15-20 KB |
| **React Flow integration** | Official example, ~20 lines of glue | Official example, more setup | No official example |
| **License** | MIT | EPL-2.0 (weak copyleft) | Apache-2.0 |
| **Layout quality** | Good for trees/DAGs | Superior (edge routing, orthogonal paths) | Good but less tested with React Flow |
| **Execution** | Synchronous | Async (non-blocking) | Synchronous |

**Decision:** Start with `@dagrejs/dagre` for simplicity. If edge routing or complex layouts become necessary later, swap to elkjs — React Flow's node/edge model stays the same either way.

Consider also checking `@xyflow/layout` — a first-party layout wrapper from the React Flow team that may simplify dagre/elkjs integration.

---

## 3. Full Recommended Library Set

Libraries already in `package.json` that we keep using:

| Purpose | Library | Notes |
|---|---|---|
| UI components | `shadcn/ui` + Radix | Node inspector panels, forms, dialogs |
| Styling | Tailwind CSS + `cn()` | All styling |
| Forms | React Hook Form + Zod | Node attribute editing forms |
| Server state | TanStack Query | CRUD operations for graph config |
| Client state | Zustand | Canvas state, selection, clipboard |
| Animations | `motion` | Node transitions, panel open/close |
| Toast | `react-hot-toast` | Save confirmations, error feedback |

**New libraries to add:**

| Purpose | Library | Install |
|---|---|---|
| Canvas / flow editor | `@xyflow/react` | `npm i @xyflow/react` |
| Auto-layout | `@dagrejs/dagre` | `npm i @dagrejs/dagre` |
| Dagre types | `@types/dagre` | `npm i -D @types/dagre` (if needed) |

**Libraries already installed but not yet used — keep for later:**
- `ogl` — could be used for a fancy landing/preview
- `react-use-websocket` — live collaboration or preview sync later

---

## 4. Interface Layout

```
┌──────────────────────────────────────────────────────────────┐
│  TopBar                                                      │
│  [Quiz name (editable)]          [Auto-layout] [Save] [...]  │
├────────┬─────────────────────────────────────────────────────┤
│        │                                                     │
│  Node  │              Canvas (React Flow)                    │
│  Panel │                                                     │
│        │    ┌──────────┐      ┌──────────┐                   │
│  + Question │ Question ├─────►│ Question │                   │
│  + Info     │  node    │      │  node    │                   │
│  + Offer    └──────────┘      └────┬─────┘                   │
│             (drag from             │                         │
│              panel to              ▼                         │
│              canvas)         ┌──────────┐                    │
│                              │  Info    │                    │
│                              │  page    │                    │
│                              └────┬─────┘                    │
│                                   ▼                          │
│                              ┌──────────┐    ┌─────────┐    │
│                              │  Offer   │    │ MiniMap │    │
│                              │  node    │    └─────────┘    │
│                              └──────────┘                    │
│        │                                                     │
├────────┴─────────────────────────────────────────────────────┤
```

### Key UI Concepts

**Left panel — Node palette:**
- Draggable node templates: Question, Info Page, Offer
- Drag onto canvas to create a new node
- Collapsible, minimal — the canvas is the primary workspace

**Canvas — the main workspace:**
- React Flow with dot-grid background
- Nodes are custom React components with Shadcn styling
- Edges show condition badges (e.g. "goal = weight_loss AND context = home")
- MiniMap in bottom-right corner
- Controls (zoom +/-, fit view) in bottom-left

**Node design (inline editing):**

```
┌─ Question Node ──────────────────────┐
│ 📋 What is your main goal?           │  ← click to edit text
│                                      │
│ Type: [Single choice ▾]             │  ← dropdown
│                                      │
│ Answers:                             │
│  ○ Weight loss          [→]  handle  │  ← each answer = source handle
│  ○ Strength             [→]          │
│  ○ Flexibility          [→]          │
│  ○ Stress reduction     [→]          │
│  + Add answer                        │
│                                      │
│ Attributes: [goal ▾]                │  ← which attribute this sets
└──────────────────────────────────────┘

┌─ Info Page Node ─────────────────────┐
│ 💬 Great choice! Here's what we...   │  ← rich text / message
│                                      │
│                              [→]     │  ← single "continue" handle
└──────────────────────────────────────┘

┌─ Offer Node ─────────────────────────┐
│ 🎯 Weight Loss Starter (Home)       │
│ 4 weeks · Digital plan + Kit         │  ← summary from offer catalog
│                                      │
│ Offer: [Select offer ▾]             │
└──────────────────────────────────────┘
```

**Edge design (condition labels):**
- Default edges: simple arrow, no condition (unconditional transition)
- Conditional edges: small badge on the edge showing the rule
- Click edge badge to edit condition (popover with attribute + operator + value fields)
- Multiple conditions per edge (AND logic): `goal = weight_loss AND context = home`

**Top bar:**
- Quiz name — inline editable
- Auto-layout button — runs dagre to rearrange nodes neatly
- Save — persists graph to backend
- Overflow menu (...) — export JSON, duplicate quiz, delete quiz

---

## 5. Node Data Model (frontend state)

```typescript
// Question node
{
  id: string
  type: 'question'
  position: { x: number, y: number }
  data: {
    text: string
    questionType: 'single_choice' | 'multi_choice' | 'input_number' | 'input_text'
    attribute: string              // which user attribute this question sets (e.g. "goal")
    answers: Array<{
      id: string
      text: string
      value: string               // attribute value this answer sets (e.g. "weight_loss")
    }>
  }
}

// Info page node
{
  id: string
  type: 'info_page'
  position: { x: number, y: number }
  data: {
    title: string
    message: string               // motivational/informational text
  }
}

// Offer node (terminal)
{
  id: string
  type: 'offer'
  position: { x: number, y: number }
  data: {
    offerId: string               // reference to offer catalog
    label: string                 // display name
  }
}

// Edge with optional condition
{
  id: string
  source: string                  // node id
  sourceHandle: string | null     // answer id (for question nodes) or null
  target: string                  // node id
  data: {
    conditions: Array<{
      attribute: string           // e.g. "goal"
      operator: 'eq' | 'neq' | 'gt' | 'lt' | 'in' | 'contains'
      value: string | number | string[]
    }>
    // conditions are AND-ed together
  }
}
```

---

## 6. Key Implementation Notes

1. **DAG enforcement:** Implement cycle detection in `isValidConnection`. On each proposed connection, run DFS from target to see if source is reachable. If yes → reject.

2. **Answer-specific handles:** Each answer option in a Question node renders a separate `<Handle>` with `id={answer.id}`. This lets different answers connect to different next nodes, which is the core branching mechanism.

3. **Condition editing:** Conditions live on edges, not nodes. When an edge connects from a specific answer handle, the answer's attribute value is implicit context. Additional conditions (for multi-attribute branching like "male + 25-40 + runner + knee injury") are added via the edge condition editor.

4. **State management split:**
   - Canvas/graph state (nodes, edges, viewport) → Zustand store
   - Persisted graph data (save/load) → TanStack Query mutations
   - Form state within node editors → React Hook Form (local, per-node)

5. **Auto-layout:** Triggered manually via button ("Auto-layout"). Don't auto-layout on every change — users want to arrange nodes freely and only invoke layout as a convenience reset.

6. **Serialization:** The React Flow nodes/edges arrays are plain JSON — serialize directly for API save. Strip `selected`, `dragging`, and other transient UI state before sending.