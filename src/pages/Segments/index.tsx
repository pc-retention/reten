import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Plus, Save, Settings2, Target, Users, Wand2 } from 'lucide-react';
import { getBadgeTextColor } from '../../lib/colors';
import { getSegmentLabel } from '../../lib/segments';
import { DEFAULT_BADGE_HEX } from '../../lib/colors';
import { useSegments, NEW_SEGMENT_KEY } from './useSegments';
import { SegmentEditorCard } from './SegmentEditorCard';

type SegmentsTab = 'overview' | 'matrix' | 'config';

const TABS = [
  { key: 'overview' as const, label: 'Огляд', icon: Target },
  { key: 'matrix' as const, label: 'RFM Матриця', icon: Users },
  { key: 'config' as const, label: 'Конфігурація', icon: Settings2 },
];

function cellColor(count: number): string {
  if (count === 0) return 'bg-gray-50 text-gray-300';
  if (count <= 2) return 'bg-blue-100 text-blue-700';
  if (count <= 5) return 'bg-blue-300 text-white';
  if (count <= 10) return 'bg-indigo-500 text-white';
  return 'bg-indigo-700 text-white';
}

function metricLabel(metric: string) {
  return { recency: 'Давність (R)', frequency: 'Частота (F)', monetary: 'Грошовий (M)' }[metric] || metric;
}

export default function SegmentsPage() {
  const [tab, setTab] = useState<SegmentsTab>('overview');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const navigate = useNavigate();
  const segments = useSegments();

  const segmentClients = selectedSegment
    ? segments.clients.filter((c) => c.rfm_segment === selectedSegment)
    : [];

  function handleTabChange(key: SegmentsTab) {
    setTab(key);
    setSelectedSegment(null);
  }

  function handleStartCreate() {
    setTab('overview');
    setSelectedSegment(null);
    segments.startSegmentCreate();
  }

  if (segments.loading) {
    return <div className="text-center py-20 text-gray-400">Завантаження...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RFM Сегменти</h1>
          <p className="text-sm text-gray-500 mt-1">Керуйте сегментами, порогами скорингу та кольорами.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
          >
            <Plus className="w-4 h-4" />
            Новий сегмент
          </button>
          {segments.rfmSegments.length === 0 && (
            <button
              onClick={() => void segments.seedDefaults()}
              disabled={segments.seeding}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              Заповнити стандартно
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => handleTabChange(item.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition flex items-center gap-1.5 ${
              tab === item.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      {(segments.rfmSegments.length === 0 || segments.rfmConfig.length === 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
          <p className="text-gray-600">У базі зараз порожні `rfm_segments` або `rfm_config`.</p>
          <p className="text-sm text-gray-400 mt-1">Можна заповнити стандартними значеннями і потім відредагувати їх під себе.</p>
        </div>
      )}

      {tab === 'overview' && !selectedSegment && segments.rfmSegments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {segments.editingSegment === NEW_SEGMENT_KEY && segments.segmentDraft && (
            <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-sm">
              <SegmentEditorCard
                segmentDraft={segments.segmentDraft}
                setSegmentDraft={segments.setSegmentDraft}
                savingSegment={segments.savingSegment}
                cancelSegmentEdit={segments.cancelSegmentEdit}
                saveSegment={segments.saveSegment}
              />
            </div>
          )}
          {segments.rfmSegments.map((segment) => {
            const count = segments.segmentCounts[segment.segment_name] || 0;
            const isEditing = segments.editingSegment === segment.segment_name && segments.segmentDraft;
            return (
              <div key={segment.segment_name} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                {isEditing ? (
                  <SegmentEditorCard
                    segmentDraft={segments.segmentDraft!}
                    setSegmentDraft={segments.setSegmentDraft}
                    savingSegment={segments.savingSegment}
                    cancelSegmentEdit={segments.cancelSegmentEdit}
                    saveSegment={segments.saveSegment}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <button onClick={() => setSelectedSegment(segment.segment_name)} className="text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: segment.color || DEFAULT_BADGE_HEX }} />
                          <h3 className="font-semibold text-gray-900">{getSegmentLabel(segment.segment_name)}</h3>
                        </div>
                      </button>
                      <button onClick={() => segments.startSegmentEdit(segment)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-end justify-between mb-3">
                      <p className="text-3xl font-bold text-gray-900">{count}</p>
                      <p className="text-sm text-gray-500 text-right">
                        R:{segment.r_scores.join(', ')}<br />
                        F:{segment.f_scores.join(', ')}<br />
                        M:{segment.m_scores.join(', ')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: segment.color || '#F3F4F6', color: getBadgeTextColor(segment.color) }}
                      >
                        Пріоритет {segment.priority}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        Кожні {segment.communication_frequency_days} дн.
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{segment.recommended_action}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'overview' && selectedSegment && (
        <div className="space-y-4">
          <button onClick={() => setSelectedSegment(null)} className="text-sm text-indigo-600 hover:text-indigo-800">
            ← Назад до сегментів
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {getSegmentLabel(selectedSegment)} ({segmentClients.length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Клієнт</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">RFM</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Замовлень</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Витрачено</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Остання</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {segmentClients.map((client) => (
                  <tr key={client.client_id} onClick={() => navigate(`/clients/${client.client_id}`)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 font-medium text-gray-900">{client.full_name}</td>
                    <td className="px-4 py-3 text-center font-mono text-gray-600">
                      {client.rfm_recency}-{client.rfm_frequency}-{client.rfm_monetary}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">{client.total_orders}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{client.total_spent.toLocaleString()} грн</td>
                    <td className="px-4 py-3 text-right text-gray-500">{client.last_order_date || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'matrix' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">RFM Теплова карта (R × F)</h2>
          <div className="overflow-x-auto">
            <table className="mx-auto">
              <thead>
                <tr>
                  <th className="w-20 text-xs text-gray-500 font-medium text-right pr-2">R \ F</th>
                  {[1, 2, 3, 4, 5].map((f) => (
                    <th key={f} className="w-16 text-center text-xs text-gray-500 font-medium pb-2">F={f}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[5, 4, 3, 2, 1].map((r) => (
                  <tr key={r}>
                    <td className="text-right pr-3 text-xs text-gray-500 font-medium">R={r}</td>
                    {[1, 2, 3, 4, 5].map((f) => (
                      <td key={f} className="p-1">
                        <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-sm font-bold ${cellColor(segments.matrix[r][f])}`}>
                          {segments.matrix[r][f]}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {['recency', 'frequency', 'monetary'].map((metric) => (
            <div key={metric} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{metricLabel(metric)}</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left pb-2 text-gray-500">Скор</th>
                    <th className="text-right pb-2 text-gray-500">Від</th>
                    <th className="text-right pb-2 text-gray-500">До</th>
                    <th className="text-right pb-2 text-gray-500">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {segments.rfmConfig
                    .filter((item) => item.metric === metric)
                    .map((item) => {
                      const key = `${item.metric}-${item.score}`;
                      const draft = segments.configDrafts[key] || { minValue: '', maxValue: '' };
                      return (
                        <tr key={key}>
                          <td className="py-2">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium text-xs">{item.score}</span>
                          </td>
                          <td className="py-2 text-right">
                            <input
                              type="number"
                              value={draft.minValue}
                              onChange={(e) => segments.setConfigDrafts((prev) => ({ ...prev, [key]: { ...draft, minValue: e.target.value } }))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded-md text-right"
                            />
                          </td>
                          <td className="py-2 text-right">
                            <input
                              type="number"
                              value={draft.maxValue}
                              onChange={(e) => segments.setConfigDrafts((prev) => ({ ...prev, [key]: { ...draft, maxValue: e.target.value } }))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded-md text-right"
                            />
                          </td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => void segments.saveConfig(item.metric, item.score)}
                              disabled={segments.savingConfigKey === key}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-indigo-600 text-white rounded-md disabled:opacity-50"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Зберегти
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
