import { ArrowRight, Boxes, Database, FileJson, RefreshCw, ShoppingCart, Users, Waypoints } from 'lucide-react';

type SyncSource = {
  id: string;
  title: string;
  fileName: string;
  endpoint: string;
  method: 'GET';
  cadence: string;
  pagination: string;
  notes: string;
  destinationTables: string[];
  accentClass: string;
  icon: typeof ShoppingCart;
};

const syncSources: SyncSource[] = [
  {
    id: 'products',
    title: 'Товари',
    fileName: '01-sync-products.json',
    endpoint: 'https://openapi.keycrm.app/v1/products',
    method: 'GET',
    cadence: 'Ручний запуск через n8n',
    pagination: 'page + limit=50, до MAX_PAGES',
    notes: 'Після GET товари дедуплікуються по barcode і upsert-яться в products.',
    destinationTables: ['products'],
    accentClass: 'bg-amber-50 text-amber-700 border-amber-100',
    icon: Boxes,
  },
  {
    id: 'buyers',
    title: 'Клієнти',
    fileName: '02-sync-buyers.json',
    endpoint: 'https://openapi.keycrm.app/v1/buyer',
    method: 'GET',
    cadence: 'Ручний запуск через n8n',
    pagination: 'page + limit=50, до MAX_PAGES',
    notes: 'Після GET buyers нормалізуються і upsert-яться в clients.',
    destinationTables: ['clients'],
    accentClass: 'bg-sky-50 text-sky-700 border-sky-100',
    icon: Users,
  },
  {
    id: 'orders',
    title: 'Замовлення',
    fileName: '03-sync-orders.json',
    endpoint: 'https://openapi.keycrm.app/v1/order?include=buyer,products',
    method: 'GET',
    cadence: 'Ручний запуск через n8n',
    pagination: 'START_PAGE + PAGES_TO_FETCH, пауза 1с між fetch',
    notes: 'Це головний workflow замовлень. Він пише status_changed_at і батчами вставляє client_order_items.',
    destinationTables: ['clients', 'client_orders', 'client_order_items'],
    accentClass: 'bg-violet-50 text-violet-700 border-violet-100',
    icon: ShoppingCart,
  },
  {
    id: 'sources',
    title: 'Джерела',
    fileName: '04-sync-sources.json',
    endpoint: 'https://openapi.keycrm.app/v1/order/source',
    method: 'GET',
    cadence: 'Ручний запуск через n8n',
    pagination: 'page + limit=50, сторінки 1..5',
    notes: 'Після GET джерела трансформуються й upsert-яться в allowed_sources.',
    destinationTables: ['allowed_sources'],
    accentClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    icon: Waypoints,
  },
];

export default function SyncPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Синхронізація</h1>
          <p className="mt-1 text-sm text-gray-500 max-w-3xl">
            Тут показані тільки реальні джерела синку з папки `n8n/`. Сторінка більше не спирається на `sync_log`,
            бо там були seed- і дубльовані записи, які не можна вважати джерелом істини.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
          <RefreshCw className="h-4 w-4" />
          Актуальні GET-workflow
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {syncSources.map((source) => {
          const Icon = source.icon;

          return (
            <div key={source.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${source.accentClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{source.title}</h2>
                    <p className="text-sm text-gray-500">{source.fileName}</p>
                  </div>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${source.accentClass}`}>
                  {source.method}
                </span>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-gray-500">KeyCRM endpoint</span>
                  <span className="text-right font-medium text-gray-900 break-all">{source.endpoint}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-gray-500">Режим запуску</span>
                  <span className="text-right font-medium text-gray-900">{source.cadence}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-gray-500">Пагінація</span>
                  <span className="text-right font-medium text-gray-900">{source.pagination}</span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Database className="h-4 w-4 text-gray-500" />
                  Куди пише в Supabase
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {source.destinationTables.map((table, index) => (
                    <div key={table} className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                        {table}
                      </span>
                      {index < source.destinationTables.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-gray-400" />}
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-gray-600">{source.notes}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <FileJson className="h-5 w-5 text-indigo-600" />
          Правила для Sync UI
        </div>
        <div className="mt-4 space-y-3 text-sm text-gray-600">
          <p>UI показує тільки workflow, які реально читають дані з KeyCRM через `GET` у папці `n8n/`.</p>
          <p>`n8n/keycrm-manual-sync.json` видалений і більше не використовується.</p>
          <p>`sync_log` не використовується як джерело істини для цієї сторінки, бо в ньому були seed- та дубльовані записи.</p>
          <p>Для замовлень канонічний workflow: `n8n/03-sync-orders.json`.</p>
        </div>
      </div>
    </div>
  );
}
