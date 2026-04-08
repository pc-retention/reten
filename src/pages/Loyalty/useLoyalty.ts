import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { LoyaltyTier } from '../../types';
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
} from '../../lib/serverQueries';
import { getTierColor, getTierLabel } from '../../lib/loyalty';
import { supabase } from '../../lib/supabase';

const TRANSACTIONS_PAGE_SIZE = 50;

export type LoyaltyOverview = {
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

export function useLoyalty() {
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

    if (!topClientsRes.error) setTopClients(topClientsRes.data);
    if (!tiersRes.error) setTiers(tiersRes.data);

    if (!tierCountsRes.error) {
      const nextCounts: Record<string, number> = {};
      for (const row of tierCountsRes.data ?? []) {
        if (!row.loyalty_tier) continue;
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTransactions();
  }, [loadTransactions]);

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

  return {
    overview,
    topClients,
    tiers,
    transactions,
    transactionsTotal,
    transactionsPage,
    setTransactionsPage,
    transactionsTotalPages,
    TRANSACTIONS_PAGE_SIZE,
    loading,
    editingTier,
    setEditingTier,
    tierCounts,
    isCreatingTier,
    setIsCreatingTier,
    saving,
    seeding,
    pieData,
    saveTier,
    seedDefaults,
    startCreateTier,
  };
}
