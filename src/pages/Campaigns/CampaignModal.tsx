import { X } from 'lucide-react';
import type { Campaign, CommunicationTemplate } from '../../types';
import { campaignTypeOptions, campaignStatusOptions, campaignChannelOptions, defaultSegmentOptions } from './constants';
import { getTemplateLabel, type CampaignFormState } from './useCampaigns';

interface Props {
  modalMode: 'create' | 'edit';
  selectedCampaign: Campaign | null;
  formState: CampaignFormState;
  setFormState: (fn: (prev: CampaignFormState) => CampaignFormState) => void;
  saving: boolean;
  templates: CommunicationTemplate[];
  campaigns: Campaign[];
  calendarCampaigns: Campaign[];
  closeModal: () => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function CampaignModal({
  modalMode,
  selectedCampaign,
  formState,
  setFormState,
  saving,
  templates,
  campaigns,
  calendarCampaigns,
  closeModal,
  handleSubmit,
}: Props) {
  const segmentOptions = Array.from(
    new Set(
      [...defaultSegmentOptions, ...campaigns.map((campaign) => campaign.target_segment ?? ''), ...calendarCampaigns.map((campaign) => campaign.target_segment ?? '')]
        .map((segment) => segment.trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right, 'uk'));

  return (
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
                  <option key={option.value} value={option.value}>{option.label}</option>
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
                  <option key={option.value} value={option.value}>{option.label}</option>
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
                  <option key={option.value || 'empty'} value={option.value}>{option.label}</option>
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
                <option value="">Не прив'язувати шаблон</option>
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
  );
}
