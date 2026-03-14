# FastAPI + Postgres + Redis Sessions

## Stack
- FastAPI
- Tortoise ORM
- PostgreSQL
- Redis (server-side sessions in cookie)
- Pydantic Settings
- Docker / Docker Compose

## Run
```bash
cp .env.example .env
docker compose up --build
```

Swagger UI:
- http://localhost:8000/docs
- Health check: `GET /v1/health`
- Static API examples: `GET /static/api_examples.html`

## Auth flow
1. `POST /v1/auth/register` or `POST /v1/auth/login`
2. API sets `session_id` httpOnly cookie
3. `GET /v1/auth/me` reads user from Redis session
4. `POST /v1/auth/logout` removes Redis session + cookie

## Authorities
- `read_users`
- `edit_users`
- `edit_elements`

Access rules:
- All `GET` endpoints for `users`, `attributes`, `questions`, `offers`, `flows` are public (no auth).
- All `POST`, `PATCH`, `DELETE` endpoints for `users`, `attributes`, `questions`, `offers`, `flows` require `edit_elements`.
- Exceptions (public, no auth): `POST /v1/offers/selection`, `POST /v1/flows/active/next`, `POST /v1/flows/{id}/next`.

Additional CRUD:
- `GET/POST/PATCH/DELETE /v1/attributes`
- `GET/POST/PATCH/DELETE /v1/questions`
- `GET/POST/PATCH/DELETE /v1/offers`
- `GET/POST/PATCH/DELETE /v1/flows`
- `GET /v1/flows/{id}/history`
- `GET /v1/flows/{id}/history/{revision}`
- `POST /v1/flows/{id}/rollback/{revision}` (requires `edit_elements`)

Offer selection:
- `POST /v1/offers/selection` with `{ "attributes": [1,2,3], "limit": 3 }`
- Filters by `requires_all` and `excludes`, ranks by `priority` + matched `requires_optional`.

Active flow:
- `GET /v1/flows/active` returns only active flow with ordered questions and answers.
- Flow has `is_active`, and when one flow is activated via create/update, others are deactivated automatically.
- Flow also supports branching transitions configured by answer ids:
  - `condition_type`: `always | answer_any | answer_all`
  - `from_question_id` -> `to_question_id` (nullable for flow end)
  - `answer_ids` are required for `answer_any/answer_all` and must belong to `from_question_id`.
- `POST/PATCH /v1/flows` payload example:
  - `question_ids`: ordered list of questions in flow
  - `transitions`: list of transition rules
  - Example transition:
    - `{ "from_question_id": 2, "to_question_id": 3, "condition_type": "answer_any", "answer_ids": [11], "priority": 10 }`
- Next-step resolution:
  - `POST /v1/flows/active/next` or `POST /v1/flows/{id}/next`
  - Request:
    - `{ "current_question_id": 2, "selected_answer_ids": [11] }`
  - Response:
    - `matched_transition_id`, `next_question_id`, `is_finished`, `next_question`
- Flow history and rollback:
  - Every `create/update/rollback` of flow writes a snapshot revision to flow history.
  - Every `POST/PATCH/DELETE` in `attributes/questions/offers` also writes `dependency_update` revision for all flows.
  - Rollback endpoint restores flow name, `is_active`, ordered `question_ids`, and `transitions` from selected revision.

## Bootstrap
On startup app creates authorities from `BOOTSTRAP_AUTHORITIES_CSV`.
If `BOOTSTRAP_ADMIN_LOGIN` and `BOOTSTRAP_ADMIN_PASSWORD` are set, first run creates admin and grants `BOOTSTRAP_ADMIN_AUTHORITIES_CSV`.
If `BOOTSTRAP_MOCK_DATA=true`, first run also seeds mock `attributes`, `questions`, `offers`, and one active `flow`.
