export const CAMPAIGNS_PAGE_SIZE = 50;

export const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export const statusLabels: Record<string, string> = {
  draft: 'Чернетка',
  scheduled: 'Заплановано',
  sending: 'Надсилається',
  sent: 'Надіслано',
  cancelled: 'Скасовано',
};

export const typeLabels: Record<string, string> = {
  manual: 'Ручна',
  seasonal: 'Сезонна',
  automated: 'Автоматична',
  ab_test: 'A/B тест',
};

export const channelLabels: Record<string, string> = {
  sms: 'SMS',
  email: 'Email',
  push: 'Push',
  telegram: 'Telegram',
  viber: 'Viber',
};

export const campaignTypeOptions = [
  { value: 'manual', label: 'Ручна' },
  { value: 'seasonal', label: 'Сезонна' },
  { value: 'automated', label: 'Автоматична' },
  { value: 'ab_test', label: 'A/B тест' },
];

export const campaignStatusOptions = [
  { value: 'draft', label: 'Чернетка' },
  { value: 'scheduled', label: 'Заплановано' },
  { value: 'sending', label: 'Надсилається' },
  { value: 'sent', label: 'Надіслано' },
  { value: 'cancelled', label: 'Скасовано' },
];

export const campaignChannelOptions = [
  { value: '', label: 'Не вказано' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'push', label: 'Push' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'viber', label: 'Viber' },
];

export const defaultSegmentOptions = ['all', 'At Risk', 'Champions', 'Loyal', 'Potential Loyalist', 'Promising'];
