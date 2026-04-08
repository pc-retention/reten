import { addMonths, format } from 'date-fns';

export type ReminderStatus = 'today' | 'overdue' | 'sent' | 'upcoming';

export interface ReminderStatusSource {
  reminder_date: string;
  reminder_sent: boolean;
}

export function getDefaultReminderDateRange() {
  return {
    dateFrom: format(addMonths(new Date(), -4), 'yyyy-MM-dd'),
    dateTo: format(addMonths(new Date(), 4), 'yyyy-MM-dd'),
  };
}

export function getTodayDateKey() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getReminderStatus(
  reminder: ReminderStatusSource,
  todayDateKey = getTodayDateKey(),
): ReminderStatus {
  if (reminder.reminder_sent) {
    return 'sent';
  }

  if (reminder.reminder_date < todayDateKey) {
    return 'overdue';
  }

  if (reminder.reminder_date === todayDateKey) {
    return 'today';
  }

  return 'upcoming';
}
