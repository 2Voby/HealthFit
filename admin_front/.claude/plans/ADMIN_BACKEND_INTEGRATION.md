# Plan: Integrate Admin Panel with Backend API

## Context

The admin panel currently uses mock/hardcoded data everywhere. The backend API is fully built (OpenAPI spec provided). The services layer (`src/services/`) and TanStack Query hooks (`src/hooks/`) already exist and correctly call the API — they're just not used by the UI components. The three Zustand stores in `features/quiz-editor/store/` use `MOCK_*` data instead of fetching from the API. Auth pages hardcode a fake user instead of calling the login/register endpoints.

**Goal:** Replace all mock data with real API calls, making every CRUD operation hit the backend via `VITE_API_URL`.

---

## Step 1: Fix Auth — `User` type + Login/Register pages

**Files:**
- `src/types/index.ts` — Change `User` to match `UserResponse` from API
- `src/store/auth.store.ts` — Use `UserResponse` type instead of `User`
- `src/pages/LoginPage.tsx` — Use `useLogin()` hook, read form values, call API
- `src/pages/RegisterPage.tsx` — Use `useRegister()` hook, read form values, call API
- `src/App.tsx` — Use `useMe()` query for auth state instead of Zustand-only check

**Details:**
1. Replace `User { id: string, email: string, name: string }` with re-export of `UserResponse { id: number, login: string, authorities: string[] }` from `types/api.ts`
2. Update `auth.store.ts` to use `UserResponse` type
3. `LoginPage`: use `useLogin()` mutation with `{ login, password }` form data. On success, `setUser(data)` from response. Show error toast on failure
4. `RegisterPage`: use `useRegister()` mutation with `{ login, password }`. On success, navigate to login or auto-login
5. `App.tsx` `RequireAuth`: use `useMe()` query to check auth on page load. If `useMe()` succeeds, set user in store. If it fails (401), redirect to login. This handles page refresh persistence (cookie-based auth)

---

## Step 2: Create Flows Service + Hook

**Files to create:**
- `src/services/flows.service.ts` — API calls for `/v1/flows/` endpoints
- `src/hooks/use-flows.ts` — TanStack Query hooks for flows

**API endpoints to cover:**
- `GET /v1/flows/` → `list(params)`
- `GET /v1/flows/{flow_id}` → `get(id)`
- `POST /v1/flows/` → `create(data)`
- `PATCH /v1/flows/{flow_id}` → `update(id, data)`
- `DELETE /v1/flows/{flow_id}` → `delete(id)`
- `GET /v1/flows/{flow_id}/history` → `listHistory(flowId, params)`
- `GET /v1/flows/{flow_id}/history/{revision}` → `getHistoryEntry(flowId, revision)`
- `POST /v1/flows/{flow_id}/rollback/{revision}` → `rollback(flowId, revision)`

**Hooks to create:**
- `useFlows(params)`, `useFlow(id)`, `useCreateFlow()`, `useUpdateFlow()`, `useDeleteFlow()`
- `useFlowHistory(flowId, params)`, `useRollbackFlow()`

---

## Step 3: Rewrite `flow.store.ts` — Remove mocks, use API

**File:** `src/features/quiz-editor/store/flow.store.ts`

**Current state:** Initializes with `MOCK_FLOWS`, `MOCK_FLOW_HISTORY`, manages all state in-memory.

**New approach:** The store becomes a thin UI state layer that holds `activeFlowId` only. All data fetching moves to TanStack Query hooks used in components.

Changes:
- Remove `MOCK_FLOWS`, `MOCK_FLOW_HISTORY` imports
- Remove `flows`, `history`, `nextFlowId` from store state
- Keep `activeFlowId` and `selectFlow` (which loads graph into editor)
- The `selectFlow` method now just sets activeFlowId — the component that uses it will pass the full `FlowResponse` to `flowToGraph`
- Remove `createFlow`, `renameFlow`, `deleteFlow`, `duplicateFlow`, `rollbackToRevision` — these become mutation calls in components

---

## Step 4: Rewrite `attributes.store.ts` — Remove mocks, use API

**File:** `src/features/quiz-editor/store/attributes.store.ts`

**Current state:** Initializes with `MOCK_ATTRIBUTES`, manages CRUD in-memory.

**New approach:** Replace with TanStack Query. The `AttributesPanel` component will use `useAttributes()` to fetch and `useCreateAttribute()`/`useDeleteAttribute()` for mutations. The store can be eliminated or reduced to just helper methods (`getAttributeName`, `getAttributeDisplay`, `getGrouped`) that operate on the query data passed as parameter.

Changes:
- Remove store or convert to utility functions
- `AttributesPanel` uses `useAttributes({ limit: 200 })` to fetch all attributes
- Add/remove operations use `useCreateAttribute()` / `useDeleteAttribute()` mutations
- Attribute drag-drop still works — just reads from query data instead of store

---

## Step 5: Update `QuizEditorPage` + `TopBar` — Wire up flows API

**Files:**
- `src/features/quiz-editor/pages/QuizEditorPage.tsx`
- `src/features/quiz-editor/components/TopBar.tsx`
- `src/features/quiz-editor/components/FlowHistoryPanel.tsx`

**QuizEditorPage:**
- Use `useFlows()` hook to fetch flow list
- On mount, select first flow (or active flow from `GET /v1/flows/active`)
- Pass flows data to TopBar

**TopBar:**
- Flow selector reads from `useFlows()` query data
- "Create flow" dialog calls `useCreateFlow()` mutation
- "Rename flow" calls `useUpdateFlow()` mutation with `{ name }`
- "Delete flow" calls `useDeleteFlow()` mutation
- "Duplicate flow" calls `useCreateFlow()` with copied data
- "Save" button: serialize graph → convert back to `FlowUpdateRequest` (question_ids + transitions) → call `useUpdateFlow()`

**FlowHistoryPanel:**
- Use `useFlowHistory(activeFlowId)` to fetch history
- "Rollback" button calls `useRollbackFlow()` mutation, then invalidates flow query

---

## Step 6: Implement Save — Graph serialization to API format

**File:** `src/features/quiz-editor/utils/graph-to-flow.ts` (new)

**Purpose:** Convert the editor's `QuizGraph` back into `FlowUpdateRequest` for the PATCH endpoint.

This is the reverse of `flow-to-graph.ts`:
- Extract question nodes → collect question_ids (need mapping from node IDs back to backend question IDs)
- Extract edges → build `FlowTransitionCreateRequest[]`
- Need to track the mapping between frontend node/answer IDs and backend question/answer IDs

**Challenge:** Currently `flow-to-graph.ts` generates random UUIDs for node/answer IDs and doesn't preserve the backend IDs. We need to store the backend ID mappings.

**Solution:** Store backend IDs in node data:
- Add `backendQuestionId: number` to `QuestionNodeData`
- Add `backendAnswerIds: Map<string, number>` or store backend answer ID on each `Answer` object (add `backendId?: number` to `Answer` interface)
- Update `flowToGraph` to populate these mappings
- `graphToFlow` reads them to build the request

For new nodes (created in editor, not yet saved), `backendQuestionId` will be undefined — these need to be created via `POST /v1/questions/` before saving the flow.

---

## Step 7: Update `AttributesPanel` component

**File:** `src/features/quiz-editor/components/AttributesPanel.tsx`

- Replace `useAttributesStore` reads with `useAttributes({ limit: 200 })` query
- "Add value" calls `useCreateAttribute()` mutation
- "Remove attribute" calls `useDeleteAttribute()` mutation
- "Remove group" calls multiple `useDeleteAttribute()` mutations
- DnD still works — pass attribute data from query

---

## Step 8: Add logout functionality

**File:** `src/features/quiz-editor/components/TopBar.tsx` (or new user menu component)

- Add user menu / logout button to TopBar
- Use `useLogout()` mutation → on success, `clearUser()` from auth store

---

## File Change Summary

| File | Action |
|------|--------|
| `src/types/index.ts` | Modify — align `User` with `UserResponse` |
| `src/store/auth.store.ts` | Modify — use `UserResponse` type |
| `src/pages/LoginPage.tsx` | Modify — real API login |
| `src/pages/RegisterPage.tsx` | Modify — real API register |
| `src/App.tsx` | Modify — add `useMe()` bootstrap |
| `src/services/flows.service.ts` | **Create** — flows API service |
| `src/hooks/use-flows.ts` | **Create** — flows TanStack Query hooks |
| `src/features/quiz-editor/store/flow.store.ts` | Modify — strip to UI-only state |
| `src/features/quiz-editor/store/attributes.store.ts` | Modify — remove mock data, use query data |
| `src/features/quiz-editor/pages/QuizEditorPage.tsx` | Modify — use flows query |
| `src/features/quiz-editor/components/TopBar.tsx` | Modify — use flow mutations, add logout |
| `src/features/quiz-editor/components/FlowHistoryPanel.tsx` | Modify — use history query |
| `src/features/quiz-editor/components/AttributesPanel.tsx` | Modify — use attributes query/mutations |
| `src/features/quiz-editor/types.ts` | Modify — add `backendQuestionId`, `backendId` fields |
| `src/features/quiz-editor/utils/flow-to-graph.ts` | Modify — preserve backend IDs |
| `src/features/quiz-editor/utils/graph-to-flow.ts` | **Create** — serialize graph to API format |

---

## Verification

1. **Auth flow:** Login with real credentials → redirected to editor. Refresh page → stays logged in (cookie). Logout → back to login
2. **Flows:** Flow list populates from API. Create/rename/delete flows updates API. Select flow loads graph
3. **Save:** Edit graph → Save → PATCH flow API → refresh shows saved state
4. **Attributes:** Panel shows API attributes. Add/remove syncs with API
5. **History:** Shows real revision history. Rollback calls API and reloads flow
6. Run `npm run build` — no type errors
