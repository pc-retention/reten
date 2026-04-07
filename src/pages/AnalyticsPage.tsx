import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { fetchAnalyticsSummaryRpc, fetchCohortMatrixRpc, fetchLtvBySegmentRpc, fetchMetricsSeriesRpc, fetchRepeatPurchaseFunnelRpc, type AnalyticsSummaryRow, type FunnelRow, type LtvBySegmentRow } from '../lib/serverQueries';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { CohortSnapshot, MetricsDaily } from '../types';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7' | '14' | '30'>('30');
  const [summary, setSummary] = useState<AnalyticsSummaryRow | null>(null);
  const [metrics, setMetrics] = useState<MetricsDaily[]>([]);
  const [cohorts, setCohorts] = useState<CohortSnapshot[]>([]);
  const [funnel, setFunnel] = useState<FunnelRow[]>([]);
  const [ltvBySegment, setLtvBySegment] = useState<LtvBySegmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatic() {
      const [cohortsRes, funnelRes, ltvRes] = await Promise.all([
        fetchCohortMatrixRpc(),
        fetchRepeatPurchaseFunnelRpc(),
        fetchLtvBySegmentRpc(8),
      ]);

      setCohorts(cohortsRes.data);
      setFunnel(funnelRes.data);
      setLtvBySegment(ltvRes.data);
    }

    loadStatic();
  }, []);

  useEffect(() => {
    async function loadPeriodData() {
      setLoading(true);
      const periodDays = Number(period);
      const [summaryRes, metricsRes] = await Promise.all([
        fetchAnalyticsSummaryRpc(periodDays),
        fetchMetricsSeriesRpc(periodDays),
      ]);

      setSummary(summaryRes.data);
      setMetrics(metricsRes.data);
      setLoading(false);
    }

    loadPeriodData();
  }, [period]);

  const totalRev = summary?.total_revenue ?? 0;
  const revChange = summary?.revenue_change_pct ?? 0;
  const avgAOV = summary?.avg_aov ?? 0;
  const retentionRate = summary?.retention_rate ?? 0;
  const churnRate = summary?.churn_rate ?? 0;
  const avgLTV = summary?.avg_ltv ?? 0;

  const chartData = metrics.map(m => ({
    date: format(parseISO(m.date), 'd MMM', { locale: uk }),
    revenue: m.total_revenue,
    orders: m.total_orders,
    aov: m.avg_order_value,
  }));

  const cohortMonths = [...new Set(cohorts.map(c => c.cohort_month))].sort();
  const maxMonthsSince = cohorts.length > 0 ? Math.max(...cohorts.map(c => c.months_since_first)) : 0;
  const cohortMap = new Map(cohorts.map(c => [`${c.cohort_month}:${c.months_since_first}`, c]));

  function getRetention(cohort: string, monthsSince: number): number | null {
    const snap = cohortMap.get(`${cohort}:${monthsSince}`);
    return snap ? snap.retention_rate : null;
  }

  function retentionColor(rate: number): string {
    if (rate >= 80) return 'bg-green-500 text-white';
    if (rate >= 60) return 'bg-green-400 text-white';
    if (rate >= 40) return 'bg-yellow-400 text-gray-900';
    if (rate >= 20) return 'bg-orange-400 text-white';
    return 'bg-red-400 text-white';
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Завантаження...</div>;

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

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Сер. LTV', value: `${Math.round(avgLTV).toLocaleString()} грн`, change: '0%', up: true },
          { label: 'Сер. чек', value: `${Math.round(avgAOV)} грн`, change: '0%', up: true },
          { label: 'Утримання', value: `${retentionRate.toFixed(1)}%`, change: '0%', up: true },
          { label: 'Відтік', value: `${churnRate.toFixed(1)}%`, change: '0%', up: false },
          { label: `Виручка (${period}д)`, value: `${Math.round(totalRev).toLocaleString()} грн`, change: `${revChange > 0 ? '+' : ''}${revChange.toFixed(1)}%`, up: revChange >= 0 },
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
            <BarChart data={ltvBySegment} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis type="category" dataKey="segment_name" tick={{ fontSize: 10 }} width={100} stroke="#94a3b8" />
              <Tooltip formatter={(v) => [`${(v as number).toLocaleString()} грн`, 'LTV']} />
              <Bar dataKey="ltv" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Воронка повторних покупок</h2>
        <div className="grid grid-cols-4 gap-4">
          {funnel.map((f) => (
            <div key={f.step_order} className="text-center">
              <div className="relative mx-auto mb-3" style={{ width: `${60 + f.pct * 0.4}%` }}>
                <div className="h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'][f.step_order - 1] || '#6366f1' }}>
                  <span className="text-white font-bold text-lg">{f.client_count}</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700">{f.step_name}</p>
              <p className="text-xs text-gray-500">{f.pct}%</p>
            </div>
          ))}
        </div>
      </div>

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
                const size = cohortMap.get(`${cohort}:0`)?.cohort_size || 0;
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
