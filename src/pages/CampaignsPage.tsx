import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  MousePointer,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { uk } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import type { Campaign, CommunicationTemplate } from '../types';
import {
  createCampaignRpc,
  deleteCampaignRpc,
  fetchAbVariantSummaryRpc,
  fetchCampaignsCalendarRpc,
  fetchCampaignsPageRpc,
  updateCampaignRpc,
  type AbVariantSummaryRow,
} from '../lib/serverQueries';

const CAMPAIGNS_PAGE_SIZE = 50;

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  draft: 'Чернетка',
  scheduled: 'Заплановано',
  sending: 'Надсилається',
  sent: 'Надіслано',
  cancelled: 'Скасовано',
};

const typeLabels: Record<string, string> = {
  manual: 'Ручна',
  seasonal: 'Сезонна',
  automated: 'Автоматична',
  ab_test: 'A/B тест',
};

const channelLabels: Record<string, string> = {
  sms: 'SMS',
  email: 'Email',
  push: 'Push',
  telegram: 'Telegram',
  viber: 'Viber',
};

const campaignTypeOptions = [
  { value: 'manual', label: 'Ручна' },
  { value: 'seasonal', label: 'Сезонна' },
  { value: 'automated', label: 'Автоматична' },
  { value: 'ab_test', label: 'A/B тест' },
];

const campaignStatusOptions = [
  { value: 'draft', label: 'Чернетка' },
  { value: 'scheduled', label: 'Заплановано' },
  { value: 'sending', label: 'Надсилається' },
  { value: 'sent', label: 'Надіслано' },
  { value: 'cancelled', label: 'Скасовано' },
];

const campaignChannelOptions = [
  { value: '', label: 'Не вказано' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'push', label: 'Push' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'viber', label: 'Viber' },
];

const defaultSegmentOptions = ['all', 'At Risk', 'Champions', 'Loyal', 'Potential Loyalist', 'Promising'];

type CampaignFormState = {
  name: string;
  type: string;
  targetSegment: string;
  targetClientsCount: string;
  channel: string;
  templateId: string;
  scheduledAt: string;
  status: string;
};

const emptyCampaignForm: CampaignFormState = {
  name: '',
  type: 'manual',
  targetSegment: 'all',
  targetClientsCount: '0',
  channel: '',
  templateId: '',
  scheduledAt: '',
  status: 'draft',
};

function toDatetimeLocalValue(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (part: number) => String(part).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoDatetime(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getTemplateLabel(template: CommunicationTemplate) {
  const parts = [template.communication_type, template.channel];
  if (template.ab_variant) {
    parts.push(`A/B ${template.ab_variant}`);
  }
  if (!template.is_active) {
    parts.push('вимкнено');
  }
  return parts.join(' / ');
}

export default function CampaignsPage() {
  const [tab, setTab] = useState<'calendar' | 'list' | 'ab'>('list');
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

    setCampaigns(campaignsRes.data.map(({ total_count: _totalCount, ...campaign }) => campaign));
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
      if (!initialized) {
        setLoading(true);
      }

      await Promise.all([loadCampaignsList(), loadCalendarCampaigns(), loadAbSummary(), loadTemplates()]);
      setInitialized(true);
      setLoading(false);
    }

    if (!initialized) {
      void load();
    }
  }, [initialized, loadCampaignsList, loadCalendarCampaigns, loadAbSummary, loadTemplates]);

  useEffect(() => {
    if (initialized && tab === 'list') {
      void loadCampaignsList();
    }
  }, [initialized, tab, loadCampaignsList]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const emptyDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  const campaignsTotalPages = Math.ceil(campaignsTotal / CAMPAIGNS_PAGE_SIZE);
  const templateMap = new Map(templates.map((template) => [template.id, template]));
  const segmentOptions = Array.from(
    new Set(
      [...defaultSegmentOptions, ...campaigns.map((campaign) => campaign.target_segment ?? ''), ...calendarCampaigns.map((campaign) => campaign.target_segment ?? '')]
        .map((segment) => segment.trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right, 'uk'));

  const variantA = abSummary.find(item => item.variant === 'A');
  const variantB = abSummary.find(item => item.variant === 'B');
  const variantAOpenRate = variantA && variantA.total_messages > 0 ? Math.round(variantA.opened_messages / variantA.total_messages * 100) : 0;
  const variantBOpenRate = variantB && variantB.total_messages > 0 ? Math.round(variantB.opened_messages / variantB.total_messages * 100) : 0;
  const variantAClickRate = variantA && variantA.total_messages > 0 ? Math.round(variantA.clicked_messages / variantA.total_messages * 100) : 0;
  const variantBClickRate = variantB && variantB.total_messages > 0 ? Math.round(variantB.clicked_messages / variantB.total_messages * 100) : 0;

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

  async function refreshAfterMutation(options?: { resetToFirstPage?: boolean; goToPreviousPage?: boolean }) {
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
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    if (selectedCampaign?.id === campaign.id) {
      closeModal();
    }

    await refreshAfterMutation({ goToPreviousPage: campaigns.length === 1 });
    setDeletingId(null);
  }

  if (loading && !initialized) {
    return <div className="text-center py-20 text-gray-400">Завантаження...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Кампанії</h1>
            <p className="mt-1 text-sm text-gray-500">
              Список, календар, створення, редагування та видалення кампаній.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" /> Нова кампанія
          </button>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { key: 'list', label: 'Кампанії', icon: Send },
            { key: 'calendar', label: 'Календар', icon: Calendar },
            { key: 'ab', label: 'A/B Тести', icon: BarChart3 },
          ].map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key as 'calendar' | 'list' | 'ab')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition ${
                tab === tabItem.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              <tabItem.icon className="w-4 h-4" />
              {tabItem.label}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Помилка завантаження кампаній: {errorMsg}
          </div>
        )}

        {tab === 'list' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Кампанія</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Тип</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Сегмент</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Канал</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Статус</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Відправлено</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Відкрито</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Кліки</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium hidden xl:table-cell">Конверсія</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((campaign) => {
                  const template = campaign.template_id ? templateMap.get(campaign.template_id) : null;
                  const statusColor = statusColors[campaign.status] ?? 'bg-gray-100 text-gray-600';

                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEditModal(campaign)}
                          className="text-left"
                        >
                          <p className="font-medium text-gray-900 hover:text-indigo-700 transition">{campaign.name}</p>
                        </button>
                        <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                          <p>{campaign.scheduled_at ? format(parseISO(campaign.scheduled_at), 'dd.MM.yyyy HH:mm') : 'Не заплановано'}</p>
                          <p>Шаблон: {template ? getTemplateLabel(template) : campaign.template_id || 'не вказано'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {typeLabels[campaign.type] || campaign.type || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                        {campaign.target_segment || 'всі'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {channelLabels[campaign.channel ?? ''] || campaign.channel || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                          {statusLabels[campaign.status] || campaign.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{campaign.sent_count}</td>
                      <td className="px-4 py-3 text-right text-gray-600 hidden lg:table-cell">
                        {campaign.sent_count > 0 ? `${campaign.opened_count} (${Math.round(campaign.opened_count / campaign.sent_count * 100)}%)` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 hidden lg:table-cell">
                        {campaign.sent_count > 0 ? `${campaign.clicked_count} (${Math.round(campaign.clicked_count / campaign.sent_count * 100)}%)` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 hidden xl:table-cell">
                        {campaign.sent_count > 0 ? `${campaign.conversion_count} (${Math.round(campaign.conversion_count / campaign.sent_count * 100)}%)` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(campaign)}
                            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-700"
                            title="Редагувати кампанію"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => void handleDelete(campaign)}
                            disabled={deletingId === campaign.id}
                            className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-600 disabled:opacity-50"
                            title="Видалити кампанію"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                      Кампаній поки немає. Створіть першу кампанію кнопкою вище.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {campaignsTotalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <button
                  onClick={() => setCampaignsPage((page) => Math.max(0, page - 1))}
                  disabled={campaignsPage === 0}
                  className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Попередня
                </button>
                <span className="text-sm text-gray-600 font-medium">
                  {campaignsPage + 1} / {campaignsTotalPages}
                </span>
                <button
                  onClick={() => setCampaignsPage((page) => Math.min(campaignsTotalPages - 1, page + 1))}
                  disabled={campaignsPage >= campaignsTotalPages - 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Наступна <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'calendar' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {format(currentMonth, 'MMMM yyyy', { locale: uk })}
            </h2>
            <div className="grid grid-cols-7 gap-1">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((dayLabel) => (
                <div key={dayLabel} className="text-center text-xs text-gray-500 font-medium py-2">
                  {dayLabel}
                </div>
              ))}
              {Array.from({ length: emptyDays }).map((_, index) => <div key={`e-${index}`} />)}
              {days.map((day) => {
                const dayCampaigns = calendarCampaigns.filter((campaign) => campaign.scheduled_at && isSameDay(parseISO(campaign.scheduled_at), day));
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toString()}
                    className={`min-h-[80px] p-1.5 border rounded-lg ${isToday ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100'}`}
                  >
                    <span className={`text-xs font-medium ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                      {format(day, 'd')}
                    </span>
                    {dayCampaigns.map((campaign) => (
                      <button
                        key={campaign.id}
                        onClick={() => openEditModal(campaign)}
                        className={`mt-1 block w-full px-1.5 py-0.5 rounded text-left text-xs truncate ${statusColors[campaign.status] ?? 'bg-gray-100 text-gray-600'}`}
                        title={campaign.name}
                      >
                        {campaign.name}
                      </button>
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
              <div className="border-2 border-blue-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold text-sm">A</span>
                  <span className="text-sm text-gray-500">{variantA?.total_messages ?? 0} повідомлень</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Відкриття</span>
                    <span className="ml-auto font-bold text-gray-900">{variantAOpenRate}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MousePointer className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Кліки</span>
                    <span className="ml-auto font-bold text-gray-900">{variantAClickRate}%</span>
                  </div>
                </div>
              </div>

              <div className="border-2 border-green-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold text-sm">B</span>
                  <span className="text-sm text-gray-500">{variantB?.total_messages ?? 0} повідомлень</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Відкриття</span>
                    <span className="ml-auto font-bold text-green-600">{variantBOpenRate}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MousePointer className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Кліки</span>
                    <span className="ml-auto font-bold text-green-600">{variantBClickRate}%</span>
                  </div>
                </div>
                {(variantB?.opened_messages ?? 0) > (variantA?.opened_messages ?? 0) && (
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {modalMode === 'create' ? 'Нова кампанія' : 'Редагування кампанії'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {modalMode === 'create'
                    ? 'Створіть кампанію та збережіть її в таблицю campaigns.'
                    : 'Оновіть параметри кампанії та збережіть зміни.'}
                </p>
              </div>
              <button
                onClick={() => closeModal()}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Закрити"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Назва кампанії</span>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Наприклад: Весняний розпродаж"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Тип</span>
                  <select
                    value={formState.type}
                    onChange={(event) => setFormState((prev) => ({ ...prev, type: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {campaignTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Статус</span>
                  <select
                    value={formState.status}
                    onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {campaignStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Сегмент</span>
                  <input
                    list="campaign-segment-options"
                    type="text"
                    value={formState.targetSegment}
                    onChange={(event) => setFormState((prev) => ({ ...prev, targetSegment: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="all / At Risk / Champions"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Кількість клієнтів</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formState.targetClientsCount}
                    onChange={(event) => setFormState((prev) => ({ ...prev, targetClientsCount: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Канал</span>
                  <select
                    value={formState.channel}
                    onChange={(event) => setFormState((prev) => ({ ...prev, channel: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {campaignChannelOptions.map((option) => (
                      <option key={option.value || 'empty'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Заплановано на</span>
                  <input
                    type="datetime-local"
                    value={formState.scheduledAt}
                    onChange={(event) => setFormState((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Шаблон</span>
                  <select
                    value={formState.templateId}
                    onChange={(event) => setFormState((prev) => ({ ...prev, templateId: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Не прив’язувати шаблон</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {getTemplateLabel(template)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <datalist id="campaign-segment-options">
                {segmentOptions.map((segment) => (
                  <option key={segment} value={segment} />
                ))}
              </datalist>

              {selectedCampaign && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <h3 className="text-sm font-semibold text-gray-900">Поточні метрики кампанії</h3>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-white px-3 py-2 border border-gray-100">
                      <div className="text-xs text-gray-500">Відправлено</div>
                      <div className="mt-1 text-lg font-semibold text-gray-900">{selectedCampaign.sent_count}</div>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2 border border-gray-100">
                      <div className="text-xs text-gray-500">Відкрито</div>
                      <div className="mt-1 text-lg font-semibold text-gray-900">{selectedCampaign.opened_count}</div>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2 border border-gray-100">
                      <div className="text-xs text-gray-500">Кліки</div>
                      <div className="mt-1 text-lg font-semibold text-gray-900">{selectedCampaign.clicked_count}</div>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2 border border-gray-100">
                      <div className="text-xs text-gray-500">Конверсія</div>
                      <div className="mt-1 text-lg font-semibold text-gray-900">{selectedCampaign.conversion_count}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => closeModal()}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Збереження...' : modalMode === 'create' ? 'Створити кампанію' : 'Зберегти зміни'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
