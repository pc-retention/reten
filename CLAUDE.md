# ProCare Retention

## Стек технологій
- **Frontend**: React 18 + TypeScript + Vite
- **CSS**: Tailwind CSS v4 (через `@tailwindcss/vite` плагін)
- **Маршрутизація**: React Router v6
- **Графіки**: Recharts
- **Іконки**: Lucide React
- **Дати**: date-fns + date-fns/locale/uk
- **Нотифікації**: react-hot-toast
- **БД (схема)**: Supabase PostgreSQL (поки лише SQL-схема, дані — тестові)

## Структура проекту

```
src/
├── App.tsx              — маршрути (12 lazy-loaded сторінок)
├── main.tsx             — BrowserRouter + Toaster
├── index.css            — @import "tailwindcss"
├── types/index.ts       — всі TypeScript інтерфейси (21 тип)
├── lib/testData.ts      — тестові дані + хелпер-функції
├── components/
│   ├── Layout.tsx        — sidebar (w-64, bg #1e293b), мобільне меню, 12 NavLink з бейджами
│   └── StatCard.tsx      — переиспользовуваний компонент картки метрики
└── pages/
    ├── OverviewPage.tsx  — головна: 6 метрик, графіки виручки/замовлень, воронка, топ-5 сегментів, статус синхронізації
    ├── ClientsPage.tsx   — список клієнтів з пошуком/фільтрами + картка клієнта (/clients/:id)
    ├── ProductsPage.tsx  — товари (таблиця + CRUD) + невідомі штрихкоди
    ├── AnalyticsPage.tsx — LTV, AOV, утримання, відтік, графіки, воронка, когортна таблиця
    ├── SegmentsPage.tsx  — RFM сегменти: огляд, теплова карта (R×F), конфігурація порогів
    ├── AutomationsPage.tsx — 5 типів: поповнення, вітальна серія, покинутий кошик, повернення, після покупки
    ├── RemindersPage.tsx — нагадування: сьогодні, прострочені, відправлені, всі
    ├── LoyaltyPage.tsx   — лояльність: огляд (pie chart, топ-10), транзакції, рівні
    ├── CampaignsPage.tsx — кампанії: список, календар, A/B тести
    ├── SourcesPage.tsx   — CRUD джерел (allowed_sources)
    ├── SyncPage.tsx      — 3 канали синхронізації + лог
    └── SettingsPage.tsx  — налаштування (key-value) + шаблони комунікацій

supabase/
└── schema.sql           — повна SQL-схема: 20+ таблиць, функції, індекси, тестові дані
```

## Тестові дані (src/lib/testData.ts)

Файл містить:
- **50 клієнтів** з RFM, лояльністю, тегами
- **15 товарів**, 2 невідомі штрихкоди
- ~47 замовлень, 7 позицій замовлень
- 13 комунікацій, 16 шаблонів
- 9 покупок клієнтів (для нагадувань)
- 11 елементів черги автоматизацій
- 11 кандидатів на повернення (win-back)
- 4 рівні лояльності, 17 транзакцій
- 15 RFM конфігурацій, 11 RFM сегментів
- 41 когортний знімок, 30 щоденних метрик
- 5 джерел, 7 логів синхронізації, 6 налаштувань, 5 кампаній
- Бейджі для навігації

**Хелпер-функції**: `getClientById`, `getClientOrders`, `getClientCommunications`, `getClientLoyaltyTransactions`, `getClientPurchases`, `getSegmentClients`

## Маршрути

| Шлях | Сторінка |
|------|----------|
| `/` | OverviewPage |
| `/products` | ProductsPage |
| `/clients` | ClientsPage (список) |
| `/clients/:id` | ClientsPage (картка) |
| `/analytics` | AnalyticsPage |
| `/segments` | SegmentsPage |
| `/automations` | AutomationsPage |
| `/reminders` | RemindersPage |
| `/loyalty` | LoyaltyPage |
| `/campaigns` | CampaignsPage |
| `/sources` | SourcesPage |
| `/sync` | SyncPage |
| `/settings` | SettingsPage |

## Мова інтерфейсу
Весь UI — **українською**. Скрізь використовуються українські назви для:
- Навігації (Головна, Товари, Клієнти, Аналітика, Сегменти, Автоматизації, Нагадування, Лояльність, Кампанії, Джерела, Синхронізація, Налаштування)
- Метрик (Сер. LTV, Сер. чек, Утримання, Відтік, Відкриття, Кліки)
- Статусів (Чернетка, Заплановано, Надіслано, Скасовано, Очікує, Прострочено, Успішно, Помилка)
- Типів автоматизацій (Поповнення, Вітальна серія, Покинутий кошик, Повернення, Після покупки)
- Типів транзакцій лояльності (Нарахування, Списання, Бонус, Згорання)
- Каналів синхронізації (Вебхук, Щогодинна, Ручна)
- Рівнів win-back (Теплі, Холодні, Втрачені)
- Абревіатури LTV, RFM, A/B залишені як є (загальноприйняті)

## Команди

```bash
npm run dev    # dev-сервер (localhost:5173)
npm run build  # production збірка
npm run preview # перегляд production збірки
```

## SQL-схема (supabase/schema.sql)

20+ таблиць, ключові:
- `products`, `clients`, `client_orders`, `client_order_items`
- `communication_log`, `communication_templates`
- `client_purchases` (для нагадувань поповнення)
- `automation_queue`, `win_back_candidates`
- `loyalty_tiers`, `loyalty_transactions`
- `rfm_config`, `rfm_segments`
- `cohort_snapshots`, `metrics_daily`
- `allowed_sources`, `processed_orders`, `sync_log`, `settings`, `campaigns`

Ключові функції: `upsert_purchase()`, `can_send_communication()`, `calculate_rfm()`, `add_loyalty_points()`, `get_todays_reminders()`, `get_badge_counts()`, `generate_cohort_snapshot()`, `update_daily_metrics()`
