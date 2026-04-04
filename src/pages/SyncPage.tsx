import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import type { SyncLog } from '../types';

const statusIcon: Record<string, React.ElementType> = {
  success: CheckCircle, error: AlertCircle,
};
const statusColor: Record<string, string> = {
  success: 'text-green-600 bg-green-50', error: 'text-red-600 bg-red-50',
};
const channelLabels: Record<string, string> = { webhook: 'Вебхук', hourly: 'Щогодинна', manual: 'Ручна' };

export default function SyncPage() {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sync_log')
        .select('*')
        .order('started_at', { ascending: false });
      setSyncLogs(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const channelStats = ['webhook', 'hourly', 'manual'].map(ch => {
    const logs = syncLogs.filter(s => s.sync_type === ch);
    const last = logs[0];
    const totalOrders = logs.reduce((s, l) => s + l.orders_new, 0);
    return { channel: ch, last, totalOrders };
  });

  if (loading) return <div className="text-center py-20 text-gray-400">Завантаження...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Синхронізація</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
          <Play className="w-4 h-4" /> Ручна синхронізація
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {channelStats.map(({ channel, last, totalOrders }) => (
          <div key={channel} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{channelLabels[channel]}</h3>
              {last && (
                <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColor[last.status]}`}>
                  {last.status === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {last.status === 'success' ? 'Успішно' : 'Помилка'}
                </span>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Остання синхр.</span>
                <span className="text-gray-900 font-medium">{last ? format(parseISO(last.started_at), 'dd.MM HH:mm') : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Нових замовлень</span>
                <span className="text-gray-900 font-medium">{last?.orders_new || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Всього оброблено</span>
                <span className="text-gray-900 font-medium">{totalOrders}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <h3 className="px-6 py-4 text-lg font-semibold text-gray-900 border-b border-gray-100">Лог синхронізації</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Тип</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Статус</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Отримано</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Нових</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Пропущено</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Початок</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Кінець</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {syncLogs.map(log => {
              const Icon = statusIcon[log.status] || Clock;
              return (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{channelLabels[log.sync_type] || log.sync_type}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[log.status] || 'bg-gray-50 text-gray-600'}`}>
                      <Icon className="w-3.5 h-3.5" />{log.status === 'success' ? 'Успішно' : 'Помилка'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{log.orders_fetched}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{log.orders_new}</td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{log.orders_skipped}</td>
                  <td className="px-4 py-3 text-gray-500">{format(parseISO(log.started_at), 'dd.MM HH:mm:ss')}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {log.finished_at ? format(parseISO(log.finished_at), 'dd.MM HH:mm:ss') : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
