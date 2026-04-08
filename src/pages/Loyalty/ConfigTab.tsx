import { Gem, Edit2, Wand2 } from 'lucide-react';
import type { LoyaltyTier } from '../../types';
import { getTierColor, getTierLabel } from '../../lib/loyalty';

interface Props {
  tiers: LoyaltyTier[];
  tierCounts: Record<string, number>;
  seeding: boolean;
  setEditingTier: (tier: LoyaltyTier) => void;
  setIsCreatingTier: (v: boolean) => void;
  seedDefaults: () => Promise<void>;
}

export function ConfigTab({ tiers, tierCounts, seeding, setEditingTier, setIsCreatingTier, seedDefaults }: Props) {
  if (tiers.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiers.map((tier) => (
        <div key={tier.tier_name} className="bg-white rounded-xl border-2 shadow-sm p-6" style={{ borderColor: getTierColor(tier.tier_name) }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gem className="w-5 h-5" style={{ color: getTierColor(tier.tier_name) }} />
              <h3 className="text-lg font-bold text-gray-900">{getTierLabel(tier.tier_name)}</h3>
            </div>
            <button
              onClick={() => { setIsCreatingTier(false); setEditingTier(tier); }}
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition"
            >
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
  );
}
