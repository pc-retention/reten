import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { OrderListItem } from '../types';
import { fetchOrdersPageRpc } from '../lib/serverQueries';
import { getBadgeTextColor } from '../lib/colors';

const PAGE_SIZE = 100;

function safeDate(value: string | null | undefined) {
  if (!value) return '-';
  try {
    return format(parseISO(value), 'dd.MM.yyyy');
  } catch {
    return '-';
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<'order_id' | 'order_created_at' | 'client_name' | 'order_date' | 'source_name' | 'status_changed_at' | 'status_name' | 'products_count' | 'total_amount'>('order_date');
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE + PAGE_SIZE, total);

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

    setOrders(result.data);
    setTotal(result.data[0]?.total_count ?? 0);
    setLoading(false);
  }, [page, dateFrom, dateTo, sortField, sortAsc]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Замовлення ({total.toLocaleString()})</h1>
        {!loading && <p className="text-sm text-gray-400">{from}–{to} з {total.toLocaleString()}</p>}
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
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Завантаження...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">{renderSortLabel('№ замовлення', 'order_id')}</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">{renderSortLabel('Дата створення', 'order_created_at')}</th>
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
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">Немає замовлень за цими фільтрами</td></tr>
                )}
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">#{order.order_id}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden lg:table-cell">{safeDate(order.order_created_at)}</td>
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
