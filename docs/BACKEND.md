# Backend — Tradewind API

NestJS 10 + Prisma 6 + PostgreSQL. REST API под префиксом `/api/v1`, realtime —
через Socket.io namespace `/messaging`. Документация Swagger доступна на `/api/docs`.

- **Точка входа**: [`src/main.ts`](../src/backend/src/main.ts)
- **Корневой модуль**: [`src/app.module.ts`](../src/backend/src/app.module.ts)
- **Схема БД**: [`prisma/schema.prisma`](../src/backend/prisma/schema.prisma)

---

## 1. Архитектура и bootstrap

`main.ts` поднимает приложение и настраивает:

- **CORS** — разрешён `FRONTEND_URL` (по умолчанию `http://localhost:5173`) + `localhost:3001`, с `credentials: true`.
- **cookie-parser** — для refresh-токена в httpOnly-cookie.
- **Глобальный префикс** `api/v1`.
- **ValidationPipe** глобально: `whitelist: true`, `transform: true`, неявная конверсия типов (DTO на `class-validator`).
- **ClassSerializerInterceptor** — сериализация ответов.
- **Swagger** на `/api/docs` с bearer-auth и описанием бизнес-правил.

### Глобальные провайдеры (`app.module.ts`)

Регистрируются на уровне всего приложения:

| Тип | Класс | Назначение |
|-----|-------|-----------|
| `APP_GUARD` | `JwtAuthGuard` | Все маршруты защищены по умолчанию; открыть — декоратором `@Public()` |
| `APP_GUARD` | `RolesGuard` | Проверка ролей по декоратору `@Roles(...)` |
| `APP_FILTER` | `PrismaExceptionFilter` | Маппинг ошибок Prisma → HTTP |
| `APP_FILTER` | `HttpExceptionFilter` | Единый формат ошибок |
| `APP_INTERCEPTOR` | `LoggingInterceptor` | Логирование запросов |
| `APP_INTERCEPTOR` | `TransformInterceptor` | Обёртка ответов `{ success, data, timestamp }` |

Инфраструктурные модули: `ConfigModule` (global, с `validateEnv`), `ThrottlerModule`
(rate-limit 100 запросов / 60 c), `BullModule` (Redis-очереди для инвайтов),
`PrismaModule`, `RedisModule` (`ioredis`-клиент).

### Формат ответа

Все успешные ответы оборачиваются `TransformInterceptor`:

```jsonc
{ "success": true, "data": <payload>, "timestamp": "2026-06-11T..." }
```

Пагинированные эндпоинты возвращают в `data`:

```jsonc
{ "items": [...], "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
```

Параметры пагинации (`PaginationDto`): `page` (≥1, по умолч. 1), `limit`
(1–100, по умолч. 20), `search` (строка). См.
[`common/dto/pagination.dto.ts`](../src/backend/src/common/dto/pagination.dto.ts).

---

## 2. Аутентификация и авторизация

### Токены

- **Access-токен** — JWT, по умолчанию TTL 15 мин, передаётся в `Authorization: Bearer <token>`. Секрет `JWT_SECRET`.
- **Refresh-токен** — JWT, TTL 7 дней, кладётся в **httpOnly-cookie** `refreshToken`. Секрет `JWT_REFRESH_SECRET`. Хеш refresh-токена хранится в БД (`User.refreshToken`).
- Payload: `{ sub: userId, email, role }`.

### Поток

1. `POST /auth/login` или `/auth/register` → возвращает `accessToken` + ставит cookie `refreshToken`.
2. Клиент шлёт access в заголовке. При `401` фронт зовёт `POST /auth/refresh` (cookie → новый access).
3. `POST /auth/logout` обнуляет `refreshToken` в БД и чистит cookie.

Стратегии Passport: `jwt` (access, [`strategies/jwt.strategy.ts`](../src/backend/src/modules/auth/strategies/jwt.strategy.ts)) и `jwt-refresh` (refresh из cookie).

### Декораторы и guard'ы

- `@Public()` — снимает `JwtAuthGuard` с маршрута.
- `@Roles(Role.x, ...)` — ограничивает доступ ролями (через `RolesGuard`).
- `@CurrentUser()` / `@CurrentUser('id')` — достаёт пользователя/поле из request.

### Сброс пароля

`POST /auth/forgot-password` генерирует криптослучайный токен (`crypto.randomBytes`),
кладёт его в **Redis** с TTL 1 ч (ключ `pwreset:<token>`) и шлёт письмо через
`EmailService`. `POST /auth/reset-password` валидирует токен по Redis, меняет
пароль и удаляет ключ. Хранение в Redis переживает рестарт и работает на нескольких
инстансах (Redis-клиент — `RedisModule`, провайдер `REDIS_CLIENT` на `ioredis`).

> **Безопасность паролей**: bcrypt, cost 12. Заблокированный пользователь
> (`status=blocked`) не может войти/обновить токен.

---

## 3. Модель данных (Prisma)

PostgreSQL. Полная схема — [`schema.prisma`](../src/backend/prisma/schema.prisma).

### Основные сущности

| Модель | Назначение | Ключевые связи |
|--------|-----------|----------------|
| `User` | Аккаунт (любая роль) | 1–1 `ConsultantProfile` / `Factory` (владелец) |
| `ConsultantProfile` | Профиль консультанта | рейтинг, trial, категории, заводы, офферы, заказы |
| `Category` | Категория товаров | заводы, консультанты, запросы |
| `Factory` | Завод | продукты, сертификаты, заказы, привязанные консультанты |
| `Product` / `Certificate` | Продукция и сертификаты завода | → `Factory` |
| `ConsultantFactoryLink` | Привязка консультант↔завод | M–N |
| `Request` | Запрос клиента на сорсинг | клиент, категория, назначенный консультант, офферы, тред |
| `Offer` | Оффер консультанта по запросу | → `Request`, `Factory` (опц.), `Order` |
| `Order` | Заказ (из принятого оффера) | клиент, консультант, завод, история статусов, треды |
| `OrderStatusHistory` | Журнал смены статусов заказа | → `Order`, `actor` |
| `Thread` / `Message` | Чат-треды и сообщения | `kind`: client / factory / support |
| `Review` | Отзыв на консультанта | модерация + авто-флаг |
| `ConsultantApplication` | Заявка стать консультантом (без аккаунта) | авто-проверка |
| `ConsultantFactoryApplication` | Заявка консультанта на работу с заводом | модерация заводом |
| `Invite` | Одноразовый инвайт (consultant/factory) | TTL 48 ч |
| `AuditLog` | Журнал действий | действие, actor, IP |
| `PlatformSettings` | Глобальные настройки (single-row, id=1) | пороги, флаги авто-логики |

### Enum'ы статусов

```
Role          : client | consultant | factory_admin | platform_admin
UserStatus    : active | trial | blocked
RequestStatus : draft | work | wait | done | declined
OfferStatus   : pending | accepted | revision | expired
OrderStatus   : draft | pending | confirmed | production | qc |
                shipped | transit | delivered | closed | cancelled
ThreadKind    : client | factory | support
ReviewStatus  : pending | approved | removed
ApplicationStatus : review | trial | approved | rejected
AutoCheckResult   : pass | flag | fail
InviteRole/Status : consultant|factory / pending|used|expired
AssignRule    : load | round_robin
```

### PlatformSettings (значения по умолчанию)

| Поле | Default | Смысл |
|------|---------|-------|
| `trialOrders` | 5 | Закрытых сделок для выхода из trial |
| `warnThreshold` | 3.5 | Порог предупреждения по рейтингу |
| `blockThreshold` | 3.0 | Порог блокировки (после ≥10 отзывов) |
| `autoApprove` | false | Авто-одобрение заявок консультантов |
| `autoAssign` | true | Авто-назначение консультанта на запрос |
| `assignRule` | load | Стратегия назначения general-консультанта |

---

## 4. Модули

15 доменных модулей в `src/modules/`. Каждый — стандартная NestJS-тройка
`*.module.ts` / `*.controller.ts` / `*.service.ts` (+ DTO).

| Модуль | Ответственность |
|--------|-----------------|
| `auth` | Регистрация, вход, refresh, logout, сброс пароля, регистрация по инвайту |
| `users` | Профиль `me`, смена пароля, управление пользователями (admin) |
| `consultants` | Профили консультантов, заявки, рейтинг, trial, заявки на заводы |
| `factories` | Заводы, продукты, сертификаты, авто-подбор консультанта, заявки |
| `categories` | Справочник категорий товаров |
| `requests` | Запросы клиентов, авто-назначение консультанта, статусы |
| `offers` | Офферы консультантов, принятие → создание заказа, ревизия, истечение |
| `orders` | Заказы, машина состояний статусов, трекинг, история |
| `messaging` | Треды и сообщения (REST) + WebSocket-gateway (realtime) |
| `reviews` | Отзывы, авто-флаг, модерация, пересчёт рейтинга |
| `invites` | Одноразовые инвайты с TTL 48 ч (BullMQ-экспирация) |
| `admin` | Дашборд, настройки, модерация, блокировки, аудит |
| `audit` | Запись и чтение журнала действий |
| `email` | Отправка писем (nodemailer): инвайты, сброс пароля, одобрение |
| `health` | Liveness/readiness-проба (`GET /health` — пинг БД и Redis) |
| `database` | `PrismaService` (общий) |
| `RedisModule` | Глобальный `ioredis`-клиент (`REDIS_CLIENT`) для reset-токенов |

---

## 5. Справочник API

Базовый URL: `http://localhost:3000/api/v1`. Колонка «Доступ»: 🔓 публичный
(`@Public`), 🔒 авторизованный, далее — требуемые роли.

### auth — `/auth`
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| POST | `/auth/login` | 🔓 | Вход по email+паролю |
| POST | `/auth/register` | 🔓 | Самостоятельная регистрация (только client/consultant) |
| POST | `/auth/register/invite` | 🔓 | Регистрация по одноразовому инвайту |
| POST | `/auth/refresh` | 🔓 (cookie) | Обновить access-токен |
| POST | `/auth/logout` | 🔒 | Выход, сброс refresh |
| POST | `/auth/forgot-password` | 🔓 | Запрос письма для сброса |
| POST | `/auth/reset-password` | 🔓 | Сброс пароля по токену |

### users — `/users`
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/users/me` | 🔒 | Текущий профиль |
| PATCH | `/users/me` | 🔒 | Обновить профиль |
| POST | `/users/me/change-password` | 🔒 | Смена пароля |
| GET | `/users` | admin | Список пользователей |
| GET | `/users/:id` | admin, consultant | Пользователь по id |
| POST | `/users/:id/block` · `/unblock` | admin | Блок/разблок |
| DELETE | `/users/:id` | admin | Удаление |

### consultants — `/consultants`
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/consultants` | 🔓 | Каталог консультантов (фильтр по категории, поиск) |
| GET | `/consultants/:id` | 🔓 | Профиль консультанта |
| GET | `/consultants/:id/reviews` | 🔓 | Одобренные отзывы |
| GET | `/consultants/me/profile` | consultant | Свой профиль |
| PATCH | `/consultants/me/profile` | consultant | Обновить профиль/категории |
| POST | `/consultants/me/apply-factory/:factoryId` | consultant | Подать заявку на работу с заводом |
| POST | `/consultants/apply` | 🔓 | Подать заявку стать консультантом |

### factories — `/factories`
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/factories` | 🔓 | Каталог заводов (фильтры: категория, провинция, поиск) |
| GET | `/factories/:id` | 🔓 | Карточка завода (активные продукты, сертификаты, консультанты) |
| GET | `/factories/me/factory` | factory_admin | Свой завод (все продукты/сертификаты) |
| PATCH | `/factories/me/factory` | factory_admin | Обновить свой завод |
| POST | `/factories` | admin | Создать завод (без владельца) |
| PATCH | `/factories/:id` | admin, factory_admin | Обновить завод |
| POST | `/factories/:id/verify` | admin | Верифицировать |
| GET | `/factories/:id/applications` | admin, factory_admin | Заявки консультантов на завод |
| POST | `/factories/:id/applications/:appId/approve` · `/reject` | admin, factory_admin | Модерация заявки |

### categories — `/categories`
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/categories` · `/:id` · `/slug/:slug` | 🔓 | Чтение справочника |
| POST · PATCH · DELETE | `/categories[/:id]` | admin | CRUD |

### requests — `/requests`
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| POST | `/requests` | client | Создать запрос (авто-назначение консультанта) |
| GET | `/requests` | 🔒 | Список (скоуп по роли) |
| GET | `/requests/:id` | 🔒 | Детали (с проверкой доступа) |
| POST | `/requests/:id/decline` | client | Отклонить запрос |
| PATCH | `/requests/:id/status` | 🔒 | Сменить статус |
| POST | `/requests/:id/assign` | admin | Назначить консультанта вручную |

### offers — `/offers`
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| POST | `/offers` | consultant | Создать оффер (только по назначенному запросу) |
| GET | `/offers` | 🔒 | Список (клиент не видит expired) |
| GET | `/offers/:id` | 🔒 | Детали |
| POST | `/offers/:id/accept` | client | Принять → создаётся заказ |
| POST | `/offers/:id/revision` | client | Запросить доработку |
| POST | `/offers/:id/expire` | admin, consultant | Истечь оффер |

### orders — `/orders`
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/orders` | 🔒 | Список (скоуп по роли) |
| GET | `/orders/:id` | 🔒 | Детали + история статусов |
| PATCH | `/orders/:id` | 🔒 | Смена статуса (с валидацией перехода) / поля |
| PATCH | `/orders/:id/tracking` | consultant, admin | Карго, трек-номер, ETA |
| GET | `/orders/:id/history` | 🔒 | Журнал статусов |

### messaging — `/messaging`
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/messaging/threads` | 🔒 | Треды (скоуп по роли; клиент не видит factory-треды) |
| GET | `/messaging/unread` | 🔒 | Кол-во непрочитанных |
| GET | `/messaging/threads/:id` | 🔒 | Тред |
| POST | `/messaging/threads` | 🔒 | Создать тред (клиент не может factory) |
| GET | `/messaging/threads/:id/messages` | 🔒 | Сообщения (помечает прочитанными) |
| POST | `/messaging/threads/:id/messages` · `/messages` | 🔒 | Отправить сообщение |
| PATCH | `/messaging/messages/:id/read` | 🔒 | Отметить прочитанным |

### reviews — `/reviews`
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| POST | `/reviews` | client | Оставить отзыв (один на консультанта) |
| GET | `/reviews` · `/pending` · `/flagged` | admin | Списки для модерации |
| POST | `/reviews/:id/approve` · `/remove` | admin | Одобрить/удалить (пересчёт рейтинга) |

### invites — `/invites`
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| POST | `/invites` | admin, factory_admin | Создать инвайт (TTL 48 ч) |
| GET | `/invites/validate/:token` | 🔓 | Проверить инвайт |
| GET | `/invites` | admin, factory_admin | Список инвайтов |
| POST | `/invites/:id/revoke` | admin, factory_admin | Отозвать |

### admin — `/admin` (все — `platform_admin`)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/admin/dashboard` | Сводная статистика |
| GET·PATCH | `/admin/settings` | Чтение/изменение `PlatformSettings` |
| GET | `/admin/users` | Пользователи |
| POST | `/admin/users/:id/block` · `/unblock` | Блок/разблок |
| GET | `/admin/consultant-applications` | Заявки консультантов |
| POST | `/admin/consultant-applications/:id/moderate` | Модерация (создаёт аккаунт+письмо) |
| POST | `/admin/consultants/:id/verify` | Верификация |
| PATCH | `/admin/consultants/:id/type` | Тип (specialized/general) |
| GET | `/admin/factories` | Заводы |
| POST | `/admin/factories/:id/verify` · `/unverify` | Верификация заводов |
| GET | `/admin/factory-applications` | Заявки консультант↔завод |
| GET | `/admin/orders` | Все заказы |
| GET | `/admin/reviews/pending` | Отзывы на модерацию |
| GET | `/admin/audit-logs` | Журнал аудита |

### health — `/health`
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/health` | 🔓 | Проба: `{ status, db, redis, uptime }`; **503** если БД/Redis недоступны |

---

## 6. Бизнес-логика по доменам

### Запросы (RequestsService)
При создании запроса, если `autoAssign=true`, вызывается
`FactoriesService.findConsultantByCategory()`:
1. ищется **специалист** (`type=specialized`, не trial, активный) по категории, сортировка по рейтингу;
2. иначе — **general**-консультант: при `assignRule=load` — с наименьшим числом активных заказов; при `round_robin` — по `dealsClosed asc`.

Назначен консультант → статус `work`, иначе `draft`. Создаётся client-тред.

### Офферы (OffersService)
- Оффер создаёт **только назначенный** консультант, для запроса не в статусе `done/declined`. Запрос переходит в `wait`.
- При указании завода открывается **скрытый factory-тред** (консультант↔завод), невидимый клиенту.
- **Принятие оффера** (`accept`) — в транзакции: оффер → `accepted`, остальные pending-офферы запроса → `expired`, создаётся `Order` с id `TW-0001` (sequential), client-тред заказа, скрытый factory-тред заказа, запись истории, запрос → `done`. Проверяется срок `validTill`.
- `revision` возвращает запрос в `work`. `expireOutdatedOffers()` — пакетное истечение по `validTill`.

### Заказы (OrdersService)
Машина состояний `STATUS_TRANSITIONS` — разрешены только валидные переходы:
```
draft → pending → confirmed → production → qc → shipped → transit → delivered → closed
       (любой до delivered можно → cancelled; qc может вернуться в production)
```
Каждая смена пишется в `OrderStatusHistory`. При переходе в **`closed`**
вызывается `ConsultantsService.onOrderClosed()` — инкремент `trialDealsClosed` и
`dealsClosed`, и выход из trial при достижении порога с приемлемым рейтингом.
Доступ скоупится по роли (`checkAccess`). Трекинг обновляют только consultant/admin.

### Консультанты и рейтинг (ConsultantsService)
- `runAutoCheck()` по заявке: валидный email + телефон + заполненный профиль + опыт ≥2 лет → `pass`; невалидный email → `fail`; иначе `flag`. При `pass` и `autoApprove` — авто-создание аккаунта.
- `recalculateRating()` (после модерации отзыва): среднее по одобренным, округление до 0.1. Если рейтинг < `blockThreshold` и отзывов ≥10 → пользователь `blocked`; если < `warnThreshold` → предупреждение.
- `onOrderClosed()` — учёт trial (правило #3).

### Отзывы (ReviewsService)
- При создании — авто-флаг по `SPAM_PATTERNS` (URL, телефоны, email, названия мессенджеров, спам-слова), слишком короткие, избыточные повторы. Один отзыв на пару клиент↔консультант. Если указан `orderId` — проверяется принадлежность заказа.
- Публикуются только после `approve` (правило #5), затем пересчёт рейтинга. `remove` ранее одобренного тоже пересчитывает.

### Инвайты (InvitesService)
TTL 48 ч. При создании ставится BullMQ-задача `expire-invite` с `delay` и шлётся
письмо. `factory_admin` может звать только консультантов в свой завод. Регистрация
по factory-инвайту авто-привязывает консультанта к заводу (правило #8).

### Сообщения (MessagingService + Gateway)
- Скоуп тредов по роли; **клиент никогда не видит factory-треды** (правило #1) — проверка и в REST (`assertThreadAccess`), и в WS (`join_thread`).
- Треды обогащаются `title`/`subtitle` под зрителя (консультант видит «Завод · скрытая линия», клиент — имя консультанта).
- Чтение помечает чужие сообщения прочитанными.

---

## 7. Realtime (WebSocket)

Gateway: [`messaging.gateway.ts`](../src/backend/src/modules/messaging/messaging.gateway.ts),
namespace **`messaging`**, CORS под `FRONTEND_URL`.

- **Авторизация хэндшейка**: JWT из `handshake.auth.token` / заголовка / query. Невалидный — disconnect.
- При коннекте пользователь входит в комнату `user:<id>`; для консультанта обновляется `online=true` (offline при отключении).

| Событие (от клиента) | Назначение |
|----------------------|-----------|
| `join_thread` `{ threadId }` | Войти в комнату `thread:<id>` (клиент не может в factory-тред) |
| `leave_thread` `{ threadId }` | Выйти из комнаты |
| `send_message` `{ threadId, body, attachmentUrl? }` | Отправить (сохранить + broadcast `new_message`) |
| `mark_read` `{ messageId }` | Отметить прочитанным |
| `typing` `{ threadId, isTyping }` | Индикатор набора (→ `user_typing`) |

| Событие (к клиенту) | Когда |
|---------------------|-------|
| `new_message` | Новое сообщение в треде |
| `user_typing` | Кто-то печатает |

---

## 8. Конфигурация (env)

Из [`config/configuration.ts`](../src/backend/src/config/configuration.ts). Шаблон — `.env.example`.

| Переменная | Default | Назначение |
|------------|---------|-----------|
| `PORT` | 3000 | Порт API |
| `FRONTEND_URL` | http://localhost:5173 | CORS / WS origin |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `REDIS_URL` | redis://localhost:6379 | Redis для BullMQ |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | — / 15m | Access-токен |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRES_IN` | — / 7d | Refresh-токен |
| `SMTP_HOST/PORT/USER/PASS` | — | Почта (nodemailer) |
| `NODE_ENV` | development | В `production` включает `secure`-cookie и строгую проверку секретов |

> На старте `validateEnv()` ([`config/env.validation.ts`](../src/backend/src/config/env.validation.ts))
> требует `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (иначе приложение не
> поднимется), а в `NODE_ENV=production` запрещает плейсхолдер/слабые JWT-секреты.
> Без SMTP письма просто логируются (graceful degradation) — конфиг почты не обязателен для разработки.

---

## 9. Запуск и команды

### Через Docker (рекомендуется)
`docker-compose.yml` поднимает весь стек: `postgres` (16-alpine) + `redis` (7-alpine)
+ `api` + `frontend` (nginx) — все с healthcheck'ами. `docker-entrypoint.sh` выполняет
`prisma migrate deploy` (применяет миграции из `prisma/migrations/`) и (при
`RUN_SEED=true`) сидинг. Внутри сети хосты — имена сервисов (`postgres`, `redis`, `api`).
Порядок старта по `depends_on: service_healthy`: БД → `api` → `frontend`.

Точки входа: **фронт http://localhost:8080**, API http://localhost:3000/api/v1,
Swagger `/api/docs`. Nginx-фронт реверс-проксирует `/api` и `/socket.io` на `api`.
Секреты переопределяются через env: `JWT_SECRET=... docker compose up` (по умолчанию —
демо-значения из `.env`/fallback).

```bash
cd src/backend
docker compose up --build          # поднять всё
docker compose up --build -d       # в фоне
docker compose logs -f api         # логи API
docker compose down                # стоп (данные в volume)
docker compose down -v             # стоп + стереть БД
```

### Без Docker
```bash
cd src/backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy          # применить миграции (dev: prisma migrate dev)
npx ts-node prisma/seed.ts         # demo-данные
npm run start:dev                  # watch-режим
```

### Тесты
```bash
npm run test:e2e                   # Jest e2e smoke (нужны поднятые и засеянные Postgres+Redis)
```
[`test/app.e2e-spec.ts`](../src/backend/test/app.e2e-spec.ts) поднимает реальный
`AppModule` и прогоняет ключевой поток: логин → запрос (авто-назначение) → оффер →
принятие → заказ до `closed` → отзыв/модерация, плюс проверку скрытой factory-линии.

### npm-скрипты
| Скрипт | Действие |
|--------|----------|
| `build` | `nest build` → `dist/` |
| `start` / `start:dev` / `start:debug` | Прод / watch / debug |
| `prisma:generate` / `prisma:migrate` / `prisma:seed` | Prisma-операции |
| `prisma:studio` | Prisma Studio (GUI БД) |
| `create:admin` | Создать админа ([`prisma/create-admin.ts`](../src/backend/prisma/create-admin.ts)) |
| `test` / `test:e2e` | Jest |

### Demo-аккаунты (сидер)
`admin@tradewind.app / Admin@123!` · `consultant@tradewind.app / Consult@123!` ·
`client@tradewind.app / Client@123!`. Сидер также создаёт 10 категорий и
`PlatformSettings`.

---

## 10. Заметки и технический долг

- **Авто-сгенерированные временные пароли** консультантов больше не логируются; для авто-одобрения (`autoApprove`) их доставку по email нужно довести до конца.
- Каталог `dist/` закоммичен (сборка) — для разработки ориентируйтесь на `src/`; после изменений пересобрать `npm run build`. Стоит добавить в `.gitignore`.
- Прод-секреты в `docker-compose.yml` — это dev-значения; для деплоя заменить и поднять фронт за статик-сервером (nginx).
