import { Gem, TrendingUp, Settings2, Plus } from 'lucide-react';
import { useLoyalty } from './useLoyalty';
import { OverviewTab } from './OverviewTab';
import { TransactionsTab } from './TransactionsTab';
import { ConfigTab } from './ConfigTab';
import { TierModal } from './TierModal';
import { useState } from 'react';

type LoyaltyTab = 'overview' | 'transactions' | 'config';

const TABS = [
  { key: 'overview' as const, label: 'Огляд', icon: Gem },
  { key: 'transactions' as const, label: 'Транзакції', icon: TrendingUp },
  { key: 'config' as const, label: 'Рівні', icon: Settings2 },
];

export default function LoyaltyPage() {
  const [tab, setTab] = useState<LoyaltyTab>('overview');
  const loyalty = useLoyalty();

  if (loyalty.loading) {
    return <div className="text-center py-20 text-gray-400">Завантаження...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Програма лояльності</h1>
        <button
          onClick={loyalty.startCreateTier}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
        >
          <Plus className="w-4 h-4" />
          Новий рівень
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition ${
              tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <OverviewTab
          overview={loyalty.overview}
          topClients={loyalty.topClients}
          pieData={loyalty.pieData}
        />
      )}

      {tab === 'transactions' && (
        <TransactionsTab
          transactions={loyalty.transactions}
          transactionsPage={loyalty.transactionsPage}
          transactionsTotalPages={loyalty.transactionsTotalPages}
          setTransactionsPage={loyalty.setTransactionsPage}
        />
      )}

      {tab === 'config' && (
        <ConfigTab
          tiers={loyalty.tiers}
          tierCounts={loyalty.tierCounts}
          seeding={loyalty.seeding}
          setEditingTier={loyalty.setEditingTier}
          setIsCreatingTier={loyalty.setIsCreatingTier}
          seedDefaults={loyalty.seedDefaults}
        />
      )}

      {loyalty.editingTier && (
        <TierModal
          editingTier={loyalty.editingTier}
          isCreatingTier={loyalty.isCreatingTier}
          saving={loyalty.saving}
          setEditingTier={loyalty.setEditingTier}
          setIsCreatingTier={loyalty.setIsCreatingTier}
          saveTier={loyalty.saveTier}
        />
      )}
    </div>
  );
}
