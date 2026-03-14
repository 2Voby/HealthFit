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

Protected users CRUD:
- `GET /v1/users`, `GET /v1/users/{id}` require `read_users`
- `POST /v1/users`, `PATCH /v1/users/{id}`, `DELETE /v1/users/{id}` require `edit_users`

## Bootstrap
On startup app creates authorities from `BOOTSTRAP_AUTHORITIES_CSV`.
If `BOOTSTRAP_ADMIN_LOGIN` and `BOOTSTRAP_ADMIN_PASSWORD` are set, first run creates admin and grants `BOOTSTRAP_ADMIN_AUTHORITIES_CSV`.
