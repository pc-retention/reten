import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, ArrowDown, ArrowUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Client } from '../../types';
import {
  fetchClientsPageRpc,
  fetchLoyaltyTiersListRpc,
  fetchRfmSegmentsListRpc,
  updateClientActiveRpc,
} from '../../lib/serverQueries';
import { DEFAULT_BADGE_ALPHA, DEFAULT_BADGE_HEX, getBadgeTextColor, hexToAlphaHex } from '../../lib/colors';
import { getTierBadgeStyle, getTierLabel } from '../../lib/loyalty';
import { getSegmentLabel } from '../../lib/segments';
import { supabase } from '../../lib/supabase';

const PAGE_SIZE = 100;

function safeDate(val: string | null | undefined) {
  if (!val) return '-';
  try { return format(parseISO(val), 'dd.MM.yyyy'); } catch { return '-'; }
}

function getSegmentBadgeStyle(color: string | null | undefined) {
  const backgroundColor = color || hexToAlphaHex(DEFAULT_BADGE_HEX, DEFAULT_BADGE_ALPHA);
  return { backgroundColor, color: getBadgeTextColor(color) };
}

export function ClientsList() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [dbTotal, setDbTotal] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState<string[]>([]);
  const [tiers, setTiers] = useState<string[]>([]);
  const [segmentColors, setSegmentColors] = useState<Record<string, string | null>>({});
  const [sortField, setSortField] = useState<'total_spent' | 'last_order_date' | 'total_orders'>('total_spent');
  const [sortAsc, setSortAsc] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [toggling, setToggling] = useState<number | null>(null);
  const navigate = useNavigate();

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const visibleClientIds = clients
    .map((client) => client.client_id)
    .filter((clientId): clientId is number => typeof clientId === 'number' && Number.isFinite(clientId));
  const dbInfoLabel = dbTotal === null
    ? 'Всього в БД: —'
    : visibleClientIds.length > 0
      ? `Всього в БД: ${dbTotal.toLocaleString('uk-UA')} -- з #${Math.min(...visibleClientIds).toLocaleString('uk-UA')} по #${Math.max(...visibleClientIds).toLocaleString('uk-UA')}`
      : `Всього в БД: ${dbTotal.toLocaleString('uk-UA')}`;

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

    setClients(rpcResult.data.map(({ total_count: _, ...client }) => client));
    setTotal(rpcResult.data[0]?.total_count ?? 0);
    setLoading(false);
  }, [page, search, segmentFilter, tierFilter, sortField, sortAsc, dateFrom, dateTo, activeTab]);

  useEffect(() => {
    async function loadTaxonomies() {
      const [segmentsRes, tiersRes] = await Promise.all([
        fetchRfmSegmentsListRpc(),
        fetchLoyaltyTiersListRpc(),
      ]);
      if (!segmentsRes.error) {
        setSegments((segmentsRes.data ?? []).map((segment) => segment.segment_name));
        setSegmentColors(
          Object.fromEntries((segmentsRes.data ?? []).map((segment) => [segment.segment_name, segment.color ?? null])),
        );
      }
      if (!tiersRes.error) {
        setTiers((tiersRes.data ?? []).map((tier) => tier.tier_name));
      }
    }
    void loadTaxonomies();
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    async function loadDbTotal() {
      const { count } = await supabase
        .from('clients')
        .select('client_id', { count: 'exact', head: true });
      setDbTotal(count ?? 0);
    }
    void loadDbTotal();
  }, []);

  useEffect(() => {
    function onClientsRefreshed() { void load(); }
    window.addEventListener('clients-denormalized-refreshed', onClientsRefreshed);
    return () => window.removeEventListener('clients-denormalized-refreshed', onClientsRefreshed);
  }, [load]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(0); setSearch(searchInput); }, 400);
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
      setSortAsc(false);
    }
    setPage(0);
  }

  async function toggleActive(e: React.MouseEvent, c: Client) {
    e.stopPropagation();
    setToggling(c.client_id);
    const newVal = !c.is_active;
    await updateClientActiveRpc(c.client_id, newVal);
    setClients((prev) => prev.map((cl) => cl.client_id === c.client_id ? { ...cl, is_active: newVal } : cl));
    setTotal((prev) => prev - 1);
    setToggling(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Клієнти ({total.toLocaleString('uk-UA')})</h1>
          <p className="text-sm text-gray-400">{dbInfoLabel}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => { setActiveTab('active'); setPage(0); }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === 'active' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          Активні
        </button>
        <button onClick={() => { setActiveTab('inactive'); setPage(0); }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === 'inactive' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
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
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select value={segmentFilter} onChange={(e) => onFilterChange(setSegmentFilter, e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="all">Всі сегменти</option>
          {segments.map((segmentName) => <option key={segmentName} value={segmentName}>{getSegmentLabel(segmentName)}</option>)}
        </select>
        <select value={tierFilter} onChange={(e) => onFilterChange(setTierFilter, e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="all">Всі рівні</option>
          {tiers.map((tierName) => <option key={tierName} value={tierName}>{getTierLabel(tierName)}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={(e) => onFilterChange(setDateFrom, e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 w-[130px]" title="Від (Дата останнього замовлення)" />
          <span className="text-gray-400">-</span>
          <input type="date" value={dateTo} onChange={(e) => onFilterChange(setDateTo, e.target.value)}
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
                {clients.map((c) => (
                  <tr key={c.client_id} onClick={() => navigate(`/clients/${c.client_id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.full_name}</p>
                      <p className="text-xs text-gray-500">{c.phone || c.email || '-'}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {c.rfm_segment && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={getSegmentBadgeStyle(segmentColors[c.rfm_segment])}>
                          {getSegmentLabel(c.rfm_segment)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={getTierBadgeStyle(c.loyalty_tier)}>
                        {getTierLabel(c.loyalty_tier)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{c.total_orders}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">{(c.total_spent ?? 0).toLocaleString()} грн</td>
                    <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{safeDate(c.last_order_date)}</td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => void toggleActive(e, c)}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
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
                      className={`w-8 h-8 text-sm rounded-lg ${p === page ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-gray-100 text-gray-600'}`}>
                      {p + 1}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Наступна <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
