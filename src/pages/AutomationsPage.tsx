import { useState, useEffect } from 'react';
import { RefreshCw, MessageSquare, ShoppingCart, ArrowLeftRight, Gift, Clock, CheckCircle, XCircle, SkipForward } from 'lucide-react';
import { fetchAutomationQueueRpc, fetchCommunicationLogAllRpc, fetchCommunicationTemplatesListRpc, fetchWinBackCandidatesRpc, type AutomationQueueRpcRow } from '../lib/serverQueries';
import { format, parseISO } from 'date-fns';
import type { CommunicationLog, CommunicationTemplate, WinBackCandidate } from '../types';

type QueueRow = AutomationQueueRpcRow;

const tabs = [
  { key: 'replenishment', label: 'Поповнення', icon: RefreshCw },
  { key: 'welcome', label: 'Вітальна серія', icon: MessageSquare },
  { key: 'abandoned_cart', label: 'Покинутий кошик', icon: ShoppingCart },
  { key: 'win_back', label: 'Повернення', icon: ArrowLeftRight },
  { key: 'post_purchase', label: 'Після покупки', icon: Gift },
];

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock, sent: CheckCircle, cancelled: XCircle, skipped: SkipForward,
};
const statusColors: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50', sent: 'text-green-600 bg-green-50',
  cancelled: 'text-gray-500 bg-gray-50', skipped: 'text-orange-500 bg-orange-50',
};

export default function AutomationsPage() {
  const [activeTab, setActiveTab] = useState('replenishment');
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [commsAll, setCommsAll] = useState<CommunicationLog[]>([]);
  const [templatesAll, setTemplatesAll] = useState<CommunicationTemplate[]>([]);
  const [winBack, setWinBack] = useState<WinBackCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [queueRes, commsRes, templatesRes, winBackRes] = await Promise.all([
        fetchAutomationQueueRpc(),
        fetchCommunicationLogAllRpc(),
        fetchCommunicationTemplatesListRpc(),
        fetchWinBackCandidatesRpc(),
      ]);
      setQueue(queueRes.data);
      setCommsAll(commsRes.data);
      setTemplatesAll(templatesRes.data);
      setWinBack(winBackRes.data);
      setLoading(false);
    }
    load();
  }, []);

  const queueItems = queue.filter(a => a.automation_type === activeTab);
  const comms = commsAll.filter(c => c.communication_type === activeTab);
  const templates = templatesAll.filter(t => t.communication_type === activeTab);

  const sentCount = comms.length;
  const openedCount = comms.filter(c => c.opened_at).length;
  const clickedCount = comms.filter(c => c.clicked_at).length;
  const openRate = sentCount > 0 ? (openedCount / sentCount * 100).toFixed(1) : '0';
  const clickRate = sentCount > 0 ? (clickedCount / sentCount * 100).toFixed(1) : '0';
  const pendingCount = queueItems.filter(q => q.status === 'pending').length;
  const skippedQCount = queueItems.filter(q => q.status === 'skipped').length;

  const warmCount = winBack.filter(w => w.tier === 'warm').length;
  const coldCount = winBack.filter(w => w.tier === 'cold').length;
  const lostCount = winBack.filter(w => w.tier === 'lost').length;

  const todaySent = commsAll.filter(c => c.sent_at?.startsWith(new Date().toISOString().slice(0, 7))).length;

  if (loading) return <div className="text-center py-20 text-gray-400">Завантаження...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Автоматизації</h1>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>Відправлено цього місяця: <strong className="text-gray-900">{todaySent}</strong></span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto bg-gray-100 p-1 rounded-lg">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition ${
              activeTab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Відправлено</p>
          <p className="text-2xl font-bold text-gray-900">{sentCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Відкриття</p>
          <p className="text-2xl font-bold text-gray-900">{openRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Кліки</p>
          <p className="text-2xl font-bold text-gray-900">{clickRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">В черзі</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Пропущено</p>
          <p className="text-2xl font-bold text-orange-500">{skippedQCount}</p>
        </div>
      </div>

      {activeTab === 'win_back' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <p className="text-sm font-medium text-gray-700">Теплі (30-60 днів)</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{warmCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <p className="text-sm font-medium text-gray-700">Холодні (60-120 днів)</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{coldCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <p className="text-sm font-medium text-gray-700">Втрачені (120+ днів)</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{lostCount}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Черга ({queueItems.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {queueItems.length === 0 && <p className="text-sm text-gray-400">Черга порожня</p>}
            {queueItems.map(q => {
              const StatusIcon = statusIcons[q.status] || Clock;
              return (
                <div key={q.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{q.client_name || `#${q.client_id}`}</p>
                    <p className="text-xs text-gray-500">{format(parseISO(q.scheduled_at), 'dd.MM.yyyy HH:mm')}</p>
                    {q.skip_reason && <p className="text-xs text-orange-500">{q.skip_reason}</p>}
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[q.status]}`}>
                    <StatusIcon className="w-3.5 h-3.5" />{{ pending: 'Очікує', sent: 'Надіслано', cancelled: 'Скасовано', skipped: 'Пропущено' }[q.status] || q.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Шаблони ({templates.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {templates.length === 0 && <p className="text-sm text-gray-400">Немає шаблонів для цього типу</p>}
            {templates.map(t => (
              <div key={t.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-gray-500">{t.id}</span>
                  <div className="flex items-center gap-2">
                    {t.ab_variant && (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">{t.ab_variant}</span>
                    )}
                    <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">{t.channel}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{t.body_template}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
