# Бизнес-правила Tradewind

Платформа работает как посредник: клиент не контактирует с заводом напрямую, а
качество консультантов контролируется рейтингами и trial-периодом. Ниже — правила,
где они реализованы на бэке и как видны в UI. Многие пороги настраиваются в
`PlatformSettings` (раздел `/dashboard/settings`).

---

### 1. Скрытая линия завод↔консультант
Клиент **никогда** не видит и не может войти в треды `kind=factory`.

- **Где**: `MessagingService.assertThreadAccess()` и `getThreads()` (фильтр `kind != factory` для клиента); WS-проверка в `MessagingGateway.handleJoinThread()`.
- Скрытый factory-тред создаётся при выставлении оффера с заводом и при принятии оффера (на уровне заказа).

### 2. Trial-период считается по закрытым заказам
Счётчик trial растёт от заказов в статусе **`closed`**, а не от запросов.

- **Где**: `OrdersService.updateStatus()` при переходе в `closed` → `ConsultantsService.onOrderClosed()`: инкремент `trialDealsClosed`/`dealsClosed`.
- Выход из trial: `trialDealsClosed >= trialOrders` (default 5) **и** `rating >= blockThreshold`.

### 3. Пороги рейтинга
- `warnThreshold` = **3.5**: предупреждение (баннер) при рейтинге ниже.
- `blockThreshold` = **3.0**: блокировка консультанта при рейтинге ниже **и** числе отзывов ≥ 10.
- **Где**: `ConsultantsService.recalculateRating()` (вызывается после модерации отзыва). Блокировка → `User.status = blocked` (вход запрещён).

### 4. Отзывы публикуются только после одобрения админом
- **Где**: `ReviewsService.create()` ставит `status=pending`; публикация — только после `approve` (`status=approved`), затем пересчёт рейтинга.
- **Авто-флаг** подозрительного текста (`SPAM_PATTERNS`): URL, телефоны, email, упоминания мессенджеров (telegram/whatsapp/wechat/...), спам-слова, слишком короткий текст, избыточные повторы. Флаг показывается админу (`/reviews/flagged`).
- Один отзыв на пару клиент↔консультант; при `orderId` проверяется принадлежность заказа клиенту.

### 5. Авто-проверка и авто-одобрение заявок консультантов
- **Авто-проверка** (`runAutoCheck`): валидный email + телефон + заполненный профиль (имя, город, мотивация) + опыт ≥ 2 лет → `pass`; невалидный email → `fail`; иначе `flag`.
- **Авто-одобрение**: при `pass` и `autoApprove=true` (default `false`) создаётся trial-аккаунт консультанта автоматически.
- Ручная модерация — `POST /admin/consultant-applications/:id/moderate` (создаёт аккаунт + письмо с временным паролем).

### 6. Авто-назначение консультанта на запрос
При создании запроса (если `autoAssign=true`, default):
1. Ищется **специалист** по категории (`type=specialized`, не trial, активный) — по убыванию рейтинга.
2. Иначе — **general**-консультант:
   - `assignRule=load` (default) — с наименьшим числом активных заказов;
   - `assignRule=round_robin` — по `dealsClosed asc`.

- **Где**: `RequestsService.create()` → `FactoriesService.findConsultantByCategory()`. Назначен → статус `work`, иначе `draft` (ждёт ручного назначения админом).

### 7. Одноразовые инвайты на 48 часов
- **Где**: `InvitesService` (`INVITE_TTL_HOURS = 48`). При создании ставится BullMQ-задача `expire-invite` и шлётся письмо.
- `factory_admin` может приглашать только консультантов в свой завод.
- Регистрация по **factory-инвайту** авто-привязывает консультанта к заводу (`ConsultantFactoryLink`), а владельца — к заводу (`Factory.ownerUserId`).
- Один активный (pending, не истёкший) инвайт на email.

---

## Жизненные циклы статусов

### Запрос (`RequestStatus`)
```
draft ──assign/auto──► work ──offer──► wait ──accept──► done
  └──────────────── decline ──────────────► declined
                         revision ◄──┘ (возврат в work)
```

### Оффер (`OfferStatus`)
```
pending ──accept──► accepted   (создаётся Order; прочие pending-офферы → expired)
   ├──revision──► revision
   └──validTill / expire──► expired
```

### Заказ (`OrderStatus`) — машина состояний `STATUS_TRANSITIONS`
```
draft → pending → confirmed → production → qc → shipped → transit → delivered → closed
              (любой статус до delivered → cancelled;  qc → production — возврат на доработку)
```
Каждая смена пишется в `OrderStatusHistory`. Переход в `closed` инкрементирует
trial-счётчик консультанта (правило #2).

---

## Где настраивается (PlatformSettings)

Раздел админа `/dashboard/settings` (`GET/PATCH /admin/settings`):

| Настройка | Default | Правило |
|-----------|---------|---------|
| `trialOrders` | 5 | #2 |
| `warnThreshold` | 3.5 | #3 |
| `blockThreshold` | 3.0 | #2, #3 |
| `autoApprove` | false | #5 |
| `autoAssign` | true | #6 |
| `assignRule` | load | #6 |
