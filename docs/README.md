# Tradewind — документация проекта

> B2B-платформа сорсинга из Китая. Клиенты находят проверенные заводы и закупают
> товар **только через консультанта-посредника**. Клиент никогда не общается с
> заводом напрямую, а рейтинг консультанта строится на закрытых сделках.

Это корневой документ. Подробности — в отдельных файлах:

| Документ | О чём |
|----------|-------|
| [BACKEND.md](./BACKEND.md) | NestJS API: модули, БД, эндпоинты, auth, realtime, бизнес-логика |
| [FRONTEND.md](./FRONTEND.md) | React SPA: маршруты, стор, API-слой, realtime, темы |
| [BUSINESS_RULES.md](./BUSINESS_RULES.md) | Бизнес-правила платформы в одном месте |

---

## 1. Что это за продукт

Tradewind — маркетплейс-посредник между **зарубежными покупателями** и
**китайскими заводами**. Ключевая идея: покупатель не работает с заводом
напрямую, а получает «единое окно» в лице консультанта, который:

- подбирает завод под запрос,
- ведёт переговоры с заводом по **скрытой линии** (клиент её не видит),
- выставляет клиенту оффер по запросу,
- сопровождает заказ от производства до доставки.

Платформа контролирует качество консультантов через рейтинги и trial-период,
а заводы и консультантов добавляет по приглашениям/модерации.

## 2. Роли пользователей

| Роль (`Role`) | Кто это | Что делает |
|---------------|---------|-----------|
| `client` | Покупатель | Создаёт запросы, получает офферы, принимает их → заказ, отслеживает доставку, оставляет отзывы |
| `consultant` | Посредник | Получает назначенные запросы, общается с заводом по скрытой линии, выставляет офферы, ведёт заказы |
| `factory_admin` | Представитель завода | Управляет профилем завода, продуктами, сертификатами, видит свои заказы и заявки консультантов |
| `platform_admin` | Администратор | Модерация заявок/отзывов/заводов, управление пользователями, настройки платформы, аудит |

Самостоятельно зарегистрироваться (`POST /auth/register`) могут только `client`
и `consultant`. `factory_admin` создаётся **только по инвайту** завода.
`platform_admin` создаётся через сидер/скрипт.

## 3. Ключевые бизнес-правила

Реализованы на бэке, отражены в UI. Полный список — в [BUSINESS_RULES.md](./BUSINESS_RULES.md).

1. **Скрытая линия завод↔консультант** — треды `kind=factory` недоступны клиенту (REST + WebSocket).
2. **Trial-период консультанта** считается по **закрытым заказам** (статус `closed`), не по запросам. По умолчанию 5 сделок.
3. **Пороги рейтинга**: предупреждение при рейтинге < 3.5, блокировка при < 3.0 после ≥10 отзывов.
4. **Отзывы публикуются только после одобрения админом**; есть авто-флаг подозрительного текста (ссылки, телефоны, мессенджеры, спам-слова).
5. **Авто-проверка + авто-одобрение** заявок консультантов (настраивается).
6. **Авто-назначение** консультанта на запрос: сначала специалист по категории, иначе general (по нагрузке или round-robin).
7. **Одноразовые инвайты на 48 ч**; инвайт завода авто-привязывает консультанта к заводу.

## 4. Технологический стек

| Слой | Технологии |
|------|-----------|
| **Backend** (`src/backend`) | NestJS 10, Prisma 6, PostgreSQL, Redis + BullMQ, Socket.io, JWT (access + refresh), nodemailer, Swagger |
| **Frontend** (`src/frontend`) | Vite 6, React 18, TypeScript, TanStack React Query 5, Zustand 5, React Router 6, socket.io-client, axios |

## 5. Структура репозитория

```
.
├── README.md                  корневой README (быстрый старт)
├── theme.css                  дизайн-токены (design system, темы warm/corp)
├── docs/                      ← эта документация
└── src/
    ├── backend/               NestJS API (порт 3000, префикс /api/v1)
    │   ├── prisma/            schema.prisma + seed.ts + create-admin.ts
    │   ├── src/
    │   │   ├── main.ts        bootstrap, CORS, Swagger, validation
    │   │   ├── app.module.ts  корневой модуль, глобальные guard'ы/фильтры
    │   │   ├── config/        configuration() из env
    │   │   ├── common/        guards, decorators, filters, interceptors, dto
    │   │   ├── database/      PrismaService / PrismaModule
    │   │   └── modules/       16 доменных модулей (см. BACKEND.md)
    │   ├── Dockerfile, docker-compose.yml, docker-entrypoint.sh
    │   └── .env.example
    └── frontend/              React SPA (порт 5173)
        └── src/
            ├── api/           типизированные клиенты под каждый модуль API
            ├── store/         Zustand: auth + theme
            ├── hooks/         useAuth, useSocket
            ├── pages/         public / auth / dashboard (client·consultant·factory·admin)
            └── components/    ui + layout
```

## 6. Как взаимодействуют фронт и бэк

- **Обёртка ответов**: каждый ответ API имеет вид `{ success, data, timestamp }`.
  Фронт разворачивает его хелпером `unwrap()` в `src/frontend/src/api/client.ts`.
- **Пагинация**: `{ items, total, page, limit, totalPages }`.
- **JWT**: access-токен в заголовке `Authorization: Bearer`, refresh — в httpOnly-cookie.
  Axios-интерсептор автоматически обновляет access по ответу 401.
- **Realtime-чат**: Socket.io namespace `/messaging`, события `join_thread` /
  `send_message` / `new_message`. REST-поллинг как fallback.
- **Прокси в dev**: Vite проксирует `/api` → `http://localhost:3000`.

```
┌────────────┐   HTTPS /api/v1 (JWT)    ┌──────────────┐   Prisma   ┌────────────┐
│ React SPA  │ ───────────────────────► │  NestJS API  │ ─────────► │ PostgreSQL │
│ :5173      │ ◄─── Socket.io /messaging │  :3000       │            └────────────┘
└────────────┘                          │              │ ──► Redis (BullMQ)
                                        └──────────────┘ ──► SMTP (email)
```

## 7. Быстрый старт

### Backend через Docker (рекомендуется)

Нужен запущенный **Docker Desktop**. Одна команда поднимает Postgres + Redis +
API, накатывает схему и засевает demo-данные:

```bash
cd src/backend
docker compose up --build
```

API: **http://localhost:3000/api/v1** · Swagger: **http://localhost:3000/api/docs**

### Frontend

```bash
cd src/frontend
npm install
npm run dev          # http://localhost:5173
```

### Demo-аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Админ | `admin@tradewind.app` | `Admin@123!` |
| Консультант | `consultant@tradewind.app` | `Consult@123!` |
| Клиент | `client@tradewind.app` | `Client@123!` |

Подробные инструкции по запуску (в т.ч. без Docker) — в корневом
[../README.md](../README.md) и в [BACKEND.md](./BACKEND.md) / [FRONTEND.md](./FRONTEND.md).
