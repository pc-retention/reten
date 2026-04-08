import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import type { Campaign, CommunicationTemplate } from '../../types';
import { statusColors, statusLabels, typeLabels, channelLabels } from './constants';
import { getTemplateLabel } from './useCampaigns';

interface Props {
  campaigns: Campaign[];
  campaignsPage: number;
  campaignsTotalPages: number;
  campaignsTotal: number;
  templateMap: Map<string, CommunicationTemplate>;
  deletingId: string | null;
  setCampaignsPage: (fn: (p: number) => number) => void;
  openEditModal: (campaign: Campaign) => void;
  handleDelete: (campaign: Campaign) => Promise<void>;
}

export function CampaignsList({
  campaigns,
  campaignsPage,
  campaignsTotalPages,
  campaignsTotal,
  templateMap,
  deletingId,
  setCampaignsPage,
  openEditModal,
  handleDelete,
}: Props) {
  void campaignsTotal;
  return (
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
                  <button onClick={() => openEditModal(campaign)} className="text-left">
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
  );
}
