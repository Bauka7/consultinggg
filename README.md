# Tradewind — B2B China Sourcing Platform

Полноценная платформа: клиенты находят проверенные заводы и закупают через
проверенных консультантов. Клиент никогда не общается с заводом напрямую,
не видит оптовую цену завода, а рейтинг консультанта строится на закрытых сделках.

## Стек

| Слой | Технологии |
|------|-----------|
| **Backend** (`src/backend`) | NestJS 10, Prisma 6, PostgreSQL, Redis, BullMQ, Socket.io, JWT (access + refresh), nodemailer |
| **Frontend** (`src/frontend`) | Vite 6, React 18, TypeScript, React Query, Zustand, React Router 6, socket.io-client |

## Структура

```
src/
├── backend/          NestJS API (порт 3000, префикс /api/v1)
│   ├── prisma/       схема БД + сидер
│   └── src/
│       ├── modules/  auth, users, consultants, factories, categories,
│       │             requests, offers, orders, messaging, reviews,
│       │             invites, admin, audit, email
│       ├── common/   guards, decorators, filters, interceptors
│       └── database/ PrismaService
└── frontend/         React SPA (порт 5173)
    └── src/
        ├── api/      типизированные клиенты под каждый модуль API
        ├── store/    Zustand: auth + theme
        ├── pages/    public / auth / dashboard (client·consultant·factory·admin)
        └── components/ ui + layout
```

## Запуск

### Весь стек через Docker (рекомендуется)

Нужен запущенный **Docker Desktop**. Одна команда поднимает Postgres + Redis +
API + фронт (nginx), накатывает миграции и засевает demo-данные:

```bash
cd src/backend
docker compose up --build
```

Что произойдёт:
1. Поднимутся `postgres` и `redis` (healthcheck — API ждёт их готовности).
2. Соберётся образ API, выполнится `prisma migrate deploy` (применит миграции).
3. При `RUN_SEED=true` засеются категории, настройки и demo-аккаунты.
4. API станет healthy на **http://localhost:3000/api/v1** (Swagger: `/api/docs`, health: `/health`).
5. Соберётся и поднимется фронт-nginx на **http://localhost:8080** (реверс-прокси `/api` и `/socket.io` на API).

Точка входа для пользователя — **http://localhost:8080**.

Полезное:
- `docker compose up --build -d` — в фоне
- `docker compose logs -f api` — логи API
- `docker compose down` — остановить (данные в volume сохранятся)
- `docker compose down -v` — остановить и стереть БД (чистый старт)
- прод-секреты: `JWT_SECRET=... JWT_REFRESH_SECRET=... docker compose up` (по умолчанию демо-значения)

Demo-аккаунты:
- `admin@tradewind.app` / `Admin@123!`
- `consultant@tradewind.app` / `Consult@123!`
- `client@tradewind.app` / `Client@123!`
- `factory@tradewind.app` / `Factory@123!`

### Frontend — dev-режим (Vite, с hot-reload)
```bash
cd src/frontend
npm install
npm run dev                   # http://localhost:5173
```
Vite проксирует `/api` → `http://localhost:3000`, поэтому dev-фронт сразу работает с API в Docker.

### Backend — без Docker (альтернатива)
Нужны локальные PostgreSQL и Redis. Затем:
```bash
cd src/backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy     # применить миграции (или dev: prisma migrate dev)
npx ts-node prisma/seed.ts
npm run start:dev
```
Тесты: `npm run test:e2e` (нужны поднятые и засеянные Postgres+Redis).

## Интеграция фронт ↔ бэк

- Все ответы API обёрнуты `{ success, data, timestamp }` — фронт разворачивает их
  единым хелпером `unwrap()` в `src/frontend/src/api/client.ts`.
- Пагинация: `{ items, total, page, limit, totalPages }`.
- JWT: access-токен в заголовке, refresh — в httpOnly-cookie. Интерсептор
  автоматически обновляет access по 401.
- Realtime-чат: Socket.io namespace `/messaging`, события `join_thread` /
  `new_message`. REST-поллинг как fallback.
- Бизнес-правила (скрытая линия завод↔консультант,
  trial по закрытым сделкам, пороги рейтинга 3.5/3.0, авто-назначение,
  одноразовые инвайты 48 ч) реализованы на бэке и отражены в UI.

## Сборка production
```bash
cd src/backend  && npm run build   # dist/
cd src/frontend && npm run build   # dist/
```
