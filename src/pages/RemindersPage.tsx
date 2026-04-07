import { useState, useEffect } from 'react';
import { Bell, Clock, CheckCircle, Send, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import type { ClientPurchase } from '../types';
import { getDefaultReminderDateRange, getReminderStatus, getTodayDateKey } from '../lib/reminders';
import { deleteClientPurchaseRpc, fetchFilteredRemindersRpc } from '../lib/serverQueries';

type ReminderRow = ClientPurchase & {
  clients: { full_name: string; phone: string | null } | null;
};

export default function RemindersPage() {
  const [tab, setTab] = useState<'today' | 'overdue' | 'sent' | 'all'>('today');
  const defaultDateRange = getDefaultReminderDateRange();
  const [dateFrom, setDateFrom] = useState(defaultDateRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultDateRange.dateTo);
  const [allReminders, setAllReminders] = useState<ReminderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const rpcResult = await fetchFilteredRemindersRpc(dateFrom, dateTo);
      if (rpcResult.error) {
        setAllReminders([]);
        setLoading(false);
        return;
      }

      setAllReminders(rpcResult.data.map(reminder => ({
        ...reminder,
        clients: {
          full_name: reminder.client_name,
          phone: reminder.client_phone,
        },
      })) as ReminderRow[]);
      setLoading(false);
    }
    load();
  }, [dateFrom, dateTo]);

  async function deleteReminder(id: string) {
    if (!confirm('Видалити це нагадування?')) return;
    const { error } = await deleteClientPurchaseRpc(id);
    if (error) {
      toast.error('Помилка видалення');
    } else {
      toast.success('Нагадування видалено');
      setAllReminders(prev => prev.filter(r => r.id !== id));
    }
  }

  const todayDateKey = getTodayDateKey();

  const todayReminders = allReminders.filter(r => getReminderStatus(r, todayDateKey) === 'today');
  const overdueReminders = allReminders.filter(r => getReminderStatus(r, todayDateKey) === 'overdue');
  const sentReminders = allReminders.filter(r => getReminderStatus(r, todayDateKey) === 'sent');

  const displayReminders = tab === 'today' ? todayReminders
    : tab === 'overdue' ? overdueReminders
    : tab === 'sent' ? sentReminders
    : allReminders;

  const tabCounts = {
    today: todayReminders.length,
    overdue: overdueReminders.length,
    sent: sentReminders.length,
    all: allReminders.length,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Нагадування</h1>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'today', label: 'Сьогодні', icon: Bell, color: 'text-blue-600' },
          { key: 'overdue', label: 'Прострочені', icon: AlertTriangle, color: 'text-red-600' },
          { key: 'sent', label: 'Відправлені', icon: CheckCircle, color: 'text-green-600' },
          { key: 'all', label: 'Всі', icon: Clock, color: 'text-gray-600' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition ${
              tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}>
            <t.icon className={`w-4 h-4 ${tab === t.key ? t.color : ''}`} />
            {t.label}
            {tabCounts[t.key as keyof typeof tabCounts] > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                t.key === 'overdue' && tabCounts.overdue > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'
              }`}>
                {tabCounts[t.key as keyof typeof tabCounts]}
              </span>
            )}
          </button>
        ))}
        </div>

        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 w-[130px]" title="Від (Дата нагадування)" />
          <span className="text-gray-400">-</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 w-[130px]" title="До (Дата нагадування)" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Завантаження...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Клієнт</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Товар</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Куплено</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Закінчується</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Нагадування</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Статус</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayReminders.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Немає нагадувань</td></tr>
              )}
              {displayReminders.map(r => {
                const isOverdue = getReminderStatus(r, todayDateKey) === 'overdue';
                return (
                  <tr key={r.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.clients?.full_name || '-'}</p>
                      <p className="text-xs text-gray-500">{r.clients?.phone || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{r.product_name}</p>
                      <p className="text-xs text-gray-400">x{r.quantity} • {r.total_usage_days} днів</p>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 hidden md:table-cell">{format(parseISO(r.purchase_date), 'dd.MM.yy')}</td>
                    <td className="px-4 py-3 text-center text-gray-500 hidden md:table-cell">{format(parseISO(r.expected_end_date), 'dd.MM.yy')}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                        {format(parseISO(r.reminder_date), 'dd.MM.yy')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.reminder_sent ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Надіслано</span>
                      ) : isOverdue ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Прострочено</span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Очікує</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isOverdue && (
                          <button onClick={() => deleteReminder(r.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition" title="Видалити">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {!r.reminder_sent && (
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700">
                            <Send className="w-3.5 h-3.5" /> Надіслати
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
