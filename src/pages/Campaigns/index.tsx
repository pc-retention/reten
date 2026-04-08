import { useState } from 'react';
import { BarChart3, Calendar, Plus, Send } from 'lucide-react';
import { useCampaigns } from './useCampaigns';
import { CampaignsList } from './CampaignsList';
import { CampaignsCalendar } from './CampaignsCalendar';
import { AbSummary } from './AbSummary';
import { CampaignModal } from './CampaignModal';

type CampaignTab = 'calendar' | 'list' | 'ab';

export default function CampaignsPage() {
  const [tab, setTab] = useState<CampaignTab>('list');
  const state = useCampaigns();

  if (state.loading && !state.initialized) {
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
            onClick={state.openCreateModal}
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
              onClick={() => setTab(tabItem.key as CampaignTab)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition ${
                tab === tabItem.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              <tabItem.icon className="w-4 h-4" />
              {tabItem.label}
            </button>
          ))}
        </div>

        {state.errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Помилка завантаження кампаній: {state.errorMsg}
          </div>
        )}

        {tab === 'list' && (
          <CampaignsList
            campaigns={state.campaigns}
            campaignsPage={state.campaignsPage}
            campaignsTotalPages={state.campaignsTotalPages}
            campaignsTotal={state.campaignsTotal}
            templateMap={state.templateMap}
            deletingId={state.deletingId}
            setCampaignsPage={state.setCampaignsPage}
            openEditModal={state.openEditModal}
            handleDelete={state.handleDelete}
          />
        )}

        {tab === 'calendar' && (
          <CampaignsCalendar
            currentMonth={state.currentMonth}
            calendarCampaigns={state.calendarCampaigns}
            openEditModal={state.openEditModal}
          />
        )}

        {tab === 'ab' && (
          <AbSummary abSummary={state.abSummary} />
        )}
      </div>

      {state.modalOpen && (
        <CampaignModal
          modalMode={state.modalMode}
          selectedCampaign={state.selectedCampaign}
          formState={state.formState}
          setFormState={state.setFormState}
          saving={state.saving}
          templates={state.templates}
          campaigns={state.campaigns}
          calendarCampaigns={state.calendarCampaigns}
          closeModal={state.closeModal}
          handleSubmit={(e) => state.handleSubmit(e, tab, setTab)}
        />
      )}
    </>
  );
}
