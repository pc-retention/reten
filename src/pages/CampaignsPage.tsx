import { useState } from 'react';
import { Send, Calendar, Plus, BarChart3, Eye, MousePointer } from 'lucide-react';
import { campaigns, communicationLogs } from '../lib/testData';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { uk } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function CampaignsPage() {
  const [tab, setTab] = useState<'calendar' | 'list' | 'ab'>('list');
  const [currentMonth] = useState(new Date(2026, 3, 1)); // Квітень 2026

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0 = Sun
  const emptyDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Monday start

  // A/B тест дані
  const abComms = communicationLogs.filter(c => c.ab_variant);
  const variantA = abComms.filter(c => c.ab_variant === 'A');
  const variantB = abComms.filter(c => c.ab_variant === 'B');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Кампанії</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
          <Plus className="w-4 h-4" /> Нова кампанія
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'list', label: 'Кампанії', icon: Send },
          { key: 'calendar', label: 'Календар', icon: Calendar },
          { key: 'ab', label: 'A/B Тести', icon: BarChart3 },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition ${
              tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Кампанія</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Сегмент</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Канал</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Статус</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Відправлено</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Відкрито</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Кліки</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Конверсія</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.scheduled_at ? format(parseISO(c.scheduled_at), 'dd.MM.yyyy HH:mm') : '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.target_segment || 'всі'}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.channel || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.status]}`}>{{ draft: 'Чернетка', scheduled: 'Заплановано', sending: 'Надсилається', sent: 'Надіслано', cancelled: 'Скасовано' }[c.status] || c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{c.sent_count}</td>
                  <td className="px-4 py-3 text-right text-gray-600 hidden lg:table-cell">
                    {c.sent_count > 0 ? `${c.opened_count} (${Math.round(c.opened_count / c.sent_count * 100)}%)` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 hidden lg:table-cell">
                    {c.sent_count > 0 ? `${c.clicked_count} (${Math.round(c.clicked_count / c.sent_count * 100)}%)` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 hidden lg:table-cell">
                    {c.sent_count > 0 ? `${c.conversion_count} (${Math.round(c.conversion_count / c.sent_count * 100)}%)` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'calendar' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {format(currentMonth, 'MMMM yyyy', { locale: uk })}
          </h2>
          <div className="grid grid-cols-7 gap-1">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => (
              <div key={d} className="text-center text-xs text-gray-500 font-medium py-2">{d}</div>
            ))}
            {Array.from({ length: emptyDays }).map((_, i) => <div key={`e-${i}`} />)}
            {days.map(day => {
              const dayCampaigns = campaigns.filter(c => c.scheduled_at && isSameDay(parseISO(c.scheduled_at), day));
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toString()} className={`min-h-[80px] p-1.5 border rounded-lg ${isToday ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100'}`}>
                  <span className={`text-xs font-medium ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {format(day, 'd')}
                  </span>
                  {dayCampaigns.map(c => (
                    <div key={c.id} className={`mt-1 px-1.5 py-0.5 rounded text-xs truncate ${statusColors[c.status]}`}>
                      {c.name}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'ab' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">A/B Тестування шаблонів</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Variant A */}
            <div className="border-2 border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold text-sm">A</span>
                <span className="text-sm text-gray-500">{variantA.length} повідомлень</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Відкриття</span>
                  <span className="ml-auto font-bold text-gray-900">
                    {variantA.length > 0 ? Math.round(variantA.filter(c => c.opened_at).length / variantA.length * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MousePointer className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Кліки</span>
                  <span className="ml-auto font-bold text-gray-900">
                    {variantA.length > 0 ? Math.round(variantA.filter(c => c.clicked_at).length / variantA.length * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Variant B */}
            <div className="border-2 border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold text-sm">B</span>
                <span className="text-sm text-gray-500">{variantB.length} повідомлень</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Відкриття</span>
                  <span className="ml-auto font-bold text-green-600">
                    {variantB.length > 0 ? Math.round(variantB.filter(c => c.opened_at).length / variantB.length * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MousePointer className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Кліки</span>
                  <span className="ml-auto font-bold text-green-600">
                    {variantB.length > 0 ? Math.round(variantB.filter(c => c.clicked_at).length / variantB.length * 100) : 0}%
                  </span>
                </div>
              </div>
              {variantB.filter(c => c.opened_at).length > variantA.filter(c => c.opened_at).length && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-sm text-green-700 font-medium">Варіант B перемагає</p>
                </div>
              )}
            </div>
          </div>
          <button className="mt-6 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
            Зробити переможця основним
          </button>
        </div>
      )}
    </div>
  );
}
