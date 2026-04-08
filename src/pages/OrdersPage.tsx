import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ShoppingCart, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { OrderListItem } from '../types';
import { deleteOrdersBatchRpc, fetchOrdersPageRpc } from '../lib/serverQueries';
import { getBadgeTextColor } from '../lib/colors';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 100;

function safeDate(value: string | null | undefined) {
  if (!value) return '-';
  try {
    return format(parseISO(value), 'dd.MM.yyyy');
  } catch {
    return '-';
  }
}

function safeDateTime(value: string | null | undefined) {
  if (!value) return '-';
  try {
    return format(parseISO(value), 'dd.MM.yyyy HH:mm');
  } catch {
    return '-';
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [dbTotal, setDbTotal] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [sortField, setSortField] = useState<'order_id' | 'order_created_at' | 'client_name' | 'order_date' | 'source_name' | 'status_changed_at' | 'status_name' | 'products_count' | 'total_amount'>('order_date');
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const visibleOrderIds = orders
    .map(order => order.order_id)
    .filter((orderId): orderId is number => typeof orderId === 'number' && Number.isFinite(orderId));
  const selectedOrderIdSet = new Set(selectedOrderIds);
  const allVisibleSelected = visibleOrderIds.length > 0 && visibleOrderIds.every(orderId => selectedOrderIdSet.has(orderId));
  const pageStart = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const pageEnd = page * PAGE_SIZE + orders.length;
  const dbInfoLabel = dbTotal === null
    ? 'Всього в БД: —'
    : total > 0
      ? `Всього в БД: ${dbTotal.toLocaleString('uk-UA')} • у вибірці: ${total.toLocaleString('uk-UA')} • показано: ${pageStart.toLocaleString('uk-UA')}-${pageEnd.toLocaleString('uk-UA')}`
      : `Всього в БД: ${dbTotal.toLocaleString('uk-UA')} • у вибірці: 0`;

  const loadDbTotal = useCallback(async () => {
    const { count } = await supabase
      .from('client_orders')
      .select('id', { count: 'exact', head: true });

    setDbTotal(count ?? 0);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchOrdersPageRpc({
      page,
      pageSize: PAGE_SIZE,
      dateFrom,
      dateTo,
      sortField,
      sortAsc,
    });

    if (result.error) {
      setOrders([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    if (result.data.length === 0 && page > 0) {
      setPage(prev => Math.max(0, prev - 1));
      return;
    }

    setOrders(result.data);
    setTotal(result.data[0]?.total_count ?? 0);
    setLoading(false);
  }, [page, dateFrom, dateTo, sortField, sortAsc]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDbTotal();
  }, [loadDbTotal]);

  useEffect(() => {
    function refreshOrdersPage() {
      void load();
      void loadDbTotal();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        refreshOrdersPage();
      }
    }

    window.addEventListener('focus', refreshOrdersPage);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', refreshOrdersPage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [load, loadDbTotal]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  useEffect(() => {
    const visibleSet = new Set(
      orders
        .map(order => order.order_id)
        .filter((orderId): orderId is number => typeof orderId === 'number' && Number.isFinite(orderId)),
    );

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedOrderIds(prev => prev.filter(orderId => visibleSet.has(orderId)));
  }, [orders]);

  function onDateChange(setter: (value: string) => void, value: string) {
    setPage(0);
    setter(value);
  }

  function toggleSort(field: typeof sortField) {
    setPage(0);
    if (sortField === field) {
      setSortAsc(prev => !prev);
      return;
    }
    setSortField(field);
    setSortAsc(field === 'order_id' || field === 'products_count' || field === 'total_amount' ? false : true);
  }

  function renderSortLabel(label: string, field: typeof sortField, align: 'left' | 'right' = 'left') {
    const active = sortField === field;
    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className={`inline-flex items-center gap-1 hover:text-gray-700 ${align === 'right' ? 'justify-end w-full' : ''}`}
      >
        <span>{label}</span>
        {active ? (sortAsc ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />) : null}
      </button>
    );
  }

  function toggleOrderSelection(orderId: number) {
    setSelectedOrderIds(prev => (
      prev.includes(orderId)
        ? prev.filter(selectedId => selectedId !== orderId)
        : [...prev, orderId]
    ));
  }

  function toggleSelectAllVisible() {
    setSelectedOrderIds(prev => {
      if (allVisibleSelected) {
        return prev.filter(orderId => !visibleOrderIds.includes(orderId));
      }

      const next = new Set(prev);
      visibleOrderIds.forEach(orderId => next.add(orderId));
      return Array.from(next);
    });
  }

  async function handleDeleteSelected() {
    if (selectedOrderIds.length === 0 || deleting) return;

    const isSingleOrder = selectedOrderIds.length === 1;
    const confirmed = window.confirm(
      isSingleOrder
        ? `Видалити замовлення #${selectedOrderIds[0].toLocaleString('uk-UA')} з БД?`
        : `Видалити ${selectedOrderIds.length.toLocaleString('uk-UA')} замовлень з БД? Це також видалить товари в замовленнях і пов'язані записи.`,
    );

    if (!confirmed) return;

    setDeleting(true);
    const result = await deleteOrdersBatchRpc(selectedOrderIds);

    if (result.error) {
      window.alert('Не вдалося видалити вибрані замовлення з БД.');
      setDeleting(false);
      return;
    }

    const deletedCount = result.data?.deleted_orders ?? selectedOrderIds.length;
    const removedWholePage = deletedCount >= orders.length && selectedOrderIds.length === orders.length;

    setSelectedOrderIds([]);
    await loadDbTotal();

    if (removedWholePage && page > 0) {
      setDeleting(false);
      setPage(prev => Math.max(0, prev - 1));
      return;
    }

    await load();
    setDeleting(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Замовлення ({total.toLocaleString('uk-UA')})</h1>
          <p className="text-sm text-gray-400">{dbInfoLabel}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => onDateChange(setDateFrom, e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 w-[140px]" title="Від дати замовлення" />
          <span className="text-gray-400">-</span>
          <input type="date" value={dateTo} onChange={e => onDateChange(setDateTo, e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 w-[140px]" title="До дати замовлення" />
        </div>

        <button
          onClick={() => {
            setPage(0);
            setSortAsc(prev => !prev);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 text-gray-700"
        >
          {sortAsc ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          {sortAsc ? 'За зростанням' : 'За спаданням'}
        </button>

        <button
          type="button"
          onClick={toggleSelectAllVisible}
          disabled={orders.length === 0 || deleting}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {allVisibleSelected ? `Зняти вибір (${visibleOrderIds.length.toLocaleString('uk-UA')})` : `Вибрати всі на сторінці (${visibleOrderIds.length.toLocaleString('uk-UA')})`}
        </button>

        <button
          type="button"
          onClick={handleDeleteSelected}
          disabled={selectedOrderIds.length === 0 || deleting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? 'Видалення...' : `Видалити (${selectedOrderIds.length.toLocaleString('uk-UA')})`}
        </button>

        <p className="text-sm text-gray-400">Вибрано: {selectedOrderIds.length.toLocaleString('uk-UA')}</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Завантаження...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      disabled={orders.length === 0 || deleting}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      aria-label="Вибрати всі замовлення на сторінці"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">{renderSortLabel('№ замовлення', 'order_id')}</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">{renderSortLabel('Дата створення', 'order_created_at')}</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden xl:table-cell">Додано в БД</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">{renderSortLabel('Клієнт', 'client_name')}</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">{renderSortLabel('Дата', 'order_date')}</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">{renderSortLabel('Джерело', 'source_name')}</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">{renderSortLabel('Дата зміни', 'status_changed_at')}</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">{renderSortLabel('Статус', 'status_name')}</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">{renderSortLabel('Товарів', 'products_count', 'right')}</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">{renderSortLabel('Сума', 'total_amount', 'right')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 && (
                  <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400">Немає замовлень за цими фільтрами</td></tr>
                )}
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedOrderIdSet.has(order.order_id)}
                        onChange={() => toggleOrderSelection(order.order_id)}
                        disabled={deleting}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        aria-label={`Вибрати замовлення #${order.order_id}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">#{order.order_id}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden lg:table-cell">{safeDate(order.order_created_at)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden xl:table-cell">{safeDateTime(order.created_at)}</td>
                    <td className="px-4 py-3 text-gray-700 hidden md:table-cell">{order.client_name || `#${order.client_id}`}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{safeDate(order.order_date)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{
                          backgroundColor: order.source_color || '#F3F4F6',
                          color: getBadgeTextColor(order.source_color),
                        }}
                      >
                        {order.source_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden lg:table-cell">{safeDate(order.status_changed_at)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{
                          backgroundColor: order.status_color || '#F3F4F6',
                          color: getBadgeTextColor(order.status_color),
                        }}
                      >
                        {order.status_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{order.products_count}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">{(order.total_amount ?? 0).toLocaleString()} грн</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Попередня
              </button>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ShoppingCart className="w-4 h-4" />
                <span>{page + 1} / {totalPages}</span>
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Наступна <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
