import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Phone, Mail, AtSign, Tag, ShoppingCart, MessageSquare, Gift, TrendingUp, ChevronLeft, ChevronRight, ArrowDown, ArrowUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import type { Client, ClientOrder, CommunicationLog, LoyaltyTransaction, ClientPurchase } from '../types';
import { fetchClientsPageRpc, fetchFilteredRemindersRpc, fetchRfmSegmentsListRpc } from '../lib/serverQueries';

const PAGE_SIZE = 100;

const tierColors: Record<string, string> = {
  bronze: 'bg-amber-100 text-amber-800',
  silver: 'bg-gray-200 text-gray-700',
  gold: 'bg-yellow-100 text-yellow-800',
  platinum: 'bg-purple-100 text-purple-800',
};

const segmentColors: Record<string, string> = {
  'Champions': '#22c55e', 'Loyal': '#3b82f6', 'Potential Loyal': '#8b5cf6',
  'New Customers': '#06b6d4', 'Promising': '#f59e0b', 'Need Attention': '#f97316',
  'About To Sleep': '#ef4444', 'At Risk': '#dc2626', "Can't Lose Them": '#991b1b',
  'Hibernating': '#6b7280', 'Lost': '#374151',
};

const tierNames: Record<string, string> = {
  bronze: 'Бронза', silver: 'Срібло', gold: 'Золото', platinum: 'Платина'
};

const segmentNames: Record<string, string> = {
  'Champions': 'Чемпіони', 'Loyal': 'Лояльні', 'Potential Loyal': 'Потенційно лояльні',
  'New Customers': 'Нові клієнти', 'Promising': 'Перспективні', 'Need Attention': 'Потребують уваги',
  'About To Sleep': 'Засинають', 'At Risk': 'В зоні ризику', "Can't Lose Them": 'Не можна втратити',
  'Hibernating': 'Сплячі', 'Lost': 'Втрачені'
};

function safeDate(val: string | null | undefined) {
  if (!val) return '-';
  try { return format(parseISO(val), 'dd.MM.yyyy'); } catch { return '-'; }
}

type ClientReminderRow = ClientPurchase & {
  client_name: string | null;
  client_phone: string | null;
};

// ─────────────────────────────────────────
// Картка клієнта
// ─────────────────────────────────────────
function ClientCard({ clientId }: { clientId: number }) {
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [comms, setComms] = useState<CommunicationLog[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyTransaction[]>([]);
  const [purchases, setPurchases] = useState<ClientPurchase[]>([]);
  const [segmentAction, setSegmentAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [clientRes, ordersRes, commsRes, loyaltyRes, purchasesRes] = await Promise.all([
        supabase.from('clients').select('*').eq('client_id', clientId).single(),
        supabase.from('client_orders').select('*').eq('client_id', clientId).order('order_date', { ascending: false }).limit(50),
        supabase.from('communication_log').select('*').eq('client_id', clientId).order('sent_at', { ascending: false }).limit(50),
        supabase.from('loyalty_transactions').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(50),
        fetchFilteredRemindersRpc('', '', clientId),
      ]);

      if (clientRes.data) {
        setClient(clientRes.data);
        if (clientRes.data.rfm_segment) {
          const segRes = await supabase
            .from('rfm_segments')
            .select('recommended_action')
            .eq('segment_name', clientRes.data.rfm_segment)
            .single();
          setSegmentAction(segRes.data?.recommended_action ?? null);
        }
      }
      setOrders(ordersRes.data ?? []);
      setComms(commsRes.data ?? []);
      setLoyalty(loyaltyRes.data ?? []);
      setPurchases((purchasesRes.data ?? []) as ClientReminderRow[]);
      setLoading(false);
    }
    load();
  }, [clientId]);

  if (loading) return <div className="text-center py-20 text-gray-400">Завантаження...</div>;
  if (!client) return <p className="text-center text-gray-500 mt-10">Клієнта не знайдено</p>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Назад до списку
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{client.full_name}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              {client.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{client.phone}</span>}
              {client.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{client.email}</span>}
              {client.instagram && (
                <a href={client.instagram.startsWith('http') ? client.instagram : `https://instagram.com/${client.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800">
                  <AtSign className="w-3.5 h-3.5" />{client.instagram}
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${tierColors[client.loyalty_tier]}`}>
                {tierNames[client.loyalty_tier] || client.loyalty_tier}
              </span>
              {client.rfm_segment && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: segmentColors[client.rfm_segment] || '#6b7280' }}>
                  {segmentNames[client.rfm_segment] || client.rfm_segment}
                </span>
              )}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${client.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {client.is_active ? 'Активний' : 'Неактивний'}
              </span>
              {(client.tags || []).map(t => (
                <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center gap-1">
                  <Tag className="w-3 h-3" />{t}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{client.loyalty_points ?? 0}</p>
            <p className="text-xs text-gray-500">бонусних балів</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div><p className="text-sm text-gray-500">Замовлень</p><p className="text-lg font-bold text-gray-900">{client.total_orders}</p></div>
          <div><p className="text-sm text-gray-500">Витрачено</p><p className="text-lg font-bold text-gray-900">{(client.total_spent ?? 0).toLocaleString()} грн</p></div>
          <div><p className="text-sm text-gray-500">Середній чек</p><p className="text-lg font-bold text-gray-900">{Math.round(client.avg_order_value ?? 0)} грн</p></div>
          <div><p className="text-sm text-gray-500">Остання покупка</p><p className="text-lg font-bold text-gray-900">{safeDate(client.last_order_date)}</p></div>
        </div>

        {segmentAction && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50">
            <p className="text-sm text-gray-600"><strong>Рекомендація:</strong> {segmentAction}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Замовлення ({orders.length})
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {orders.length === 0 && <p className="text-sm text-gray-400">Немає замовлень</p>}
            {orders.map(o => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">#{o.order_id}</p>
                  <p className="text-xs text-gray-500">{safeDate(o.order_date)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{(o.total_amount ?? 0).toLocaleString()} грн</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Комунікації ({comms.length})
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {comms.length === 0 && <p className="text-sm text-gray-400">Немає комунікацій</p>}
            {comms.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.communication_type}</p>
                  <p className="text-xs text-gray-500">{c.message_preview?.slice(0, 40)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  c.status === 'clicked' ? 'bg-green-100 text-green-700' :
                  c.status === 'opened' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>{{ clicked: 'Клік', opened: 'Відкрито', sent: 'Надіслано', delivered: 'Доставлено' }[c.status] || c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5" /> Транзакції балів ({loyalty.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {loyalty.length === 0 && <p className="text-sm text-gray-400">Немає транзакцій</p>}
            {loyalty.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div>
                  <p className="text-sm text-gray-700">{t.reason}</p>
                  <p className="text-xs text-gray-400">{safeDate(t.created_at)}</p>
                </div>
                <span className={`text-sm font-semibold ${t.points >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {t.points > 0 ? '+' : ''}{t.points}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Прогноз покупок
          </h3>
          <div className="space-y-2">
            {purchases.length === 0 && <p className="text-sm text-gray-400">Немає даних</p>}
            {purchases.map(p => (
              <div key={p.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{p.product_name}</p>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Закінчується: {safeDate(p.expected_end_date)}</span>
                  <span className={p.reminder_sent ? 'text-green-600' : 'text-orange-500'}>
                    {p.reminder_sent ? 'Надіслано' : 'Очікує'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Список клієнтів з пагінацією
// ─────────────────────────────────────────
function ClientsList() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'total_spent' | 'last_order_date' | 'total_orders'>('total_spent');
  const [sortAsc, setSortAsc] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState<'active'|'inactive'>('active');
  const [toggling, setToggling] = useState<number | null>(null);
  const navigate = useNavigate();

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);

    const rpcResult = await fetchClientsPageRpc({
      page,
      pageSize: PAGE_SIZE,
      search,
      segmentFilter,
      tierFilter,
      dateFrom,
      dateTo,
      activeOnly: activeTab === 'active',
      sortField,
      sortAsc,
    });

    if (rpcResult.error) {
      setClients([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    const clientsList = rpcResult.data.map(({ total_count: _totalCount, ...client }) => client);
    setClients(clientsList);
    setTotal(rpcResult.data[0]?.total_count ?? 0);
    setLoading(false);
  }, [page, search, segmentFilter, tierFilter, sortField, sortAsc, dateFrom, dateTo, activeTab]);

  // Завантаження сегментів один раз
  useEffect(() => {
    fetchRfmSegmentsListRpc().then(({ data, error }) => {
      if (error) return;
      setSegments((data ?? []).map((segment) => segment.segment_name));
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    function onClientsRefreshed() {
      void load();
    }

    window.addEventListener('clients-denormalized-refreshed', onClientsRefreshed);
    return () => window.removeEventListener('clients-denormalized-refreshed', onClientsRefreshed);
  }, [load]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // Пошук із debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  function onFilterChange(setter: (v: string) => void, val: string) {
    setPage(0);
    setter(val);
  }

  function handleSort(field: 'total_spent' | 'last_order_date' | 'total_orders') {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default to descending
    }
    setPage(0);
  }

  async function toggleActive(e: React.MouseEvent, c: Client) {
    e.stopPropagation();
    setToggling(c.client_id);
    const newVal = !c.is_active;
    await supabase.from('clients').update({ is_active: newVal }).eq('client_id', c.client_id);
    setClients(prev => prev.map(cl => cl.client_id === c.client_id ? { ...cl, is_active: newVal } : cl));
    setTotal(prev => prev - 1); // it'll disappear from the current tab
    setToggling(null);
  }

  const tiers = ['bronze', 'silver', 'gold', 'platinum'];
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE + PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Клієнти ({total.toLocaleString()})</h1>
        {!loading && <p className="text-sm text-gray-400">{from}–{to} з {total.toLocaleString()}</p>}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => { setActiveTab('active'); setPage(0); }} className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === 'active' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          Активні
        </button>
        <button onClick={() => { setActiveTab('inactive'); setPage(0); }} className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === 'inactive' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          Вимкнені
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Пошук за ім'ям, телефоном, email..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select value={segmentFilter} onChange={e => onFilterChange(setSegmentFilter, e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="all">Всі сегменти</option>
          {segments.map(s => <option key={s} value={s}>{segmentNames[s] || s}</option>)}
        </select>
        <select value={tierFilter} onChange={e => onFilterChange(setTierFilter, e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="all">Всі рівні</option>
          {tiers.map(t => <option key={t} value={t}>{tierNames[t] || t}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => onFilterChange(setDateFrom, e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 w-[130px]" title="Від (Дата останнього замовлення)" />
          <span className="text-gray-400">-</span>
          <input type="date" value={dateTo} onChange={e => onFilterChange(setDateTo, e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 w-[130px]" title="До (Дата останнього замовлення)" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Завантаження...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Клієнт</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Сегмент</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Рівень</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium cursor-pointer hover:bg-gray-100 transition select-none" onClick={() => handleSort('total_orders')}>
                    <div className="flex items-center justify-end gap-1">
                      Замовлень
                      {sortField === 'total_orders' && (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium cursor-pointer hover:bg-gray-100 transition select-none" onClick={() => handleSort('total_spent')}>
                    <div className="flex items-center justify-end gap-1">
                      Витрачено
                      {sortField === 'total_spent' && (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium hidden md:table-cell cursor-pointer hover:bg-gray-100 transition select-none" onClick={() => handleSort('last_order_date')}>
                    <div className="flex items-center justify-end gap-1">
                      Останнє
                      {sortField === 'last_order_date' && (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium whitespace-nowrap">Увімк.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Нічого не знайдено</td></tr>
                )}
                {clients.map(c => (
                  <tr key={c.client_id} onClick={() => navigate(`/clients/${c.client_id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.full_name}</p>
                      <p className="text-xs text-gray-500">{c.phone || c.email || '-'}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {c.rfm_segment && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: segmentColors[c.rfm_segment] || '#6b7280' }}>
                          {segmentNames[c.rfm_segment] || c.rfm_segment}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[c.loyalty_tier] ?? 'bg-gray-100 text-gray-600'}`}>
                        {tierNames[c.loyalty_tier] || c.loyalty_tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{c.total_orders}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">{(c.total_spent ?? 0).toLocaleString()} грн</td>
                    <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">
                      {safeDate(c.last_order_date)}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => toggleActive(e, c)}
                        disabled={toggling === c.client_id}
                        className="relative inline-flex items-center cursor-pointer disabled:cursor-wait"
                        title={c.is_active ? 'Вимкнути' : 'Увімкнути'}
                      >
                        <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${c.is_active ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                        <div className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${c.is_active ? 'translate-x-5' : 'translate-x-1'} ${toggling === c.client_id ? 'opacity-50' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Пагінація */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Попередня
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                  const p = totalPages <= 10 ? i
                    : page < 5 ? i
                    : page > totalPages - 6 ? totalPages - 10 + i
                    : page - 4 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 text-sm rounded-lg ${p === page
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'hover:bg-gray-100 text-gray-600'}`}>
                      {p + 1}
                    </button>
                  );
                })}
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

export default function ClientsPage() {
  const { id } = useParams();
  if (id) return <ClientCard clientId={Number(id)} />;
  return <ClientsList />;
}
