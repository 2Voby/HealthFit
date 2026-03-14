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
- All `GET` endpoints for `users`, `attributes`, `questions`, `offers` are public (no auth).
- All `POST`, `PATCH`, `DELETE` endpoints for `users`, `attributes`, `questions`, `offers` require `edit_elements`.

Additional CRUD:
- `GET/POST/PATCH/DELETE /v1/attributes`
- `GET/POST/PATCH/DELETE /v1/questions`
- `GET/POST/PATCH/DELETE /v1/offers`

## Bootstrap
On startup app creates authorities from `BOOTSTRAP_AUTHORITIES_CSV`.
If `BOOTSTRAP_ADMIN_LOGIN` and `BOOTSTRAP_ADMIN_PASSWORD` are set, first run creates admin and grants `BOOTSTRAP_ADMIN_AUTHORITIES_CSV`.
