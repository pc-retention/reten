import { useState, useEffect } from 'react';
import { BarChart3, Users, ShoppingCart, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { MetricsDaily, SyncLog } from '../types';

type ClientStats = {
  is_active: boolean;
  total_spent: number;
  avg_order_value: number;
  total_orders: number;
  rfm_segment: string | null;
};

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

const segmentColors: Record<string, string> = {
  'Champions': '#22c55e', 'Loyal': '#3b82f6', 'Potential Loyal': '#8b5cf6',
  'New Customers': '#06b6d4', 'Promising': '#f59e0b', 'Need Attention': '#f97316',
  'About To Sleep': '#ef4444', 'At Risk': '#dc2626', "Can't Lose Them": '#991b1b',
  'Hibernating': '#6b7280', 'Lost': '#374151',
};

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<MetricsDaily[]>([]);
  const [clients, setClients] = useState<ClientStats[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [metricsRes, clientsRes, syncRes] = await Promise.all([
        supabase.from('metrics_daily').select('*').order('date', { ascending: true }).limit(30),
        supabase.from('clients').select('is_active, total_spent, avg_order_value, total_orders, rfm_segment'),
        supabase.from('sync_log').select('*').order('started_at', { ascending: false }).limit(20),
      ]);
      setMetrics(metricsRes.data ?? []);
      setClients(clientsRes.data ?? []);
      setSyncLogs(syncRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.is_active).length;
  const avgLTV = clients.filter(c => c.total_spent > 0).reduce((s, c) => s + c.total_spent, 0) / Math.max(clients.filter(c => c.total_spent > 0).length, 1);
  const avgAOV = clients.filter(c => c.avg_order_value > 0).reduce((s, c) => s + c.avg_order_value, 0) / Math.max(clients.filter(c => c.avg_order_value > 0).length, 1);
  const retentionRate = (clients.filter(c => c.total_orders >= 2).length / Math.max(totalClients, 1) * 100);
  const churnRate = (clients.filter(c => !c.is_active).length / Math.max(totalClients, 1) * 100);

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

  const total1 = clients.filter(c => c.total_orders >= 1).length;
  const total2 = clients.filter(c => c.total_orders >= 2).length;
  const total3 = clients.filter(c => c.total_orders >= 3).length;
  const total4 = clients.filter(c => c.total_orders >= 4).length;
  const funnelData = [
    { name: '1-ша покупка', value: total1, pct: 100 },
    { name: '2-га покупка', value: total2, pct: total1 ? Math.round(total2 / total1 * 100) : 0 },
    { name: '3-тя покупка', value: total3, pct: total1 ? Math.round(total3 / total1 * 100) : 0 },
    { name: '4-та покупка', value: total4, pct: total1 ? Math.round(total4 / total1 * 100) : 0 },
  ];

  const segmentCounts: Record<string, number> = {};
  clients.forEach(c => {
    if (c.rfm_segment) segmentCounts[c.rfm_segment] = (segmentCounts[c.rfm_segment] || 0) + 1;
  });
  const topSegments = Object.entries(segmentCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (loading) return <div className="text-center py-20 text-gray-400">Завантаження...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Головна</h1>
        <p className="text-sm text-gray-500">{format(new Date(), 'd MMMM yyyy', { locale: uk })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard icon={DollarSign} title="Сер. LTV" value={`${Math.round(avgLTV).toLocaleString()} грн`} trend="up" trendValue={`${revTrend}%`} />
        <StatCard icon={ShoppingCart} title="Сер. чек" value={`${Math.round(avgAOV)} грн`} trend="up" trendValue="5.2%" />
        <StatCard icon={TrendingUp} title="Утримання" value={`${retentionRate.toFixed(1)}%`} subtitle="повторні покупки" trend="up" trendValue="2.1%" />
        <StatCard icon={Activity} title="Відтік" value={`${churnRate.toFixed(1)}%`} trend="down" trendValue="1.5%" />
        <StatCard icon={Users} title="Активних клієнтів" value={activeClients.toString()} subtitle={`з ${totalClients}`} />
        <StatCard icon={BarChart3} title="Замовлень (7д)" value={last7.reduce((s, m) => s + m.total_orders, 0).toString()} trend="up" trendValue="8%" />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Воронка повторних покупок</h2>
          <div className="space-y-3">
            {funnelData.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.name}</span>
                  <span className="font-medium text-gray-900">{item.value} ({item.pct}%)</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${item.pct}%`, backgroundColor: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'][i] }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Топ-5 сегментів</h2>
          <div className="space-y-3">
            {topSegments.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: segmentColors[name] || '#6b7280' }} />
                <span className="text-sm text-gray-700 flex-1">{name}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Синхронізація</h2>
          <div className="space-y-4">
            {[{ key: 'webhook', label: 'Вебхук' }, { key: 'hourly', label: 'Щогодинна' }, { key: 'manual', label: 'Ручна' }].map(({ key: type, label }) => {
              const log = syncLogs.find(s => s.sync_type === type);
              return (
                <div key={type} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">
                      {log ? format(parseISO(log.started_at), 'dd.MM HH:mm') : 'Немає даних'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    log?.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {log?.status === 'success' ? 'Успішно' : 'Помилка'}
                  </span>
                </div>
              );
            })}
          </div>
          <button className="mt-4 w-full py-2 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
            Ручна синхронізація
          </button>
        </div>
      </div>
    </div>
  );
}
