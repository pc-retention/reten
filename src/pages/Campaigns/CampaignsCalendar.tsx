import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { Campaign } from '../../types';
import { statusColors } from './constants';

interface Props {
  currentMonth: Date;
  calendarCampaigns: Campaign[];
  openEditModal: (campaign: Campaign) => void;
}

export function CampaignsCalendar({ currentMonth, calendarCampaigns, openEditModal }: Props) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const emptyDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  return (
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
  );
}
