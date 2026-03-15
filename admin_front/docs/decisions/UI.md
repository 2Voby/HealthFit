# UI Approach: Visual Drag-and-Drop Constructor

## Decision

The admin panel UI uses a visual drag-and-drop canvas constructor, inspired by chatbot flow builders (Botpress, Typebot, n8n).

## Context

Admins need to build complex quiz flows with conditional branching. A traditional form-based UI would make it hard to visualize the flow structure, especially as quizzes grow in complexity.

## Design

- A freeform **canvas** (powered by React Flow) where the admin places and connects node components
- Three node types: **Questions**, **Info Pages**, and **Offer/Finish** blocks
- Nodes are freely positioned and connected with edges to represent the quiz flow
- Each node's properties are edited **inline** or via a right-side panel — no separate modal dialogs
- Edges represent transitions between nodes, with optional conditions based on user attributes
- The canvas supports zoom, pan, and auto-layout via dagre

## Consequences

- Intuitive for non-technical admins — the flow is immediately visible
- Requires React Flow as a dependency, adding bundle size
- Graph ↔ API format conversion is needed (see `utils/flow-to-graph.ts` and `utils/graph-to-flow.ts`)