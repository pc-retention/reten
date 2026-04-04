import { useState } from 'react';
import { Gem, TrendingUp, Settings2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { clients, loyaltyTiers, loyaltyTransactions } from '../lib/testData';
import { format, parseISO } from 'date-fns';

const tierColors: Record<string, string> = {
  bronze: '#d97706',
  silver: '#6b7280',
  gold: '#eab308',
  platinum: '#7c3aed',
};

export default function LoyaltyPage() {
  const [tab, setTab] = useState<'overview' | 'transactions' | 'config'>('overview');

  // Розподіл по рівнях
  const tierCounts: Record<string, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
  clients.forEach(c => { tierCounts[c.loyalty_tier] = (tierCounts[c.loyalty_tier] || 0) + 1; });

  const pieData = Object.entries(tierCounts).map(([name, value]) => ({
    name, value, color: tierColors[name],
  }));

  const totalPoints = clients.reduce((s, c) => s + c.loyalty_points, 0);
  const avgPoints = Math.round(totalPoints / Math.max(clients.length, 1));
  const participationRate = (clients.filter(c => c.loyalty_points > 0).length / clients.length * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Програма лояльності</h1>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'overview', label: 'Огляд', icon: Gem },
          { key: 'transactions', label: 'Транзакції', icon: TrendingUp },
          { key: 'config', label: 'Рівні', icon: Settings2 },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition ${
              tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Всього балів в обігу</p>
              <p className="text-2xl font-bold text-gray-900">{totalPoints.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Середній баланс</p>
              <p className="text-2xl font-bold text-gray-900">{avgPoints}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Участь в програмі</p>
              <p className="text-2xl font-bold text-gray-900">{participationRate}%</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Транзакцій</p>
              <p className="text-2xl font-bold text-gray-900">{loyaltyTransactions.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Розподіл по рівнях</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Топ клієнти */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Топ-10 по балах</h2>
              <div className="space-y-2">
                {[...clients].sort((a, b) => b.loyalty_points - a.loyalty_points).slice(0, 10).map((c, i) => (
                  <div key={c.client_id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{c.full_name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                        c.loyalty_tier === 'platinum' ? 'bg-purple-100 text-purple-700' :
                        c.loyalty_tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                        c.loyalty_tier === 'silver' ? 'bg-gray-100 text-gray-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{c.loyalty_tier}</span>
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
              {[...loyaltyTransactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(t => {
                const client = clients.find(c => c.client_id === t.client_id);
                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{format(parseISO(t.created_at), 'dd.MM.yyyy')}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{client?.full_name || '-'}</td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loyaltyTiers.map(tier => (
            <div key={tier.tier_name} className="bg-white rounded-xl border-2 shadow-sm p-6" style={{ borderColor: tierColors[tier.tier_name] }}>
              <div className="flex items-center gap-2 mb-4">
                <Gem className="w-5 h-5" style={{ color: tierColors[tier.tier_name] }} />
                <h3 className="text-lg font-bold text-gray-900 capitalize">{tier.tier_name}</h3>
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
    </div>
  );
}
