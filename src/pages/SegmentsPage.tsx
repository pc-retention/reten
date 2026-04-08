import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Plus, Save, Settings2, Target, Users, Wand2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { DEFAULT_BADGE_ALPHA, DEFAULT_BADGE_HEX, getBadgeTextColor, hexToAlphaHex, parseAlphaHex } from '../lib/colors';
import { getSegmentLabel } from '../lib/segments';
import {
  fetchRfmConfigListRpc,
  fetchRfmSegmentsListRpc,
  refreshClientsDenormalizedRpc,
  seedDefaultRfmReferenceRpc,
  upsertRfmConfigRpc,
  upsertRfmSegmentRpc,
} from '../lib/serverQueries';
import { supabase } from '../lib/supabase';
import type { RfmConfig, RfmSegment } from '../types';

type ClientRow = {
  client_id: number;
  full_name: string;
  rfm_segment: string | null;
  rfm_recency: number | null;
  rfm_frequency: number | null;
  rfm_monetary: number | null;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
};

type SegmentDraft = {
  segmentName: string;
  rScores: string;
  fScores: string;
  mScores: string;
  colorHex: string;
  colorOpacity: number;
  priority: number;
  recommendedAction: string;
  communicationFrequencyDays: number;
};

type ConfigDraft = {
  minValue: string;
  maxValue: string;
};

const NEW_SEGMENT_KEY = '__new_segment__';

function parseScores(value: string) {
  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item >= 1 && item <= 5);
}

function toScoresString(values: number[]) {
  return [...values].sort((a, b) => a - b).join(', ');
}

function metricLabel(metric: string) {
  return {
    recency: 'Давність (R)',
    frequency: 'Частота (F)',
    monetary: 'Грошовий (M)',
  }[metric] || metric;
}

export default function SegmentsPage() {
  const [tab, setTab] = useState<'overview' | 'matrix' | 'config'>('overview');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [rfmSegments, setRfmSegments] = useState<RfmSegment[]>([]);
  const [rfmConfig, setRfmConfig] = useState<RfmConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [segmentDraft, setSegmentDraft] = useState<SegmentDraft | null>(null);
  const [savingSegment, setSavingSegment] = useState(false);
  const [savingConfigKey, setSavingConfigKey] = useState<string | null>(null);
  const [configDrafts, setConfigDrafts] = useState<Record<string, ConfigDraft>>({});
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    const [clientsRes, segmentsRes, configRes] = await Promise.all([
      supabase
        .from('clients')
        .select('client_id, full_name, rfm_segment, rfm_recency, rfm_frequency, rfm_monetary, total_orders, total_spent, last_order_date'),
      fetchRfmSegmentsListRpc(),
      fetchRfmConfigListRpc(),
    ]);

    setClients((clientsRes.data ?? []) as ClientRow[]);
    setRfmSegments((segmentsRes.data ?? []) as RfmSegment[]);
    setRfmConfig((configRes.data ?? []) as RfmConfig[]);
    setConfigDrafts(
      Object.fromEntries(
        ((configRes.data ?? []) as RfmConfig[]).map((item) => [
          `${item.metric}-${item.score}`,
          {
            minValue: item.min_value?.toString() ?? '',
            maxValue: item.max_value?.toString() ?? '',
          },
        ]),
      ),
    );
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const segmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach((client) => {
      if (client.rfm_segment) {
        counts[client.rfm_segment] = (counts[client.rfm_segment] || 0) + 1;
      }
    });
    return counts;
  }, [clients]);

  const matrix = useMemo(() => {
    const next: Record<string, Record<string, number>> = {};
    for (let r = 5; r >= 1; r -= 1) {
      next[r] = {};
      for (let f = 1; f <= 5; f += 1) {
        next[r][f] = clients.filter((c) => c.rfm_recency === r && c.rfm_frequency === f).length;
      }
    }
    return next;
  }, [clients]);

  const segmentClients = selectedSegment ? clients.filter((c) => c.rfm_segment === selectedSegment) : [];
  const nextSegmentPriority = useMemo(
    () => rfmSegments.reduce((maxPriority, segment) => Math.max(maxPriority, segment.priority), 0) + 1,
    [rfmSegments],
  );

  function startSegmentEdit(segment: RfmSegment) {
    const parsedColor = parseAlphaHex(segment.color);
    setEditingSegment(segment.segment_name);
    setSegmentDraft({
      segmentName: segment.segment_name,
      rScores: toScoresString(segment.r_scores),
      fScores: toScoresString(segment.f_scores),
      mScores: toScoresString(segment.m_scores),
      colorHex: parsedColor.hex,
      colorOpacity: Math.round(parsedColor.opacity * 100),
      priority: segment.priority,
      recommendedAction: segment.recommended_action,
      communicationFrequencyDays: segment.communication_frequency_days,
    });
  }

  function startSegmentCreate() {
    setTab('overview');
    setSelectedSegment(null);
    setEditingSegment(NEW_SEGMENT_KEY);
    setSegmentDraft({
      segmentName: '',
      rScores: '5',
      fScores: '5',
      mScores: '5',
      colorHex: DEFAULT_BADGE_HEX,
      colorOpacity: Math.round(DEFAULT_BADGE_ALPHA * 100),
      priority: nextSegmentPriority,
      recommendedAction: '',
      communicationFrequencyDays: 7,
    });
  }

  function cancelSegmentEdit() {
    setEditingSegment(null);
    setSegmentDraft(null);
  }

  async function saveSegment() {
    if (!segmentDraft) return;
    const segmentName = segmentDraft.segmentName.trim();
    const rScores = parseScores(segmentDraft.rScores);
    const fScores = parseScores(segmentDraft.fScores);
    const mScores = parseScores(segmentDraft.mScores);

    if (!segmentName) {
      toast.error('Вкажи назву сегмента');
      return;
    }

    if (rScores.length === 0 || fScores.length === 0 || mScores.length === 0) {
      toast.error('R, F і M повинні містити значення від 1 до 5');
      return;
    }

    setSavingSegment(true);
    const isCreating = editingSegment === NEW_SEGMENT_KEY;
    const { error } = await upsertRfmSegmentRpc({
      segmentName,
      rScores,
      fScores,
      mScores,
      color: hexToAlphaHex(segmentDraft.colorHex, segmentDraft.colorOpacity / 100),
      priority: segmentDraft.priority,
      recommendedAction: segmentDraft.recommendedAction,
      communicationFrequencyDays: segmentDraft.communicationFrequencyDays,
    });

    if (error) {
      toast.error('Не вдалося оновити сегмент');
    } else {
      const refreshResult = await refreshClientsDenormalizedRpc();
      if (refreshResult.error) {
        toast.error('Сегмент збережено, але не вдалося перерахувати клієнтів');
      } else {
        toast.success(isCreating ? 'Сегмент створено' : 'Сегмент оновлено');
      }
      await load();
      cancelSegmentEdit();
    }
    setSavingSegment(false);
  }

  async function saveConfig(metric: string, score: number) {
    const key = `${metric}-${score}`;
    const draft = configDrafts[key];
    if (!draft) return;

    setSavingConfigKey(key);
    const { error } = await upsertRfmConfigRpc({
      metric,
      score,
      minValue: draft.minValue === '' ? null : Number(draft.minValue),
      maxValue: draft.maxValue === '' ? null : Number(draft.maxValue),
    });

    if (error) {
      toast.error('Не вдалося оновити поріг');
    } else {
      toast.success('Поріг оновлено');
      await load();
    }
    setSavingConfigKey(null);
  }

  async function seedDefaults() {
    setSeeding(true);
    const { error } = await seedDefaultRfmReferenceRpc();
    if (error) {
      toast.error('Не вдалося заповнити сегменти за замовчуванням');
    } else {
      toast.success('Стандартні сегменти і пороги створено');
      await load();
    }
    setSeeding(false);
  }

  function cellColor(count: number): string {
    if (count === 0) return 'bg-gray-50 text-gray-300';
    if (count <= 2) return 'bg-blue-100 text-blue-700';
    if (count <= 5) return 'bg-blue-300 text-white';
    if (count <= 10) return 'bg-indigo-500 text-white';
    return 'bg-indigo-700 text-white';
  }

  function renderSegmentEditorCard() {
    if (!segmentDraft) {
      return null;
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Назва сегмента</label>
          <input
            value={segmentDraft.segmentName}
            onChange={(e) => setSegmentDraft({ ...segmentDraft, segmentName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Наприклад, VIP Reactivation"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500">R</label>
            <input
              value={segmentDraft.rScores}
              onChange={(e) => setSegmentDraft({ ...segmentDraft, rScores: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">F</label>
            <input
              value={segmentDraft.fScores}
              onChange={(e) => setSegmentDraft({ ...segmentDraft, fScores: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">M</label>
            <input
              value={segmentDraft.mScores}
              onChange={(e) => setSegmentDraft({ ...segmentDraft, mScores: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
          <input
            type="color"
            value={segmentDraft.colorHex}
            onChange={(e) => setSegmentDraft({ ...segmentDraft, colorHex: e.target.value })}
            className="h-10 w-14 border border-gray-300 rounded-lg bg-white p-1"
          />
          <div>
            <input
              type="range"
              min="5"
              max="100"
              value={segmentDraft.colorOpacity}
              onChange={(e) => setSegmentDraft({ ...segmentDraft, colorOpacity: Number(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-gray-500">{segmentDraft.colorOpacity}%</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Пріоритет</label>
            <input
              type="number"
              value={segmentDraft.priority}
              onChange={(e) => setSegmentDraft({ ...segmentDraft, priority: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Частота, днів</label>
            <input
              type="number"
              value={segmentDraft.communicationFrequencyDays}
              onChange={(e) => setSegmentDraft({ ...segmentDraft, communicationFrequencyDays: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500">Рекомендована дія</label>
          <textarea
            value={segmentDraft.recommendedAction}
            onChange={(e) => setSegmentDraft({ ...segmentDraft, recommendedAction: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button onClick={cancelSegmentEdit} className="px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-700">
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={() => void saveSegment()}
            disabled={savingSegment}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Зберегти
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
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
            onClick={startSegmentCreate}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
          >
            <Plus className="w-4 h-4" />
            Новий сегмент
          </button>
          {rfmSegments.length === 0 && (
            <button
              onClick={() => void seedDefaults()}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              Заповнити стандартно
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'overview', label: 'Огляд', icon: Target },
          { key: 'matrix', label: 'RFM Матриця', icon: Users },
          { key: 'config', label: 'Конфігурація', icon: Settings2 },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setTab(item.key as 'overview' | 'matrix' | 'config');
              setSelectedSegment(null);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition flex items-center gap-1.5 ${
              tab === item.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      {rfmSegments.length === 0 || rfmConfig.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
          <p className="text-gray-600">У базі зараз порожні `rfm_segments` або `rfm_config`.</p>
          <p className="text-sm text-gray-400 mt-1">Можна заповнити стандартними значеннями і потім відредагувати їх під себе.</p>
        </div>
      ) : null}

      {tab === 'overview' && !selectedSegment && rfmSegments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {editingSegment === NEW_SEGMENT_KEY && segmentDraft && (
            <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-sm">
              {renderSegmentEditorCard()}
            </div>
          )}
          {rfmSegments.map((segment) => {
            const count = segmentCounts[segment.segment_name] || 0;
            const isEditing = editingSegment === segment.segment_name && segmentDraft;
            return (
              <div key={segment.segment_name} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                {isEditing ? (
                  renderSegmentEditorCard()
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <button onClick={() => setSelectedSegment(segment.segment_name)} className="text-left">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: segment.color || DEFAULT_BADGE_HEX }}
                          />
                          <h3 className="font-semibold text-gray-900">{getSegmentLabel(segment.segment_name)}</h3>
                        </div>
                      </button>
                      <button onClick={() => startSegmentEdit(segment)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
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
                        style={{
                          backgroundColor: segment.color || '#F3F4F6',
                          color: getBadgeTextColor(segment.color),
                        }}
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
                    <th key={f} className="w-16 text-center text-xs text-gray-500 font-medium pb-2">
                      F={f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[5, 4, 3, 2, 1].map((r) => (
                  <tr key={r}>
                    <td className="text-right pr-3 text-xs text-gray-500 font-medium">R={r}</td>
                    {[1, 2, 3, 4, 5].map((f) => (
                      <td key={f} className="p-1">
                        <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-sm font-bold ${cellColor(matrix[r][f])}`}>
                          {matrix[r][f]}
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
                  {rfmConfig
                    .filter((item) => item.metric === metric)
                    .map((item) => {
                      const key = `${item.metric}-${item.score}`;
                      const draft = configDrafts[key] || { minValue: '', maxValue: '' };
                      return (
                        <tr key={key}>
                          <td className="py-2">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium text-xs">{item.score}</span>
                          </td>
                          <td className="py-2 text-right">
                            <input
                              type="number"
                              value={draft.minValue}
                              onChange={(e) =>
                                setConfigDrafts((prev) => ({
                                  ...prev,
                                  [key]: { ...draft, minValue: e.target.value },
                                }))
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded-md text-right"
                            />
                          </td>
                          <td className="py-2 text-right">
                            <input
                              type="number"
                              value={draft.maxValue}
                              onChange={(e) =>
                                setConfigDrafts((prev) => ({
                                  ...prev,
                                  [key]: { ...draft, maxValue: e.target.value },
                                }))
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded-md text-right"
                            />
                          </td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => void saveConfig(item.metric, item.score)}
                              disabled={savingConfigKey === key}
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
