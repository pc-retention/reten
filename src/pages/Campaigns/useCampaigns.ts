import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '../../lib/supabase';
import type { Campaign, CommunicationTemplate } from '../../types';
import {
  createCampaignRpc,
  deleteCampaignRpc,
  fetchAbVariantSummaryRpc,
  fetchCampaignsCalendarRpc,
  fetchCampaignsPageRpc,
  updateCampaignRpc,
  type AbVariantSummaryRow,
} from '../../lib/serverQueries';
import { CAMPAIGNS_PAGE_SIZE } from './constants';

export type CampaignFormState = {
  name: string;
  type: string;
  targetSegment: string;
  targetClientsCount: string;
  channel: string;
  templateId: string;
  scheduledAt: string;
  status: string;
};

export const emptyCampaignForm: CampaignFormState = {
  name: '',
  type: 'manual',
  targetSegment: 'all',
  targetClientsCount: '0',
  channel: '',
  templateId: '',
  scheduledAt: '',
  status: 'draft',
};

export function toDatetimeLocalValue(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toIsoDatetime(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function getTemplateLabel(template: CommunicationTemplate) {
  const parts = [template.communication_type, template.channel];
  if (template.ab_variant) parts.push(`A/B ${template.ab_variant}`);
  if (!template.is_active) parts.push('вимкнено');
  return parts.join(' / ');
}

export function useCampaigns() {
  const [currentMonth] = useState(() => startOfMonth(new Date()));
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsTotal, setCampaignsTotal] = useState(0);
  const [calendarCampaigns, setCalendarCampaigns] = useState<Campaign[]>([]);
  const [abSummary, setAbSummary] = useState<AbVariantSummaryRow[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [campaignsPage, setCampaignsPage] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [formState, setFormState] = useState<CampaignFormState>(emptyCampaignForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCampaignsList = useCallback(async () => {
    const campaignsRes = await fetchCampaignsPageRpc(campaignsPage, CAMPAIGNS_PAGE_SIZE);
    if (campaignsRes.error) {
      setErrorMsg(campaignsRes.error.message);
      return;
    }
    setCampaigns(campaignsRes.data.map(({ total_count: _, ...campaign }) => campaign));
    setCampaignsTotal(campaignsRes.data[0]?.total_count ?? 0);
    setErrorMsg(null);
  }, [campaignsPage]);

  const loadCalendarCampaigns = useCallback(async () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const result = await fetchCampaignsCalendarRpc(monthStart.toISOString(), monthEnd.toISOString());
    if (result.error) {
      toast.error('Не вдалося завантажити календар кампаній');
      return;
    }
    setCalendarCampaigns(result.data);
  }, [currentMonth]);

  const loadAbSummary = useCallback(async () => {
    const result = await fetchAbVariantSummaryRpc();
    if (result.error) {
      toast.error('Не вдалося завантажити A/B статистику');
      return;
    }
    setAbSummary(result.data);
  }, []);

  const loadTemplates = useCallback(async () => {
    const { data, error } = await supabase
      .from('communication_templates')
      .select('*')
      .order('communication_type')
      .order('channel');
    if (error) {
      toast.error('Не вдалося завантажити шаблони комунікацій');
      return;
    }
    setTemplates(data ?? []);
  }, []);

  useEffect(() => {
    async function load() {
      if (!initialized) setLoading(true);
      await Promise.all([loadCampaignsList(), loadCalendarCampaigns(), loadAbSummary(), loadTemplates()]);
      setInitialized(true);
      setLoading(false);
    }
    if (!initialized) void load();
  }, [initialized, loadCampaignsList, loadCalendarCampaigns, loadAbSummary, loadTemplates]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialized) void loadCampaignsList();
  }, [initialized, loadCampaignsList]);

  const refreshAfterMutation = useCallback(async (options?: { resetToFirstPage?: boolean; goToPreviousPage?: boolean }) => {
    const resetToFirstPage = options?.resetToFirstPage ?? false;
    const goToPreviousPage = options?.goToPreviousPage ?? false;

    if (resetToFirstPage && campaignsPage !== 0) {
      setCampaignsPage(0);
    } else if (goToPreviousPage && campaignsPage > 0) {
      setCampaignsPage((prev) => prev - 1);
    } else {
      await loadCampaignsList();
    }
    await loadCalendarCampaigns();
  }, [campaignsPage, loadCampaignsList, loadCalendarCampaigns]);

  function openCreateModal() {
    setModalMode('create');
    setSelectedCampaign(null);
    setFormState(emptyCampaignForm);
    setModalOpen(true);
  }

  function openEditModal(campaign: Campaign) {
    setModalMode('edit');
    setSelectedCampaign(campaign);
    setFormState({
      name: campaign.name,
      type: campaign.type || 'manual',
      targetSegment: campaign.target_segment || 'all',
      targetClientsCount: String(campaign.target_clients_count ?? 0),
      channel: campaign.channel || '',
      templateId: campaign.template_id || '',
      scheduledAt: toDatetimeLocalValue(campaign.scheduled_at),
      status: campaign.status || 'draft',
    });
    setModalOpen(true);
  }

  function closeModal(force = false) {
    if (saving && !force) return;
    setModalOpen(false);
    setSelectedCampaign(null);
    setFormState(emptyCampaignForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>, tab: string, setTab: (t: 'calendar' | 'list' | 'ab') => void) {
    event.preventDefault();
    const name = formState.name.trim();
    if (!name) {
      toast.error('Вкажіть назву кампанії');
      return;
    }

    const payload = {
      name,
      type: formState.type,
      targetSegment: formState.targetSegment.trim() || null,
      targetClientsCount: Math.max(0, Number.parseInt(formState.targetClientsCount, 10) || 0),
      channel: formState.channel || null,
      templateId: formState.templateId || null,
      scheduledAt: toIsoDatetime(formState.scheduledAt),
      status: formState.status,
    };

    setSaving(true);

    if (modalMode === 'create') {
      const { error } = await createCampaignRpc(payload);
      if (error) {
        toast.error(`Не вдалося створити кампанію: ${error.message}`);
        setSaving(false);
        return;
      }
      toast.success('Кампанію створено');
      setTab('list');
      closeModal(true);
      setSaving(false);
      await refreshAfterMutation({ resetToFirstPage: true });
      return;
    }

    if (!selectedCampaign) {
      setSaving(false);
      return;
    }

    const { error } = await updateCampaignRpc(selectedCampaign.id, payload);
    if (error) {
      toast.error(`Не вдалося оновити кампанію: ${error.message}`);
      setSaving(false);
      return;
    }

    toast.success('Кампанію оновлено');
    closeModal(true);
    setSaving(false);
    await refreshAfterMutation();
    void tab; // keep ref
  }

  async function handleDelete(campaign: Campaign) {
    const confirmed = window.confirm(`Видалити кампанію "${campaign.name}"?`);
    if (!confirmed) return;

    setDeletingId(campaign.id);
    const { error } = await deleteCampaignRpc(campaign.id);
    if (error) {
      toast.error(`Не вдалося видалити кампанію: ${error.message}`);
      setDeletingId(null);
      return;
    }

    toast.success('Кампанію видалено');
    if (selectedCampaign?.id === campaign.id) closeModal();
    await refreshAfterMutation({ goToPreviousPage: campaigns.length === 1 });
    setDeletingId(null);
  }

  const campaignsTotalPages = Math.ceil(campaignsTotal / CAMPAIGNS_PAGE_SIZE);
  const templateMap = new Map(templates.map((template) => [template.id, template]));

  return {
    currentMonth,
    campaigns,
    campaignsTotal,
    campaignsTotalPages,
    calendarCampaigns,
    abSummary,
    templates,
    templateMap,
    loading,
    initialized,
    campaignsPage,
    setCampaignsPage,
    errorMsg,
    modalOpen,
    modalMode,
    selectedCampaign,
    formState,
    setFormState,
    saving,
    deletingId,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
  };
}
