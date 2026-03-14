# Admin Panel Improvements Plan

## Context

The admin panel is a ReactFlow-based visual quiz/survey builder. Currently it has basic node editing (Question, InfoPage, Offer) with hardcoded string attributes, no flow management, and no drag-and-drop attribute assignment. The API (OpenAPI spec) defines richer data structures: attributes as entities with IDs, answers with attribute arrays, offers with 3 attribute zones, flows with history/rollback. This plan aligns the frontend with the API data model and adds the requested UX improvements. **All data is mock — no backend calls.**

---

## Phase 0: Dependencies & shadcn Components

**Install @dnd-kit:**
```bash
cd admin_front && npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Add missing shadcn components:**
```bash
npx shadcn@latest add dialog tabs switch
```

---

## Phase 1: Data Layer Alignment (foundation for all other phases)

### 1a. Add Flow/FlowHistory types to `src/types/api.ts`
- `FlowTransitionCondition` (`'always' | 'answer_any' | 'answer_all'`)
- `FlowTransitionResponse`, `FlowTransitionCreateRequest`
- `FlowQuestionResponse`
- `FlowResponse`, `FlowsListResponse`, `FlowCreateRequest`, `FlowUpdateRequest`
- `FlowHistoryAction`, `FlowSnapshot`, `FlowHistoryEntryResponse`, `FlowHistoryListResponse`
- Add `"text"` to existing `QuestionType`

### 1b. Update internal types — `src/features/quiz-editor/types.ts`
- `Answer`: replace `value: string` → `attributes: number[]`
- `QuestionNodeData`: add `requires: boolean`, remove `attribute: string`
- `OfferNodeData`: add `requires_all: number[]`, `requires_optional: number[]`, `excludes: number[]`
- Replace `ConditionalEdgeData` with `TransitionEdgeData { conditionType, answerIds, priority }`
- Remove `ConditionOperator`, `EdgeCondition`

### 1c. Update constants — `src/features/quiz-editor/constants.ts`
- Replace `USER_ATTRIBUTES: string[]` → `MOCK_ATTRIBUTES: AttributeResponse[]` (id + name)
- Replace `MOCK_OFFERS` → proper `OfferResponse[]` with price, attribute arrays, priority
- Update `NODE_KINDS` defaultData to match new interfaces

### 1d. Restructure mocks — `src/features/quiz-editor/mocks/`
- Move existing `mocks.ts` → `mocks/quiz.ts`, update Answer/Question shapes
- New `mocks/flows.ts` — 2-3 mock FlowResponse objects
- New `mocks/flow-history.ts` — mock history entries per flow
- New `mocks/index.ts` — barrel re-export

### 1e. New `src/features/quiz-editor/utils/flow-to-graph.ts`
- Convert `FlowResponse` → `QuizGraph` (nodes + edges + viewport)
- Use `applyDagreLayout` from existing `dag.ts` for auto-positioning

---

## Phase 2: Attributes Store & DnD Infrastructure

### 2a. New store — `src/features/quiz-editor/store/attributes.store.ts`
- State: `attributes: AttributeResponse[]`, initialized from `MOCK_ATTRIBUTES`
- Actions: `addAttribute(name)`, `updateAttribute(id, name)`, `removeAttribute(id)`, `getAttributeName(id)`

### 2b. New component — `src/features/quiz-editor/components/DndContext.tsx`
- Wraps editor with `@dnd-kit` `DndContext`
- Central `handleDragEnd` dispatches to correct store based on drop target type:
  - `answer-attributes` → `editorStore.updateAnswer(nodeId, answerId, { attributes: [...existing, attrId] })`
  - `offer-zone` → `editorStore.updateNodeData(nodeId, { [zone]: [...existing, attrId] })`

### 2c. New component — `src/features/quiz-editor/components/AttributesPanel.tsx`
- Collapsible right-side panel (mirrors NodePalette on left)
- Header: "Attributes" + Add button
- Inline form: Input + Button to create attribute
- List of draggable attribute pills (`useDraggable` from @dnd-kit)
- Each pill: name badge, edit (inline rename), delete button

### 2d. Shared components
- `AttributeBadge.tsx` — small pill showing attribute name + optional "x" to remove
- `DroppableZone.tsx` — reusable `useDroppable` wrapper with highlight-on-hover

### 2e. Update `QuizEditorPage.tsx` layout
```
<DndContextWrapper>
  <ReactFlowProvider>
    <TopBar />
    <div className="flex flex-1">
      <NodePalette />
      <Canvas />        {/* flex-1 */}
      <AttributesPanel />
    </div>
  </ReactFlowProvider>
</DndContextWrapper>
```

---

## Phase 3: Question Node Improvements

### 3a. Answer attribute badges (Requirement 2)
- Each answer row in `QuestionNode.tsx`: add attribute badges after text input
- Each answer row is a drop target (`useDroppable` with `{ type: 'answer-attributes', nodeId, answerId }`)
- On drop: append attribute ID to answer's `attributes[]`
- Badge "x" removes attribute from array
- Use `nodrag` class on drop targets to prevent ReactFlow interference

### 3b. Single outgoing edge per answer (Requirement 3)
- `Canvas.tsx` `isValidConnection`: reject if `sourceHandle` already has an outgoing edge
- `editor.store.ts` `onConnect`: same validation

### 3c. Required toggle (Requirement 4)
- Add `Switch` component in QuestionNode header (next to badge)
- `checked={data.requires}`, toggles via `updateNodeData(id, { requires: v })`
- Label: "Required" in small text

---

## Phase 4: Flow Selector (Requirement 5)

### 4a. New store — `src/features/quiz-editor/store/flow.store.ts`
- State: `flows: FlowResponse[]`, `activeFlowId: number | null`
- `selectFlow(flowId)`: converts FlowResponse → QuizGraph via `flowToGraph()`, calls `editorStore.loadGraph()`
- Init from `MOCK_FLOWS`

### 4b. Update `TopBar.tsx`
- Left side: app logo "BebraMe" + flow `Select` dropdown
- Dropdown shows flow names, active flow marked with badge
- On switch: check `isDirty`, confirm if unsaved changes, then `selectFlow()`

### 4c. Update `QuizEditorPage.tsx` init
- Replace `useEffect` that loads `MOCK_QUIZ` with flow store initialization (select first flow)

---

## Phase 5: Flow History & Rollback (Requirement 6)

### 5a. New component — `src/features/quiz-editor/components/FlowHistoryPanel.tsx`
- Dialog triggered by History button (clock icon) in TopBar
- Vertical timeline of `FlowHistoryEntryResponse` items for active flow
- Each entry: revision #, action badge (color-coded), timestamp, user
- "Rollback" button per entry (except latest)

### 5b. Add to flow store
- `history: Record<number, FlowHistoryEntryResponse[]>` from mock data
- `rollbackToRevision(flowId, revision)`: loads snapshot, appends rollback entry to history

### 5c. Update TopBar — add History button (clock icon) next to auto-layout

---

## Phase 6: Offer Attribute Zones (Requirement 8)

### 6a. Update `OfferNode.tsx`
- Below offer selector/description/label, add 3 sections:
  - "Requires All" — `DroppableZone` with `{ type: 'offer-zone', zone: 'requires_all' }`
  - "Requires Optional" — same pattern
  - "Excludes" — same pattern
- Each zone renders existing attribute IDs as `AttributeBadge` pills
- Empty state: "Drop attributes here" dashed placeholder
- Remove attribute: badge "x" button

### 6b. Node width increase
- Offer node: 280px → 320px to fit attribute zones
- Update `dag.ts` height map: offer ~350px, question ~400px

---

## Phase 7: Edge Simplification

### 7a. Update `ConditionalEdge.tsx`
- Replace old attribute/operator/value condition editor
- New: condition type selector (`always | answer_any | answer_all`)
- For `answer_any`/`answer_all`: multi-select of answer IDs from source question
- Edge label: "always" or "any [2]" / "all [3]" badge

---

## Phase 8: Header Polish

### 8a. Finalize TopBar layout
- Left: "BebraMe" logo + Flow selector
- Center: Flow/quiz name (editable) + dirty indicator
- Right: History, Auto-layout, Save, More menu

---

## Implementation Order

```
Phase 0 (deps) → Phase 1 (types/mocks) → Phase 2 (attributes + DnD)
  → Phase 3 (question node) }
  → Phase 4 (flow selector)  } can be done in parallel after Phase 2
  → Phase 6 (offer zones)   }
  → Phase 7 (edges)         }
→ Phase 5 (flow history, depends on Phase 4)
→ Phase 8 (header polish, depends on Phase 4+5)
```

---

## Key Files Modified

| File | Changes |
|------|---------|
| `src/types/api.ts` | Add Flow, FlowHistory, FlowTransition types |
| `src/features/quiz-editor/types.ts` | Answer.attributes, requires, offer arrays, new edge data |
| `src/features/quiz-editor/constants.ts` | MOCK_ATTRIBUTES, updated MOCK_OFFERS, NODE_KINDS |
| `src/features/quiz-editor/store/editor.store.ts` | Connection validation, updated Answer default |
| `src/features/quiz-editor/pages/QuizEditorPage.tsx` | DndContext wrapper, AttributesPanel, flow init |
| `src/features/quiz-editor/components/TopBar.tsx` | Flow selector, history button, branding |
| `src/features/quiz-editor/components/Canvas.tsx` | Single-edge-per-handle validation |
| `src/features/quiz-editor/nodes/QuestionNode.tsx` | Required toggle, attribute badges, drop targets |
| `src/features/quiz-editor/nodes/OfferNode.tsx` | 3 attribute drop zones |
| `src/features/quiz-editor/edges/ConditionalEdge.tsx` | Transition-type selector |
| `src/features/quiz-editor/utils/dag.ts` | Updated node height map |

## New Files

| File | Purpose |
|------|---------|
| `src/components/ui/dialog.tsx` | shadcn Dialog |
| `src/components/ui/tabs.tsx` | shadcn Tabs |
| `src/components/ui/switch.tsx` | shadcn Switch |
| `src/features/quiz-editor/store/attributes.store.ts` | Attribute CRUD store |
| `src/features/quiz-editor/store/flow.store.ts` | Flow selection + history store |
| `src/features/quiz-editor/components/DndContext.tsx` | @dnd-kit wrapper |
| `src/features/quiz-editor/components/AttributesPanel.tsx` | Right sidebar |
| `src/features/quiz-editor/components/AttributeBadge.tsx` | Attribute pill with remove |
| `src/features/quiz-editor/components/DroppableZone.tsx` | Reusable drop target |
| `src/features/quiz-editor/components/FlowHistoryPanel.tsx` | History dialog |
| `src/features/quiz-editor/mocks/index.ts` | Barrel export |
| `src/features/quiz-editor/mocks/quiz.ts` | Updated quiz mock |
| `src/features/quiz-editor/mocks/flows.ts` | Mock flows |
| `src/features/quiz-editor/mocks/flow-history.ts` | Mock flow history |
| `src/features/quiz-editor/utils/flow-to-graph.ts` | FlowResponse → QuizGraph converter |

## Verification

1. `npm run build` — type-check passes
2. `npm run dev` — app loads, flow selector shows mock flows
3. Switch between flows — canvas updates with different graphs
4. Drag attribute from right panel onto answer row — badge appears
5. Drag attribute onto offer zone — badge appears in correct zone
6. Toggle "Required" switch on question — persists in node data
7. Try connecting two edges from same answer handle — second rejected
8. Open flow history dialog — shows timeline, rollback loads snapshot
9. Export JSON — output matches new data structures
