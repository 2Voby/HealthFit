# Admin Panel Improvements Plan

## Context

The admin panel is a ReactFlow-based visual quiz/survey builder. This plan aligns the frontend with the API data model and adds UX improvements: header with flow selector, attribute drag-and-drop, required toggle, flow history, and offer attribute zones. **All data is mock — no backend calls.**

## Status: IMPLEMENTED

All 8 phases have been completed:

### Phase 0: Dependencies
- Installed `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Added shadcn `dialog`, `switch` components

### Phase 1: Data Layer Alignment
- Added Flow/FlowHistory types to `src/types/api.ts`
- Updated internal types: `Answer.attributes: number[]`, `QuestionNodeData.requires`, `OfferNodeData` attribute arrays, `TransitionEdgeData`
- Updated constants: `MOCK_ATTRIBUTES: AttributeResponse[]`, `MOCK_OFFERS: OfferResponse[]`
- Restructured mocks into `mocks/` directory with quiz, flows, flow-history
- Created `utils/flow-to-graph.ts` converter

### Phase 2: Attributes Store & DnD
- Created `store/attributes.store.ts` with CRUD operations
- Created `DndContext.tsx` wrapper handling attribute drops on answers and offer zones
- Created `AttributesPanel.tsx` right sidebar with draggable attribute pills
- Created `AttributeBadge.tsx` and `DroppableZone.tsx` shared components
- Updated `QuizEditorPage.tsx` layout

### Phase 3: Question Node Improvements
- Added attribute badges on answers with drop targets
- Single outgoing edge per answer handle validation
- Required toggle (Switch) on question header

### Phase 4: Flow Selector
- Created `store/flow.store.ts` with flow selection/management
- Added flow Select dropdown in TopBar with active badge
- Flow switching loads graph via flow-to-graph converter

### Phase 5: Flow History & Rollback
- Created `FlowHistoryPanel.tsx` dialog with timeline view
- History button in TopBar
- Rollback to any previous revision

### Phase 6: Offer Attribute Zones
- 3 drop zones in OfferNode: requires_all, requires_optional, excludes
- Drag-and-drop attributes from panel to zones
- Remove attribute badges with X button

### Phase 7: Edge Simplification
- Replaced attribute/operator/value conditions with transition type selector
- Supports: always, answer_any, answer_all

### Phase 8: Header Polish
- "BebraMe" branding
- Flow selector + name + history + actions layout
