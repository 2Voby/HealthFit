# ADMIN IMPROVEMENTS PLAN (layout-only, mock-first)

## Вхідний контекст
- Прочитано `admin_front/CLAUDE.md` (архітектура адмін-конструктора, DnD напрямок).
- Прочитано `.claude/task/original.pdf` (вимоги до DAG-опитувальника, branching, персоналізований offer).
- `.claude/tasks` у репозиторії відсутній; знайдений лише `.claude/task/original.pdf`.

## Важливе уточнення
**API-лінк не був доданий у промпт.**
Для п.7 (реальні структури даних з API) потрібні:
1. base URL,
2. endpoint-и для flows/questions/answers/offers/attributes/history,
3. приклади payload-ів або OpenAPI/Swagger.

До отримання цього — робимо тільки layout + mock data.

---

## Scope цього етапу
- Тільки UI/layout.
- Без backend інтеграції.
- Моки для всіх сутностей.
- Архітектура готова до швидкої заміни mock -> API.

---

## План по задачах (відповідає 1..8)

### 1) Header + форма атрибутів + dropdown атрибутів з DnD на answers
### Що будуємо
- Sticky `ConstructorHeader`:
  - Назва конструктора.
  - Flow Select.
  - Кнопки: `Undo`, `Redo`, `History`, `Save draft`.
- `AttributeManager` (sheet/popover):
  - Форма атрибута: `key`, `label`, `type`, `group`, `allowedValues`.
  - Dropdown/command list з пошуком атрибутів.
- В `AnswerCard`:
  - блок `Applied attributes`;
  - drop-zone для перетягування атрибутів.

### UX-деталі
- Видимі стани drag: default / over-valid / over-invalid / dropped.
- Якщо атрибут несумісний — drop забороняється, показується toast/hint.

---

### 2) До одного question привʼязувати кілька answers
### Що будуємо
- `QuestionCard` містить `Answers list`.
- Кнопка `+ Add answer`.
- Reorder answers drag-handle-ом.
- Empty state, якщо answers тимчасово немає.

### Mock shape
```ts
Question {
  id: string;
  title: string;
  required: boolean;
  answerIds: string[];
}
```

---

### 3) Після answer може бути тільки один question
### Що будуємо
- Правило на canvas: `Answer -> max 1 outgoing edge to Question`.
- При спробі другого лінка:
  - або блок,
  - або confirm `Replace existing link`.
- Для draft дозволяємо 0..1, для publish-ready підсвічуємо `missing next question`.

### UX-індикатори
- Badge `Linked` / `Unlinked` на `AnswerCard`.

---

### 4) Поле `required` у question (можна скіпнути чи ні)
### Що будуємо
- Switch `Required` у `QuestionCard`.
- Підпис:
  - `Required=true` — скіп заборонений.
  - `Required=false` — скіп дозволений.
- У списках/картках — chip `Required` або `Optional`.

---

### 5) Flow select у header + перемикання між flows
### Що будуємо
- `FlowSelect` (combobox):
  - список flow;
  - `Create`, `Duplicate`, `Rename`, `Archive/Delete` (локально в mock).
- На зміну flow:
  - canvas перезавантажується під конкретний flow;
  - показуємо `Unsaved changes` для активного flow.

### Mock shape
```ts
Flow {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  attributes: Attribute[];
  offers: OfferConfig;
  history: FlowAction[];
}
```

---

### 6) Для кожного flow — history actions + rollback
### Що будуємо
- `HistoryDrawer`:
  - список action-ів з timestamp і коротким описом;
  - кнопка `Restore this point`.
- Header-кнопки `Undo/Redo`.
- Історія ізольована по flow (перемкнули flow -> інша історія).

### Mock shape
```ts
FlowAction {
  id: string;
  at: string;
  type: string;
  summary: string;
  snapshot: Flow; // або pointer на snapshot
}
```

---

### 7) Структури даних взяти з API
### Поточний статус
- Заблоковано відсутністю API-лінка/контракту в запиті.

### План інтеграції після отримання API
1. Порівняти DTO API vs mock model.
2. Додати `adapters/*` (`api -> ui`, `ui -> api`).
3. Замінити mock store на query/mutation слой без змін layout-компонентів.
4. Додати runtime валідацію payload (zod) для безпечної міграції.

---

### 8) В offer є різні масиви атрибутів — налаштовувати DnD
### Що будуємо
- `OfferAttributesBoard` з кількома секціями масивів (імена тимчасово mock):
  - `primaryAttributes`,
  - `secondaryAttributes`,
  - `constraints`.
- Можливості:
  - reorder в межах секції,
  - move між секціями (якщо валідно),
  - add/remove через dropdown.

### UX-правила
- Несумісні move/drop підсвічуються як invalid.
- За потреби — ліміти по кількості елементів у масиві.

---

## Додатково з original task (DAG вимога)
Щоб не розходитись з продуктними вимогами з `.claude/task/original.pdf`, у layout додаємо візуальні guardrails:
- Граф потоку відображається як DAG (на рівні UI — попередження про потенційний цикл).
- Підтримка типів вузлів у UI-шаблонах: `Question`, `InfoPage`, `Offer` (мінімальні mock-картки).
- Підготовка місця під branching rules по атрибутах (без rule-engine на цьому етапі).

---

## Цільова структура UI
1. **Top (sticky header)**
   - left: title + flow select
   - center: статус (`Draft`, `Unsaved`)
   - right: `Undo/Redo`, `History`, `Save draft`
2. **Main (3 колонки)**
   - left rail: toolbox (`Question`, `Answer`, `Info`, `Offer`, `Connection`)
   - center: canvas
   - right rail: inspector (деталі selected node)
3. **Overlays**
   - Attribute manager
   - Flow management
   - History drawer

---

## Технічний план (frontend only)
- Store: Zustand (flow state + ui state + per-flow history).
- DnD: єдина абстракція для source/target (щоб легко замінити бібліотеку).
- Компоненти:
  - `ConstructorHeader`
  - `FlowSelect`
  - `AttributeManager`
  - `QuestionCard`
  - `AnswerCard`
  - `OfferAttributesBoard`
  - `HistoryDrawer`
  - `CanvasInspector`

---

## Порядок виконання (ітерації)
1. Layout skeleton (header + rails + canvas placeholders).
2. Flow select + mock CRUD flows.
3. Question/Answer UI: multi-answer + required.
4. Constraint: one-next-question-after-answer.
5. AttributeManager + DnD attributes -> answers.
6. Offer arrays DnD board.
7. History drawer + undo/redo + restore snapshot.
8. DAG guardrails + polish (responsive, a11y, empty states).

---

## Definition of Done
- [ ] Header є sticky і містить flow select + undo/redo/history.
- [ ] Для question доступно кілька answers + reorder.
- [ ] Для answer неможливо створити >1 next question.
- [ ] Поле `required` працює і відображається в UI.
- [ ] Атрибути перетягуються на answer і в offer-масивах.
- [ ] Є per-flow history і rollback до action.
- [ ] Layout працює повністю на mock даних.
- [ ] Код готовий до переходу на API через adapter layer.

---

## Ризики / відкриті питання
1. Немає API-лінка і контрактів DTO.
2. Не зафіксовані точні типи атрибутів і правила сумісності.
3. Не зафіксовані publish-правила (чи допускається незвʼязаний answer у draft).
4. Не зафіксовані ліміти масштабування (кількість flows/nodes/edges).

## Що потрібно від вас (для старту API етапу)
- Надішліть API-лінк (або OpenAPI/Swagger).
- Дайте приклади реальних payload для flow/question/answer/offer/history.
- Підтвердіть терміни масивів в offer (остаточні назви полів).
