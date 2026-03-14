# ADMIN IMPROVEMENTS PLAN (API-aligned)

## Вхідний контекст
- Прочитано `admin_front/CLAUDE.md` (архітектура адмін-конструктора, DnD напрямок).
- Прочитано `.claude/task/original.pdf` (вимоги до DAG-опитувальника, branching, персоналізований offer).
- Прочитано `.claude/task/betterme_openapi.json` (OpenAPI 3.1 контракт "HealthFit").

## API контракт (HealthFit OpenAPI)
Base URL: `VITE_API_URL` (default `http://localhost:8000`), prefix `/v1`.

### Ключові DTO з API

```ts
// --- Attributes ---
interface Attribute {
  id: number;
  name: string;               // єдине поле, max 120 chars
  created_at: string;          // ISO datetime
  updated_at: string;
}

// --- Questions ---
type QuestionType = "singe_choise" | "multiple_choise" | "manual_input";

interface QuestionAnswer {
  id: number;
  text: string;
  attributes: number[];        // array of Attribute IDs
  created_at: string;
  updated_at: string;
}

interface Question {
  id: number;
  text: string;                // question text (not "title")
  type: QuestionType;
  requires: boolean;           // true = skip заборонений (аналог "required")
  answers: QuestionAnswer[];   // answers вкладені в question
  created_at: string;
  updated_at: string;
}

// --- Flows ---
interface FlowQuestion {
  question_id: number;
  position: number;            // порядок у flow
  question: Question;          // embedded question
}

type FlowTransitionCondition = "always" | "answer_any" | "answer_all";

interface FlowTransition {
  id: number;
  from_question_id: number;
  to_question_id: number | null;  // null = finish
  condition_type: FlowTransitionCondition;
  answer_ids: number[];           // які відповіді тригерять перехід
  priority: number;
  created_at: string;
  updated_at: string;
}

interface Flow {
  id: number;
  name: string;
  is_active: boolean;
  start_question_id: number | null;
  questions: FlowQuestion[];
  transitions: FlowTransition[];
  created_at: string;
  updated_at: string;
}

// --- Flow History ---
type FlowHistoryAction = "create" | "update" | "rollback" | "dependency_update";

interface FlowSnapshot {
  name: string;
  is_active: boolean;
  question_ids?: number[];
  transitions?: FlowTransitionCreateRequest[];
}

interface FlowHistoryEntry {
  id: number;
  flow_id: number;
  revision: number;
  action: FlowHistoryAction;
  source_revision: number | null;
  changed_by_user_id: number | null;
  snapshot: FlowSnapshot;
  created_at: string;
  updated_at: string;
}

// --- Offers ---
interface Offer {
  id: number;
  name: string;
  description: string;
  price: number;
  requires_all: number[];       // attribute IDs — ВСІ мають бути
  requires_optional: number[];  // attribute IDs — бонусні/опціональні
  excludes: number[];           // attribute IDs — виключають offer
  priority: number;
  created_at: string;
  updated_at: string;
}
```

### Ключові відмінності від попередніх mock-моделей

| Аспект | Було (mock) | Стало (API) |
|--------|-------------|-------------|
| IDs | `string` | `number` (integer) |
| Question field | `title` | `text` |
| Question required | `required: boolean` | `requires: boolean` |
| Answers | окремі, `answerIds: string[]` | вкладені в Question як `answers: QuestionAnswer[]` |
| Answer attributes | DnD drop-zone (довільні) | `attributes: number[]` — масив Attribute IDs |
| Attribute model | `key, label, type, group, allowedValues` | тільки `id` + `name` |
| Flow structure | `nodes[], edges[]` | `questions: FlowQuestion[]` + `transitions: FlowTransition[]` |
| Flow transitions | простий edge answer→question | `FlowTransition` з `condition_type` (always/answer_any/answer_all), `answer_ids`, `priority` |
| History | `FlowAction { type, summary, snapshot: Flow }` | `FlowHistoryEntry { revision, action, source_revision, changed_by_user_id, snapshot: FlowSnapshot }` |
| Offer attribute arrays | `primaryAttributes, secondaryAttributes, constraints` | `requires_all`, `requires_optional`, `excludes` |

---

## Scope цього етапу
- UI/layout **з реальними API структурами даних**.
- TanStack Query для server state, Zustand для UI state.
- Архітектура: API client → TanStack Query hooks → компоненти.
- Zod-схеми для runtime валідації API responses.

---

## План по задачах (відповідає 1..8)

### 1) Header + форма атрибутів + dropdown атрибутів з DnD на answers

#### Що будуємо
- Sticky `ConstructorHeader`:
  - Назва конструктора.
  - Flow Select.
  - Кнопки: `Undo`, `Redo`, `History`, `Save draft`.
- `AttributeManager` (sheet/popover):
  - Форма атрибута: тільки `name` (string, max 120).
  - CRUD: `POST /v1/attributes/`, `PATCH /v1/attributes/{id}`, `DELETE /v1/attributes/{id}`.
  - Dropdown/command list з пошуком: `GET /v1/attributes/?offset=0&limit=200`.
- В `AnswerCard`:
  - блок `Applied attributes` — відображає `answer.attributes` (масив Attribute IDs → resolve через кеш атрибутів);
  - drop-zone / add-button для додавання attribute ID до `answer.attributes`.

#### API endpoints
- `GET /v1/attributes/` — list (offset/limit, max 200)
- `POST /v1/attributes/` — create (`{ name }`)
- `GET /v1/attributes/{id}` — get one
- `PATCH /v1/attributes/{id}` — update (`{ name? }`)
- `DELETE /v1/attributes/{id}` — delete

#### UX-деталі
- Видимі стани drag: default / over-valid / over-invalid / dropped.
- Атрибут — це просто `{ id, name }`, без type/group. Сумісність не перевіряється (будь-який атрибут можна додати до будь-якого answer).

---

### 2) До одного question привʼязувати кілька answers

#### Що будуємо
- `QuestionCard` містить `Answers list` (із `question.answers`).
- Кнопка `+ Add answer`.
- Reorder answers drag-handle-ом (локально; зберігається порядок у масиві при save).
- Empty state, якщо answers тимчасово немає.

#### API shape
```ts
// Question вже містить answers:
Question {
  id: number;
  text: string;
  type: QuestionType;  // "singe_choise" | "multiple_choise" | "manual_input"
  requires: boolean;
  answers: QuestionAnswer[];
}

// Create/Update question — answers передаються inline:
QuestionCreateRequest {
  text: string;
  type: QuestionType;
  requires?: boolean;  // default false
  answers?: QuestionAnswerCreateRequest[];
}

QuestionAnswerCreateRequest {
  text: string;
  attributes?: number[];  // attribute IDs
}
```

#### API endpoints
- `POST /v1/questions/` — create question з answers
- `PATCH /v1/questions/{id}` — update (при оновленні answers — передається повний масив `answers`)
- `DELETE /v1/questions/{id}` — delete

---

### 3) Після answer — transition до наступного question

#### Що будуємо (уточнення відносно початкового плану)
API використовує **transitions**, а не прямий edge answer→question. Transition — це:
```ts
FlowTransition {
  from_question_id: number;
  to_question_id: number | null;  // null = flow finished
  condition_type: "always" | "answer_any" | "answer_all";
  answer_ids: number[];
  priority: number;
}
```

- На canvas: transition відображається як edge від Question до Question.
- Transition може бути `always` (безумовний), `answer_any` (будь-яка з answer_ids), `answer_all` (всі answer_ids).
- Priority визначає порядок оцінки transitions (менше = вище пріоритет).
- `to_question_id: null` означає завершення flow.
- Можливо кілька transitions від одного question (branching!).

#### UX
- Edge на canvas показує condition badge: `Always` / `Any of [A1, A2]` / `All of [A1, A2]`.
- При створенні transition — вибір condition_type + вибір answers.
- Валідація: якщо від question є transition з `always` і ще інші — попередження про unreachable transitions.

#### API endpoints
- Transitions зберігаються як частина Flow (`FlowUpdateRequest.transitions`).
- Не окремі CRUD, а batch update при збереженні flow.

---

### 4) Поле `requires` у question (можна скіпнути чи ні)

#### Що будуємо
- Switch `Required` у `QuestionCard` → маппінг на `question.requires`.
- Підпис:
  - `requires=true` — скіп заборонений.
  - `requires=false` — скіп дозволений.
- У списках/картках — chip `Required` або `Optional`.

#### API
- Поле `requires: boolean` в `QuestionCreateRequest` і `QuestionUpdateRequest`.

---

### 5) Flow select у header + перемикання між flows

#### Що будуємо
- `FlowSelect` (combobox):
  - список flow з `GET /v1/flows/`;
  - `Create` → `POST /v1/flows/` (`{ name, question_ids?, transitions? }`);
  - `Rename` → `PATCH /v1/flows/{id}` (`{ name }`);
  - `Delete` → `DELETE /v1/flows/{id}`;
  - `Set Active` → `PATCH /v1/flows/{id}` (`{ is_active: true }`).
- На зміну flow:
  - `GET /v1/flows/{id}` → canvas перезавантажується;
  - flow містить `questions[]` (з position) і `transitions[]`.
- `start_question_id` — перший question у flow (null якщо не задано).

#### API shape
```ts
Flow {
  id: number;
  name: string;
  is_active: boolean;
  start_question_id: number | null;
  questions: FlowQuestion[];      // { question_id, position, question }
  transitions: FlowTransition[];
}

FlowCreateRequest {
  name: string;
  is_active?: boolean;  // default false
  question_ids?: number[];
  transitions?: FlowTransitionCreateRequest[];
}

FlowUpdateRequest {
  name?: string;
  is_active?: boolean;
  question_ids?: number[];
  transitions?: FlowTransitionCreateRequest[];
}
```

#### API endpoints
- `GET /v1/flows/` — list
- `POST /v1/flows/` — create
- `GET /v1/flows/{id}` — get with questions + transitions
- `PATCH /v1/flows/{id}` — update
- `DELETE /v1/flows/{id}` — delete
- `GET /v1/flows/active` — get currently active flow

---

### 6) Для кожного flow — history actions + rollback

#### Що будуємо
- `HistoryDrawer`:
  - список history entries: revision, action type, timestamp, changed_by_user_id;
  - action types: `create`, `update`, `rollback`, `dependency_update`;
  - кнопка `Restore this revision` → `POST /v1/flows/{flow_id}/rollback/{revision}`.
- Header-кнопки `Undo/Redo` — локальний UI undo (Zustand), не API rollback.
- Undo/Redo — для canvas operations (move, add, delete nodes locally).
- History drawer — для API-level versioning (server-side snapshots).

#### API shape
```ts
FlowHistoryEntry {
  id: number;
  flow_id: number;
  revision: number;
  action: "create" | "update" | "rollback" | "dependency_update";
  source_revision: number | null;  // for rollback — which revision was source
  changed_by_user_id: number | null;
  snapshot: FlowSnapshot;
  created_at: string;
  updated_at: string;
}
```

#### API endpoints
- `GET /v1/flows/{flow_id}/history` — list (offset/limit)
- `GET /v1/flows/{flow_id}/history/{revision}` — get single entry
- `POST /v1/flows/{flow_id}/rollback/{revision}` — rollback → returns updated Flow

---

### 7) Структури даних — API інтеграція

#### Статус: РОЗБЛОКОВАНО
OpenAPI контракт отримано. Інтеграція йде одразу.

#### Технічний план
1. Zod-схеми для всіх API response/request типів.
2. TanStack Query hooks:
   - `useAttributes()`, `useCreateAttribute()`, `useUpdateAttribute()`, `useDeleteAttribute()`
   - `useQuestions()`, `useQuestion(id)`, `useCreateQuestion()`, `useUpdateQuestion()`, `useDeleteQuestion()`
   - `useFlows()`, `useFlow(id)`, `useActiveFlow()`, `useCreateFlow()`, `useUpdateFlow()`, `useDeleteFlow()`
   - `useFlowHistory(flowId)`, `useFlowHistoryEntry(flowId, revision)`, `useRollbackFlow()`
   - `useOffers()`, `useOffer(id)`, `useCreateOffer()`, `useUpdateOffer()`, `useDeleteOffer()`
   - `useOfferSelection()`
3. API client (`src/lib/api.ts`) вже існує з generic fetch wrapper.
4. Invalidation strategy: mutation → invalidate related queries.

---

### 8) В offer є три масиви атрибутів — налаштовувати DnD

#### Що будуємо
- `OfferEditor` з трьома секціями attribute arrays:
  - **`requires_all`** — обовʼязкові атрибути (ВСІ мають бути у юзера для eligible offer);
  - **`requires_optional`** — опціональні атрибути (збільшують score);
  - **`excludes`** — виключаючі атрибути (якщо є — offer не показується).
- Можливості:
  - reorder в межах секції;
  - move між секціями;
  - add/remove через dropdown (з кешу атрибутів).
- Також: `name`, `description`, `price`, `priority`.

#### API shape
```ts
Offer {
  id: number;
  name: string;
  description: string;     // max 5000
  price: number;           // >= 0
  requires_all: number[];  // attribute IDs
  requires_optional: number[];
  excludes: number[];
  priority: number;        // default 0
}
```

#### API endpoints
- `GET /v1/offers/` — list
- `POST /v1/offers/` — create
- `GET /v1/offers/{id}` — get
- `PATCH /v1/offers/{id}` — update
- `DELETE /v1/offers/{id}` — delete
- `POST /v1/offers/selection` — test offer selection (`{ attributes: number[], limit?: number }`)

#### Offer Selection (для тестування/preview)
```ts
// Request
{ attributes: [1, 3, 5], limit: 3 }

// Response
{
  requested_attributes: [1, 3, 5],
  total_considered: 10,
  total_eligible: 3,
  items: [{
    offer: Offer,
    score: number,
    matched_optional_count: number,
    total_optional_count: number,
    matched_optional_ids: number[],
    missing_requires_all_ids: number[],
    hit_excluded_ids: number[],
    reasoning: string[]
  }]
}
```

#### UX-правила
- Один атрибут не може бути одночасно в `requires_all` і `excludes` — UI валідація.
- `requires_optional` + `excludes` теж взаємовиключні.
- Preview кнопка: "Test selection" → вибрати набір атрибутів → показати matched offers.

---

## Додатково з original task (DAG вимога)

Щоб не розходитись з продуктними вимогами з `.claude/task/original.pdf`, у layout додаємо візуальні guardrails:
- Граф потоку відображається як DAG: questions = nodes, transitions = edges.
- Transition conditions (`always`/`answer_any`/`answer_all`) відображаються на edges.
- `to_question_id: null` = finish node.
- Підтримка типів вузлів у UI-шаблонах: `Question` (3 types), `Finish`.
- Branching: кілька transitions від одного question з різними conditions/priorities.

---

## Додатковий API: Flow Resolve Next (для preview/testing)

```ts
// POST /v1/flows/{flow_id}/next
FlowResolveNextRequest {
  current_question_id: number;
  selected_answer_ids?: number[];
}

FlowResolveNextResponse {
  flow_id: number;
  current_question_id: number;
  selected_answer_ids: number[];
  matched_transition_id: number | null;
  next_question_id: number | null;
  is_finished: boolean;
  next_question: Question | null;
}
```

Це дозволяє зробити "Preview mode" в UI: імітація проходження flow.

---

## Цільова структура UI
1. **Top (sticky header)**
   - left: title + flow select
   - center: статус (`Draft` / `Active`, `Unsaved`)
   - right: `Undo/Redo`, `History`, `Save draft`
2. **Main (3 колонки)**
   - left rail: toolbox (`Question`, `Transition`, `Finish`)
   - center: canvas (questions as nodes, transitions as edges)
   - right rail: inspector (деталі selected node/transition)
3. **Overlays**
   - Attribute manager
   - Flow management
   - History drawer
   - Offer editor
   - Flow preview (resolve next step-by-step)

---

## Технічний план

- **Server state**: TanStack Query (queries + mutations + invalidation).
- **UI state**: Zustand (canvas position, selection, local undo/redo stack, unsaved changes tracking).
- **Validation**: Zod schemas mirroring API DTOs.
- **DnD**: єдина абстракція для source/target.
- **Компоненти:**
  - `ConstructorHeader`
  - `FlowSelect`
  - `AttributeManager`
  - `QuestionCard` (contains inline answers)
  - `TransitionEditor` (condition_type, answer_ids, priority)
  - `OfferEditor` (requires_all / requires_optional / excludes)
  - `HistoryDrawer`
  - `CanvasInspector`
  - `FlowPreview` (step-by-step flow resolve)

---

## Порядок виконання (ітерації)
1. Zod schemas + TanStack Query hooks for all entities.
2. Layout skeleton (header + rails + canvas placeholders).
3. Flow select + CRUD flows via API.
4. Question/Answer UI: multi-answer + type + requires.
5. Transitions UI: condition types, answer_ids, priority, canvas edges.
6. AttributeManager + DnD/add attributes → answers.
7. Offer editor: three attribute arrays DnD + offer selection preview.
8. History drawer + rollback via API.
9. Flow preview mode (resolve next).
10. DAG guardrails + polish (responsive, a11y, empty states).

---

## Definition of Done
- [ ] Zod schemas для всіх API entities.
- [ ] TanStack Query hooks для CRUD всіх entities.
- [ ] Header є sticky і містить flow select + undo/redo/history.
- [ ] Question card з inline answers, type selector, requires switch.
- [ ] Transitions з condition_type (always/answer_any/answer_all) + answer selection.
- [ ] Атрибути CRUD + drag/add на answers.
- [ ] Offer editor з requires_all / requires_optional / excludes.
- [ ] Offer selection preview.
- [ ] Per-flow history list + rollback.
- [ ] Flow preview (resolve next step-by-step).

---

## Ризики / відкриті питання
1. ~~Немає API-лінка і контрактів DTO.~~ **Вирішено** — є OpenAPI spec.
2. Attribute model дуже простий (тільки `name`) — можливо потребує розширення в майбутньому.
3. QuestionType має typo в API: `"singe_choise"` / `"multiple_choise"` — використовувати as-is.
4. Answers не мають окремого CRUD — оновлюються тільки через `PATCH /v1/questions/{id}` з повним масивом.
5. Transitions не мають окремого CRUD — оновлюються через `PATCH /v1/flows/{id}` з повним масивом.
6. Не зафіксовані ліміти масштабування (кількість flows/nodes/transitions).
7. `start_question_id` — як визначається? Чи це перший question за position, чи окреме поле?
