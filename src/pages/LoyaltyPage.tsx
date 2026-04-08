import { useCallback, useEffect, useState } from 'react';
import { Gem, TrendingUp, Settings2, Edit2, Plus, X, ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { LoyaltyTier } from '../types';
import {
  fetchLoyaltyOverviewRpc,
  fetchLoyaltyTiersListRpc,
  refreshClientsDenormalizedRpc,
  fetchLoyaltyTopClientsRpc,
  fetchLoyaltyTransactionsPageRpc,
  seedDefaultLoyaltyTiersRpc,
  upsertLoyaltyTierRpc,
  type LoyaltyTopClientRow,
  type LoyaltyTransactionRow,
} from '../lib/serverQueries';
import { getTierBadgeStyle, getTierColor, getTierLabel } from '../lib/loyalty';
import { supabase } from '../lib/supabase';

const TRANSACTIONS_PAGE_SIZE = 50;

type LoyaltyOverview = {
  totalClients: number;
  totalPoints: number;
  avgPoints: number;
  participationRate: number;
  transactionsCount: number;
};

const emptyOverview: LoyaltyOverview = {
  totalClients: 0,
  totalPoints: 0,
  avgPoints: 0,
  participationRate: 0,
  transactionsCount: 0,
};

export default function LoyaltyPage() {
  const [tab, setTab] = useState<'overview' | 'transactions' | 'config'>('overview');
  const [overview, setOverview] = useState<LoyaltyOverview>(emptyOverview);
  const [topClients, setTopClients] = useState<LoyaltyTopClientRow[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransactionRow[]>([]);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [transactionsPage, setTransactionsPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [tierCounts, setTierCounts] = useState<Record<string, number>>({});
  const [isCreatingTier, setIsCreatingTier] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadOverview = useCallback(async () => {
    const [overviewRes, topClientsRes, tiersRes, tierCountsRes] = await Promise.all([
      fetchLoyaltyOverviewRpc(),
      fetchLoyaltyTopClientsRpc(10),
      fetchLoyaltyTiersListRpc(),
      supabase
        .from('clients')
        .select('loyalty_tier')
        .eq('is_active', true)
        .gt('total_orders', 0),
    ]);

    if (!overviewRes.error && overviewRes.data) {
      setOverview({
        totalClients: overviewRes.data.total_clients ?? 0,
        totalPoints: overviewRes.data.total_points ?? 0,
        avgPoints: overviewRes.data.avg_points ?? 0,
        participationRate: overviewRes.data.participation_rate ?? 0,
        transactionsCount: overviewRes.data.transactions_count ?? 0,
      });
    }

    if (!topClientsRes.error) {
      setTopClients(topClientsRes.data);
    }

    if (!tiersRes.error) {
      setTiers(tiersRes.data);
    }

    if (!tierCountsRes.error) {
      const nextCounts: Record<string, number> = {};

      for (const row of tierCountsRes.data ?? []) {
        if (!row.loyalty_tier) {
          continue;
        }

        nextCounts[row.loyalty_tier] = (nextCounts[row.loyalty_tier] ?? 0) + 1;
      }

      setTierCounts(nextCounts);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    const result = await fetchLoyaltyTransactionsPageRpc(transactionsPage, TRANSACTIONS_PAGE_SIZE);
    if (!result.error) {
      setTransactions(result.data);
      setTransactionsTotal(result.data[0]?.total_count ?? 0);
    }
  }, [transactionsPage]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([loadOverview(), loadTransactions()]);
      setLoading(false);
    }
    void load();
  }, [loadOverview, loadTransactions]);

  useEffect(() => {
    if (tab === 'transactions') {
      void loadTransactions();
    }
  }, [tab, loadTransactions]);

  async function saveTier(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTier) return;
    const tierName = editingTier.tier_name.trim();

    if (!tierName) {
      toast.error('Вкажи назву рівня');
      return;
    }

    setSaving(true);

    const { error } = await upsertLoyaltyTierRpc({
      tierName,
      minTotalSpent: editingTier.min_total_spent,
      minOrders: editingTier.min_orders,
      cashbackPercent: editingTier.cashback_percent,
      bonusMultiplier: editingTier.bonus_multiplier,
      perks: editingTier.perks,
      sortOrder: editingTier.sort_order,
    });

    if (error) {
      toast.error('Помилка збереження');
    } else {
      const refreshResult = await refreshClientsDenormalizedRpc();
      if (refreshResult.error) {
        toast.error('Рівень збережено, але не вдалося перерахувати клієнтів');
        setSaving(false);
        return;
      }
      await loadOverview();
      toast.success(isCreatingTier ? 'Новий рівень створено' : 'Налаштування рівня оновлено');
      setEditingTier(null);
      setIsCreatingTier(false);
    }
    setSaving(false);
  }

  async function seedDefaults() {
    setSeeding(true);
    const { error } = await seedDefaultLoyaltyTiersRpc();
    if (error) {
      toast.error('Не вдалося створити стандартні рівні');
    } else {
      const refreshResult = await refreshClientsDenormalizedRpc();
      if (refreshResult.error) {
        toast.error('Рівні створено, але не вдалося перерахувати клієнтів');
        setSeeding(false);
        return;
      }
      await loadOverview();
      toast.success('Стандартні рівні створено');
    }
    setSeeding(false);
  }

  function startCreateTier() {
    const nextSortOrder = tiers.reduce((maxSortOrder, tier) => Math.max(maxSortOrder, tier.sort_order), 0) + 1;

    setIsCreatingTier(true);
    setEditingTier({
      tier_name: '',
      min_total_spent: 0,
      min_orders: 0,
      cashback_percent: 0,
      bonus_multiplier: 1,
      perks: '',
      sort_order: nextSortOrder,
    });
  }

  const pieData = tiers.map((tier) => ({
    name: getTierLabel(tier.tier_name),
    value: tierCounts[tier.tier_name] ?? 0,
    color: getTierColor(tier.tier_name),
  }));
  const transactionsTotalPages = Math.ceil(transactionsTotal / TRANSACTIONS_PAGE_SIZE);

  if (loading) return <div className="text-center py-20 text-gray-400">Завантаження...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Програма лояльності</h1>
        <button
          onClick={startCreateTier}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
        >
          <Plus className="w-4 h-4" />
          Новий рівень
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'overview', label: 'Огляд', icon: Gem },
          { key: 'transactions', label: 'Транзакції', icon: TrendingUp },
          { key: 'config', label: 'Рівні', icon: Settings2 },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as 'overview' | 'transactions' | 'config')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition ${
              tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'config' && tiers.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center space-y-4">
          <div>
            <p className="text-gray-700 font-medium">У базі ще немає рівнів лояльності.</p>
            <p className="text-sm text-gray-400 mt-1">Створи стандартні рівні й потім редагуй їх під себе.</p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => void seedDefaults()}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              Заповнити стандартно
            </button>
          </div>
        </div>
      )}

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Всього балів в обігу</p>
              <p className="text-2xl font-bold text-gray-900">{overview.totalPoints.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Середній баланс</p>
              <p className="text-2xl font-bold text-gray-900">{overview.avgPoints}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Участь в програмі</p>
              <p className="text-2xl font-bold text-gray-900">{overview.participationRate}%</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Транзакцій</p>
              <p className="text-2xl font-bold text-gray-900">{overview.transactionsCount}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Розподіл по рівнях</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Топ-10 по балах</h2>
              <div className="space-y-2">
                {topClients.map((c, i) => (
                  <div key={c.client_id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{c.full_name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                        ''
                      }`} style={getTierBadgeStyle(c.loyalty_tier)}>{getTierLabel(c.loyalty_tier)}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{c.loyalty_points.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'transactions' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Дата</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Клієнт</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Тип</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Причина</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Бали</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{format(parseISO(t.created_at), 'dd.MM.yyyy')}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{t.client_name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.transaction_type === 'earn' ? 'bg-green-100 text-green-700' :
                      t.transaction_type === 'spend' ? 'bg-red-100 text-red-700' :
                      t.transaction_type === 'bonus' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{{ earn: 'Нарахування', spend: 'Списання', bonus: 'Бонус', expire: 'Згорання' }[t.transaction_type] || t.transaction_type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.reason}</td>
                  <td className={`px-4 py-3 text-right font-bold ${t.points >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {t.points > 0 ? '+' : ''}{t.points}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Немає транзакцій</td></tr>
              )}
            </tbody>
          </table>
          {transactionsTotalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <button
                onClick={() => setTransactionsPage(p => Math.max(0, p - 1))}
                disabled={transactionsPage === 0}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Попередня
              </button>
              <span className="text-sm text-gray-600 font-medium">{transactionsPage + 1} / {transactionsTotalPages}</span>
              <button
                onClick={() => setTransactionsPage(p => Math.min(transactionsTotalPages - 1, p + 1))}
                disabled={transactionsPage >= transactionsTotalPages - 1}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Наступна <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'config' && tiers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map(tier => (
            <div key={tier.tier_name} className="bg-white rounded-xl border-2 shadow-sm p-6" style={{ borderColor: getTierColor(tier.tier_name) }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gem className="w-5 h-5" style={{ color: getTierColor(tier.tier_name) }} />
                  <h3 className="text-lg font-bold text-gray-900">{getTierLabel(tier.tier_name)}</h3>
                </div>
                <button onClick={() => { setIsCreatingTier(false); setEditingTier(tier); }} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Мін. витрати</span>
                  <span className="font-medium">{tier.min_total_spent.toLocaleString()} грн</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Мін. замовлень</span>
                  <span className="font-medium">{tier.min_orders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Кешбек</span>
                  <span className="font-bold text-indigo-600">{tier.cashback_percent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Множник</span>
                  <span className="font-medium">x{tier.bonus_multiplier}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-500">{tier.perks}</span>
                </div>
                <div className="pt-2">
                  <span className="text-xs text-gray-400">Клієнтів: <strong className="text-gray-700">{tierCounts[tier.tier_name] || 0}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingTier && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <Gem className="w-5 h-5" style={{ color: getTierColor(editingTier.tier_name) }} />
                <h3 className="font-semibold text-gray-900">{isCreatingTier ? 'Новий рівень' : `Налаштування: ${getTierLabel(editingTier.tier_name)}`}</h3>
              </div>
              <button type="button" onClick={() => { setEditingTier(null); setIsCreatingTier(false); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveTier} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Назва рівня</label>
                  <input
                    required
                    type="text"
                    value={editingTier.tier_name}
                    disabled={!isCreatingTier}
                    onChange={e => setEditingTier({ ...editingTier, tier_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder="Напр. VIP"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Порядок</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={editingTier.sort_order}
                    onChange={e => setEditingTier({ ...editingTier, sort_order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Мін. сума витрат (грн)</label>
                  <input required type="number" min="0" value={editingTier.min_total_spent} onChange={e => setEditingTier({ ...editingTier, min_total_spent: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Мін. к-сть замовлень</label>
                  <input required type="number" min="0" value={editingTier.min_orders} onChange={e => setEditingTier({ ...editingTier, min_orders: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Кешбек (%)</label>
                  <input required type="number" min="0" max="100" value={editingTier.cashback_percent} onChange={e => setEditingTier({ ...editingTier, cashback_percent: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Множник балів</label>
                  <input required type="number" min="1" step="0.1" value={editingTier.bonus_multiplier} onChange={e => setEditingTier({ ...editingTier, bonus_multiplier: parseFloat(e.target.value) || 1 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Опис переваг рівня</label>
                <textarea rows={2} value={editingTier.perks || ''} onChange={e => setEditingTier({ ...editingTier, perks: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Напр. Безкоштовна доставка..." />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => { setEditingTier(null); setIsCreatingTier(false); }} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition">Скасувати</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">{saving ? 'Збереження...' : 'Зберегти'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
