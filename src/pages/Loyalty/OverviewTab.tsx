import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getTierBadgeStyle, getTierLabel } from '../../lib/loyalty';
import type { LoyaltyTopClientRow } from '../../lib/serverQueries';
import type { LoyaltyOverview } from './useLoyalty';

interface PieEntry {
  name: string;
  value: number;
  color: string;
}

interface Props {
  overview: LoyaltyOverview;
  topClients: LoyaltyTopClientRow[];
  pieData: PieEntry[];
}

export function OverviewTab({ overview, topClients, pieData }: Props) {
  return (
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
                label={({ name, value }: { name?: string; value?: number }) => `${name ?? ''}: ${value ?? 0}`}>
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
                  <span className="text-xs px-1.5 py-0.5 rounded capitalize" style={getTierBadgeStyle(c.loyalty_tier)}>{getTierLabel(c.loyalty_tier)}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{c.loyalty_points.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
