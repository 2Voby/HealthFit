# HealthFit

Монорепа з:
- `backend` — FastAPI + Tortoise ORM + Postgres + Redis
- `admin_front` — адмінка-конструктор квізів на React + Vite
- `client_front` — клієнтський фронт квізу на React + Vite

## Швидкий старт через Docker

1. Створи кореневий `.env`:

```bash
cp .env.example .env
```

2. Підніми весь проєкт:

```bash
docker compose up --build
```

3. Сервіси будуть доступні тут:
- client: `http://localhost:3001`
- admin: `http://localhost:3000`
- api: `http://localhost:18247`
- swagger: `http://localhost:18247/docs`

## Тести в Docker

```bash
docker compose --profile test up --build tests
```

або:

```bash
docker compose --profile test run --rm tests
```

## Локальний запуск без Docker

### 1. Backend

Потрібні окремо запущені Postgres і Redis, а змінні мають бути в кореневому `.env`.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. uvicorn src.main:app --reload
```

API за замовчуванням стартує на `http://localhost:8000`.

### 2. Admin frontend

```bash
cd admin_front
npm install
npm run dev
```

Dev server: `http://localhost:5173`

### 3. Client frontend

```bash
cd client_front
npm install
npm run dev
```

Dev server: `http://localhost:5173`

Примітка:
- обидва Vite-проєкти читають змінні з root `.env`
- для локальної розробки фронтів з локальним бекендом зазвичай достатньо:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## Корисні змінні в `.env`

Основні:
- `VITE_API_URL`, `VITE_WS_URL`
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB`, `REDIS_PASSWORD`
- `BOOTSTRAP_MOCK_DATA`
- `BOOTSTRAP_ADMIN_LOGIN`
- `BOOTSTRAP_ADMIN_PASSWORD`

Порти для Docker теж винесені в `.env`:
- `API_EXTERNAL_PORT`
- `ADMIN_FRONT_EXTERNAL_PORT`
- `CLIENT_FRONT_EXTERNAL_PORT`
- `POSTGRES_EXTERNAL_PORT`
- `REDIS_EXTERNAL_PORT`

Повний список є в [`/.env.example`](/home/artem/PycharmProjects/int20h_final_bebra/.env.example).

## Bootstrap

При першому старті бекенд може автоматично:
- створити admin-користувача
- засіяти mock-дані
- створити дефолтний flow, питання, атрибути й оффери

Дефолтні логін/пароль адміністратора беруться з `.env`:
- `BOOTSTRAP_ADMIN_LOGIN=admin`
- `BOOTSTRAP_ADMIN_PASSWORD=admin12345`

## Як обчислюється оффер

Підбір працює через атрибути, які збираються з відповідей у квізі:
- кожна відповідь може додати один або кілька атрибутів
- після завершення квізу бекенд відправляє набір зібраних атрибутів у selection engine
- selection engine порівнює їх з умовами кожного оффера

У кожного оффера є 3 типи умов:
- `requires_all`: усі ці атрибути мають бути в користувача, інакше оффер відсікається
- `requires_optional`: необов'язкові атрибути, які підвищують релевантність і score
- `excludes`: якщо хоч один із цих атрибутів присутній, оффер відсікається

Алгоритм відбору:
- спочатку відкидаються всі оффери, де не збіглись `requires_all` або спрацювали `excludes`
- з решти формується список eligible-офферів
- eligible-оффери сортуються за `score`, де головний фактор це `priority`
- далі до score додається бонус за кількість збігів у `requires_optional`
- також є невеликий бонус за більш специфічні оффери, в яких більше умов

Формально ранжування зараз таке:
- `priority` має найбільшу вагу
- потім враховується `matched_optional_count` і покриття `requires_optional`
- далі враховується специфічність оффера: скільки в нього `requires_all` і `requires_optional`

Fallback:
- якщо не знайдено жодного eligible-оффера, бекенд повертає оффери з `default=true`, якщо такі існують
## Структура

```text
.
├── admin_front
├── backend
├── client_front
├── docker-compose.yml
└── .env.example
```
