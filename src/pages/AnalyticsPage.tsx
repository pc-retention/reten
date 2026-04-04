import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { metricsDaily, cohortSnapshots, clients } from '../lib/testData';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7' | '14' | '30'>('30');

  const days = metricsDaily.slice(-Number(period));
  const prevDays = metricsDaily.slice(-Number(period) * 2, -Number(period));

  const totalRev = days.reduce((s, m) => s + m.total_revenue, 0);
  const prevRev = prevDays.reduce((s, m) => s + m.total_revenue, 0);
  const revChange = prevRev > 0 ? ((totalRev - prevRev) / prevRev * 100).toFixed(1) : '0';

  const totalOrders = days.reduce((s, m) => s + m.total_orders, 0);
  const avgAOV = totalOrders > 0 ? totalRev / totalOrders : 0;

  const totalClients = clients.length;
  const repeatClients = clients.filter(c => c.total_orders >= 2).length;
  const retentionRate = (repeatClients / Math.max(totalClients, 1) * 100);
  const churnedClients = clients.filter(c => !c.is_active).length;
  const churnRate = (churnedClients / Math.max(totalClients, 1) * 100);

  const avgLTV = clients.filter(c => c.total_spent > 0).reduce((s, c) => s + c.total_spent, 0) / Math.max(clients.filter(c => c.total_spent > 0).length, 1);

  // Воронка
  const t1 = clients.filter(c => c.total_orders >= 1).length;
  const t2 = clients.filter(c => c.total_orders >= 2).length;
  const t3 = clients.filter(c => c.total_orders >= 3).length;
  const t4 = clients.filter(c => c.total_orders >= 4).length;
  const funnelData = [
    { name: '1 покупка', count: t1, pct: 100, color: '#6366f1' },
    { name: '2 покупки', count: t2, pct: Math.round(t2 / t1 * 100), color: '#8b5cf6' },
    { name: '3 покупки', count: t3, pct: Math.round(t3 / t1 * 100), color: '#a78bfa' },
    { name: '4+ покупок', count: t4, pct: Math.round(t4 / t1 * 100), color: '#c4b5fd' },
  ];

  // LTV по сегментах
  const segmentLTV: Record<string, { sum: number; count: number }> = {};
  clients.forEach(c => {
    if (c.rfm_segment && c.total_spent > 0) {
      if (!segmentLTV[c.rfm_segment]) segmentLTV[c.rfm_segment] = { sum: 0, count: 0 };
      segmentLTV[c.rfm_segment].sum += c.total_spent;
      segmentLTV[c.rfm_segment].count += 1;
    }
  });
  const ltvBySegment = Object.entries(segmentLTV)
    .map(([name, d]) => ({ name, ltv: Math.round(d.sum / d.count) }))
    .sort((a, b) => b.ltv - a.ltv);

  const chartData = days.map(m => ({
    date: format(parseISO(m.date), 'd MMM', { locale: uk }),
    revenue: m.total_revenue,
    orders: m.total_orders,
    aov: m.avg_order_value,
  }));

  // Когортна таблиця
  const cohortMonths = [...new Set(cohortSnapshots.map(c => c.cohort_month))].sort();
  const maxMonthsSince = Math.max(...cohortSnapshots.map(c => c.months_since_first));

  function getRetention(cohort: string, monthsSince: number): number | null {
    const snap = cohortSnapshots.find(c => c.cohort_month === cohort && c.months_since_first === monthsSince);
    return snap ? snap.retention_rate : null;
  }

  function retentionColor(rate: number): string {
    if (rate >= 80) return 'bg-green-500 text-white';
    if (rate >= 60) return 'bg-green-400 text-white';
    if (rate >= 40) return 'bg-yellow-400 text-gray-900';
    if (rate >= 20) return 'bg-orange-400 text-white';
    return 'bg-red-400 text-white';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Аналітика</h1>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['7', '14', '30'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${period === p ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              {p} днів
            </button>
          ))}
        </div>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Сер. LTV', value: `${Math.round(avgLTV).toLocaleString()} грн`, change: '+12%', up: true },
          { label: 'Сер. чек', value: `${Math.round(avgAOV)} грн`, change: '+5.2%', up: true },
          { label: 'Утримання', value: `${retentionRate.toFixed(1)}%`, change: '+2.1%', up: true },
          { label: 'Відтік', value: `${churnRate.toFixed(1)}%`, change: '-1.5%', up: false },
          { label: `Виручка (${period}д)`, value: `${Math.round(totalRev).toLocaleString()} грн`, change: `${Number(revChange) > 0 ? '+' : ''}${revChange}%`, up: Number(revChange) > 0 },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">{m.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{m.value}</p>
            <span className={`text-xs font-medium flex items-center gap-0.5 mt-2 ${m.up ? 'text-green-600' : 'text-red-500'}`}>
              {m.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {m.change}
            </span>
          </div>
        ))}
      </div>

      {/* Графіки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Виручка</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip formatter={(v) => [`${(v as number).toLocaleString()} грн`, 'Виручка']} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">LTV за сегментами</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ltvBySegment.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} stroke="#94a3b8" />
              <Tooltip formatter={(v) => [`${(v as number).toLocaleString()} грн`, 'LTV']} />
              <Bar dataKey="ltv" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Воронка */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Воронка повторних покупок</h2>
        <div className="grid grid-cols-4 gap-4">
          {funnelData.map((f, i) => (
            <div key={i} className="text-center">
              <div className="relative mx-auto mb-3" style={{ width: `${60 + f.pct * 0.4}%` }}>
                <div className="h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: f.color }}>
                  <span className="text-white font-bold text-lg">{f.count}</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700">{f.name}</p>
              <p className="text-xs text-gray-500">{f.pct}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Когортна таблиця */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Когортний аналіз (% утримання)</h2>
        <div className="overflow-x-auto">
          <table className="text-xs min-w-full">
            <thead>
              <tr>
                <th className="text-left px-2 py-2 text-gray-500 font-medium">Когорта</th>
                <th className="text-center px-2 py-2 text-gray-500 font-medium">Розмір</th>
                {Array.from({ length: Math.min(maxMonthsSince + 1, 13) }, (_, i) => (
                  <th key={i} className="text-center px-2 py-2 text-gray-500 font-medium">M{i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortMonths.map(cohort => {
                const size = cohortSnapshots.find(c => c.cohort_month === cohort && c.months_since_first === 0)?.cohort_size || 0;
                return (
                  <tr key={cohort}>
                    <td className="px-2 py-1.5 font-medium text-gray-700">{format(parseISO(cohort), 'MMM yyyy', { locale: uk })}</td>
                    <td className="px-2 py-1.5 text-center text-gray-600">{size}</td>
                    {Array.from({ length: Math.min(maxMonthsSince + 1, 13) }, (_, i) => {
                      const rate = getRetention(cohort, i);
                      return (
                        <td key={i} className="px-1 py-1">
                          {rate !== null ? (
                            <div className={`rounded px-1.5 py-1 text-center font-medium ${retentionColor(rate)}`}>
                              {rate.toFixed(0)}%
                            </div>
                          ) : <div className="text-center text-gray-300">-</div>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
