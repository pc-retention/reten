import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { DEFAULT_BADGE_ALPHA, DEFAULT_BADGE_HEX, hexToAlphaHex, parseAlphaHex } from '../../lib/colors';
import {
  fetchRfmConfigListRpc,
  fetchRfmSegmentsListRpc,
  refreshClientsDenormalizedRpc,
  seedDefaultRfmReferenceRpc,
  upsertRfmConfigRpc,
  upsertRfmSegmentRpc,
} from '../../lib/serverQueries';
import { supabase } from '../../lib/supabase';
import type { RfmConfig, RfmSegment } from '../../types';

export type ClientRow = {
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

export type SegmentDraft = {
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

export type ConfigDraft = { minValue: string; maxValue: string };

export const NEW_SEGMENT_KEY = '__new_segment__';

export function parseScores(value: string) {
  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item >= 1 && item <= 5);
}

export function toScoresString(values: number[]) {
  return [...values].sort((a, b) => a - b).join(', ');
}

export function useSegments() {
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

  const load = useCallback(async () => {
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
          { minValue: item.min_value?.toString() ?? '', maxValue: item.max_value?.toString() ?? '' },
        ]),
      ),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

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

    if (!segmentName) { toast.error('Вкажи назву сегмента'); return; }
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

  return {
    clients,
    rfmSegments,
    rfmConfig,
    loading,
    seeding,
    editingSegment,
    setEditingSegment,
    segmentDraft,
    setSegmentDraft,
    savingSegment,
    savingConfigKey,
    configDrafts,
    setConfigDrafts,
    segmentCounts,
    matrix,
    startSegmentEdit,
    startSegmentCreate,
    cancelSegmentEdit,
    saveSegment,
    saveConfig,
    seedDefaults,
  };
}
