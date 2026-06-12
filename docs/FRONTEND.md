# Frontend — Tradewind SPA

React 18 + TypeScript + Vite 6. Single-page application с разделением на
публичную часть, страницы аутентификации и ролевые дашборды. Серверное состояние —
TanStack React Query, клиентское (auth, тема) — Zustand.

- **Точка входа**: [`src/main.tsx`](../src/frontend/src/main.tsx)
- **Маршрутизация**: [`src/App.tsx`](../src/frontend/src/App.tsx)
- **API-слой**: [`src/api/`](../src/frontend/src/api/)

---

## 1. Стек и инфраструктура

| Назначение | Библиотека |
|-----------|-----------|
| UI | React 18, React Router 6 |
| Серверное состояние / кэш | @tanstack/react-query 5 (+ devtools) |
| Клиентское состояние | zustand 5 (с `persist`) |
| HTTP | axios (инстанс с интерсепторами) |
| Realtime | socket.io-client |
| Утилиты | date-fns, clsx |
| Сборка | Vite 6, TypeScript 5.7 |

**React Query** (`main.tsx`): `staleTime` 2 мин, `retry` 1,
`refetchOnWindowFocus: false`.

**Vite** (`vite.config.ts`): dev-сервер на порту **5173**, прокси `/api` →
`http://localhost:3000`, sourcemap в сборке. Сборка — `tsc && vite build` → `dist/`.

---

## 2. Структура `src/`

```
src/
├── main.tsx              bootstrap: QueryClientProvider + App
├── App.tsx               все маршруты (public / auth / dashboard)
├── index.css             глобальные стили (использует токены theme.css)
├── api/                  типизированные клиенты под каждый модуль API
│   ├── client.ts         axios-инстанс, JWT-интерсептор, auto-refresh, unwrap()
│   ├── types.ts          канонические типы (зеркало бэкенда)
│   └── auth|users|consultants|factories|categories|requests|
│       offers|orders|messaging|reviews|invites|admin.ts
├── store/
│   ├── auth.store.ts      user + accessToken (persist «tw-auth»)
│   └── theme.store.ts     тема warm/corp (persist «tw-theme»)
├── hooks/
│   ├── useAuth.ts         селекторы роли + флаги isClient/isConsultant/...
│   └── useSocket.ts       единый Socket.io-коннект к namespace /messaging
├── components/
│   ├── layout/            PublicLayout, DashLayout, Header, Footer, Sidebar
│   └── ui/                Button, Card, Input, Modal, Badge, Avatar,
│                          Spinner, Pagination, EmptyState
└── pages/
    ├── public/            Landing, Catalog, Categories, Category, Factory,
    │                      Consultants, Consultant
    ├── auth/              Login, Register, RegisterCustomer, ApplyConsultant,
    │                      ForgotPassword, ResetPassword, Invite
    └── dashboard/
        ├── shared/        Messages, Profile
        ├── client/        Overview, Requests, NewRequest, RequestDetail,
        │                  Offers, OfferDetail, Orders, OrderDetail
        ├── consultant/    Overview, Requests, Offers, Orders, Factories
        ├── factory/       Overview, Orders, Products, Certs, Consultants, Profile
        └── admin/         Overview, Users, Factories, ConsultantApps,
                           Invites, Reviews, Audit, Settings
```

---

## 3. Маршрутизация (`App.tsx`)

Три группы маршрутов:

### Публичные (внутри `PublicLayout`)
`/` (лендинг), `/catalog`, `/categories`, `/category/:id`, `/factory/:id`,
`/consultants`, `/consultant/:id`.

### Аутентификация (без layout-обёртки)
`/login`, `/register`, `/register/customer`, `/register/consultant`,
`/forgot-password`, `/reset-password`, `/invite/:token`.

### Дашборд (`/dashboard`, внутри `DashLayout`)
Вложенные маршруты рендерит `RoleDashRoutes` — **набор путей зависит от роли**
пользователя из `useAuth()`. Неавторизованный → редирект на `/login`.

| Роль | Доступные разделы (`/dashboard/...`) |
|------|--------------------------------------|
| **client** | `` (overview), `requests`, `requests/new`, `requests/:id`, `offers`, `offers/:id`, `orders`, `orders/:id`, `messages`, `profile` |
| **consultant** | overview, `requests`, `requests/:id`, `offers`, `offers/:id`, `orders`, `orders/:id`, `factories`, `messages`, `profile` |
| **factory_admin** | overview, `orders`, `orders/:id`, `products`, `certs`, `consultants`, `profile` |
| **platform_admin** | overview, `users`, `factories`, `consultant-applications`, `invites`, `reviews`, `audit`, `settings` |

Индекс `/dashboard` рендерит свой overview-компонент в зависимости от роли.
Неизвестные пути внутри дашборда редиректят на `/dashboard`, остальные — на `/`.

> Защита маршрутов сейчас построена на редиректе при отсутствии `user`. Полноценная
> проверка прав на бэке (guard'ы + роли), фронт лишь не показывает чужие разделы.

---

## 4. Слой API (`src/api/`)

Единый axios-инстанс [`client.ts`](../src/frontend/src/api/client.ts):

- `baseURL` = `VITE_API_URL` или `/api/v1`; `withCredentials: true` (для refresh-cookie).
- **Request-интерсептор** добавляет `Authorization: Bearer <accessToken>` из Zustand-стора.
- **Response-интерсептор** ловит `401`: один раз вызывает `POST /auth/refresh`,
  обновляет токен в сторе и **повторяет исходный запрос**. Параллельные 401
  ставятся в очередь `pendingQueue` и доигрываются после рефреша. Провал
  рефреша → `logout()` + редирект на `/login`.
- `unwrap(res)` достаёт `res.data.data` из обёртки `{ success, data, timestamp }`.

Каждый модуль API — объект с методами, возвращающими уже развёрнутые данные.
Пример ([`requests.ts`](../src/frontend/src/api/requests.ts)):

```ts
export const requestsApi = {
  list:   (params?) => api.get<ApiResponse<PaginatedData<SourcingRequest>>>('/requests', { params }).then(unwrap),
  get:    (id)      => api.get<ApiResponse<SourcingRequest>>(`/requests/${id}`).then(unwrap),
  create: (payload) => api.post<ApiResponse<SourcingRequest>>('/requests', payload).then(unwrap),
  // ...
};
```

Аналогичные модули есть для всех доменов: `auth`, `users`, `consultants`,
`factories`, `categories`, `offers`, `orders`, `messaging`, `reviews`, `invites`,
`admin`.

### Типы (`types.ts`)
Канонические интерфейсы, **зеркалящие бэкенд**: `ApiResponse<T>`,
`PaginatedData<T>`, `User`, `ConsultantProfile`, `Factory`, `Product`,
`Certificate`, `SourcingRequest`, `Offer`, `Order`, `Thread`, `Message`,
`Review`, `Invite`, `ConsultantApplication`, `PlatformSettings`, `AuditLog` и
строковые union-типы статусов (`RequestStatus`, `OfferStatus`, `OrderStatus`,
`ReviewStatus`, `ThreadKind`). Здесь же — хелперы для заказов: `ORDER_FLOW`
(порядок статусов) и `ORDER_STATUS_LABELS` (русские подписи).

---

## 5. Управление состоянием (Zustand)

### auth.store.ts (`tw-auth`, persist в localStorage)
```ts
{ user: User | null, accessToken: string | null,
  setAuth(user, token), setTokens(token), logout() }
```
Хранит только `user` и `accessToken` (refresh — в httpOnly-cookie, недоступен JS).
Хук `useAuth()` отдаёт `user`, `isAuthenticated` и флаги ролей
(`isClient`, `isConsultant`, `isFactory`, `isAdmin`).

### theme.store.ts (`tw-theme`, persist)
Тема `direction`: **`warm`** (тёплая) ↔ **`corp`** (корпоративная). Переключение
ставит атрибут `data-theme` на `<html>`, который читают CSS-токены из
[`theme.css`](../theme.css). Тема применяется ещё до рендера (чтение из localStorage
на старте модуля). Переключатель — в `Sidebar`.

---

## 6. Realtime (`useSocket`)

Хук [`useSocket.ts`](../src/frontend/src/hooks/useSocket.ts) держит **единый
глобальный** Socket.io-коннект к `${VITE_SOCKET_URL || http://localhost:3000}/messaging`:

- Аутентификация через `auth: { token: accessToken }`.
- Транспорты `websocket` + `polling`, 5 попыток реконнекта.
- Соединение **не рвётся** при размонтировании компонента (живёт глобально);
  принудительный разрыв — `disconnectSocket()`.
- API хука: `{ socket, emit(event, data), on(event, handler), off(event, handler) }`.

Используется в `MessagesPage`: подписка на `new_message`, `user_typing`,
отправка через `send_message` / `join_thread`. REST (`messagingApi`) — fallback и
первичная загрузка истории/тредов.

События описаны в [BACKEND.md → Realtime](./BACKEND.md#7-realtime-websocket).

---

## 7. Компоненты

### Layout (`components/layout/`)
- **PublicLayout** — `Header` + `Footer` + `<Outlet/>` для публичных страниц.
- **DashLayout** — `Sidebar` + контентная область для `/dashboard/*`.
- **Sidebar** — навигация, **меню зависит от роли** (`CLIENT_NAV`,
  `CONSULTANT_NAV`, `FACTORY_NAV`, `ADMIN_NAV`), карточка пользователя,
  переключатель темы и кнопка выхода.

### UI-кит (`components/ui/`)
Переиспользуемые примитивы на дизайн-токенах: `Button`, `Card`, `Input`,
`Modal`, `Badge`, `Avatar`, `Spinner`, `Pagination`, `EmptyState`.

---

## 8. Сценарии по ролям (что делает каждый дашборд)

- **Клиент**: создаёт запрос (`NewRequestPage`) → получает офферы
  (`ClientOffersPage`/`OfferDetailPage`, принятие/ревизия) → заказ
  (`OrderDetailPage` с трекингом и историей) → отзыв консультанту. Чат — только с консультантом.
- **Консультант**: видит назначенные запросы, выставляет офферы, ведёт заказы,
  подаёт заявки на работу с заводами (`ConsultantFactoriesPage`). Чат и с клиентом,
  и со «скрытой линией» завода.
- **Завод (`factory_admin`)**: профиль завода, продукты, сертификаты, свои
  заказы, заявки консультантов. Чат — только factory-треды (со скрытой линией).
- **Админ**: дашборд-метрики, пользователи (блокировки), верификация заводов,
  модерация заявок консультантов и отзывов, инвайты, аудит, настройки платформы.

---

## 9. Темизация (`theme.css`)

Корневой [`theme.css`](../theme.css) — дизайн-система на CSS-переменных:
шрифты (`--font-display`), цвета акцентов (`--accent`, `--accent-grad`,
`--accent-soft`), границы (`--line`), радиусы (`--r-md`), приглушённые тона
(`--muted`, `--faint`). Темы переключаются через `data-theme="warm|corp"` на
`<html>`. Компоненты используют классы (`btn`, `btn-primary`, `card`, `input`,
`label`, `dash-sidebar`, `dash-nav-item` и т.д.) и инлайн-стили с этими токенами.

---

## 10. Запуск и переменные окружения

```bash
cd src/frontend
npm install
npm run dev        # http://localhost:5173 (прокси /api → :3000)
npm run build      # tsc + vite build → dist/
npm run preview    # предпросмотр прод-сборки
```

| Переменная (Vite, `VITE_*`) | Default | Назначение |
|------------------------------|---------|-----------|
| `VITE_API_URL` | `/api/v1` | База REST API (в dev идёт через прокси) |
| `VITE_SOCKET_URL` | `http://localhost:3000` | База Socket.io (namespace `/messaging`) |

> В dev отдельная настройка не нужна: Vite-прокси направляет `/api` на бэкенд,
> поэтому фронт сразу работает с API в Docker.

### Production (Docker + nginx)
`src/frontend/Dockerfile` — multi-stage: `node` собирает SPA → `nginx:alpine`
раздаёт `dist/`. `nginx.conf` отдаёт статику с SPA-fallback (`try_files ... /index.html`)
и реверс-проксирует `/api/` и `/socket.io/` на сервис `api`, поэтому фронт работает
**same-origin** — `VITE_API_URL`/`VITE_SOCKET_URL` задавать не нужно
(`useSocket` в проде по умолчанию коннектится к текущему origin). Контейнер
поднимается общим `docker compose up --build` (см. [BACKEND.md](./BACKEND.md#9-запуск-и-команды)),
точка входа — **http://localhost:8080**. Бандл разбит на vendor-чанки
(`react-vendor`, `data-vendor`, `realtime-vendor`) через `manualChunks` в `vite.config.ts`.
