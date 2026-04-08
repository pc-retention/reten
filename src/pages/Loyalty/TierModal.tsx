import { Gem, X } from 'lucide-react';
import type { LoyaltyTier } from '../../types';
import { getTierColor, getTierLabel } from '../../lib/loyalty';

interface Props {
  editingTier: LoyaltyTier;
  isCreatingTier: boolean;
  saving: boolean;
  setEditingTier: (tier: LoyaltyTier | null) => void;
  setIsCreatingTier: (v: boolean) => void;
  saveTier: (e: React.FormEvent) => Promise<void>;
}

export function TierModal({ editingTier, isCreatingTier, saving, setEditingTier, setIsCreatingTier, saveTier }: Props) {
  return (
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
  );
}
