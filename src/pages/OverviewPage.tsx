import { useState, useEffect } from 'react';
import { BarChart3, Users, ShoppingCart, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { fetchMetricsSeriesRpc, fetchOverviewSummaryRpc, fetchRepeatPurchaseFunnelRpc, fetchTopSegmentsRpc, type FunnelRow, type OverviewSummaryRow, type TopSegmentRow } from '../lib/serverQueries';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { MetricsDaily } from '../types';
import { getSegmentLabel, segmentColors } from '../lib/segments';

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue }: {
  title: string; value: string; subtitle?: string; icon: React.ElementType;
  trend?: 'up' | 'down'; trendValue?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        {trend && (
          <span className={`flex items-center text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {trendValue}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function OverviewPage() {
  const [summary, setSummary] = useState<OverviewSummaryRow | null>(null);
  const [metrics, setMetrics] = useState<MetricsDaily[]>([]);
  const [funnel, setFunnel] = useState<FunnelRow[]>([]);
  const [topSegments, setTopSegments] = useState<TopSegmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [summaryRes, metricsRes, funnelRes, segmentsRes] = await Promise.all([
        fetchOverviewSummaryRpc(),
        fetchMetricsSeriesRpc(30),
        fetchRepeatPurchaseFunnelRpc(),
        fetchTopSegmentsRpc(5),
      ]);

      setSummary(summaryRes.data);
      setMetrics(metricsRes.data);
      setFunnel(funnelRes.data);
      setTopSegments(segmentsRes.data);
      setLoading(false);
    }

    load();
  }, []);

  const totalClients = summary?.total_clients ?? 0;
  const activeClients = summary?.active_clients ?? 0;
  const avgLTV = summary?.avg_ltv ?? 0;
  const avgAOV = summary?.avg_aov ?? 0;
  const retentionRate = summary?.retention_rate ?? 0;
  const churnRate = summary?.churn_rate ?? 0;

  const last7 = metrics.slice(-7);
  const prev7 = metrics.slice(-14, -7);
  const revNow = last7.reduce((s, m) => s + m.total_revenue, 0);
  const revPrev = prev7.reduce((s, m) => s + m.total_revenue, 0);
  const revTrend = revPrev > 0 ? ((revNow - revPrev) / revPrev * 100).toFixed(1) : '0';

  const chartData = metrics.slice(-14).map(m => ({
    date: format(parseISO(m.date), 'd MMM', { locale: uk }),
    revenue: m.total_revenue,
    orders: m.total_orders,
    newClients: m.new_clients,
  }));

  if (loading) return <div className="text-center py-20 text-gray-400">Завантаження...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Головна</h1>
        <p className="text-sm text-gray-500">{format(new Date(), 'd MMMM yyyy', { locale: uk })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard icon={DollarSign} title="Сер. LTV" value={`${Math.round(avgLTV).toLocaleString()} грн`} trend="up" trendValue={`${revTrend}%`} />
        <StatCard icon={ShoppingCart} title="Сер. чек" value={`${Math.round(avgAOV)} грн`} trend="up" trendValue="0%" />
        <StatCard icon={TrendingUp} title="Утримання" value={`${retentionRate.toFixed(1)}%`} subtitle="повторні покупки" trend="up" trendValue="0%" />
        <StatCard icon={Activity} title="Відтік" value={`${churnRate.toFixed(1)}%`} trend="down" trendValue="0%" />
        <StatCard icon={Users} title="Активних клієнтів" value={activeClients.toString()} subtitle={`з ${totalClients}`} />
        <StatCard icon={BarChart3} title="Замовлень (7д)" value={last7.reduce((s, m) => s + m.total_orders, 0).toString()} trend="up" trendValue="0%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Виручка (14 днів)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip formatter={(v) => [`${(v as number).toLocaleString()} грн`, 'Виручка']} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Замовлення (14 днів)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} name="Замовлення" />
              <Bar dataKey="newClients" fill="#22c55e" radius={[4, 4, 0, 0]} name="Нові клієнти" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Воронка повторних покупок</h2>
          <div className="space-y-3">
            {funnel.map((item, i) => (
              <div key={item.step_order}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.step_name}</span>
                  <span className="font-medium text-gray-900">{item.client_count} ({item.pct}%)</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${item.pct}%`, backgroundColor: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'][i] || '#6366f1' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Топ-5 сегментів</h2>
          <div className="space-y-3">
            {topSegments.map((segment) => (
              <div key={segment.segment_name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: segmentColors[segment.segment_name] || '#6b7280' }} />
                <span className="text-sm text-gray-700 flex-1">{getSegmentLabel(segment.segment_name)}</span>
                <span className="text-sm font-semibold text-gray-900">{segment.client_count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
