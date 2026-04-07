export const segmentColors: Record<string, string> = {
  Champions: '#22c55e',
  Loyal: '#3b82f6',
  'Potential Loyal': '#8b5cf6',
  'New Customers': '#06b6d4',
  Promising: '#f59e0b',
  'Need Attention': '#f97316',
  'About To Sleep': '#ef4444',
  'At Risk': '#dc2626',
  "Can't Lose Them": '#991b1b',
  Hibernating: '#6b7280',
  Lost: '#374151',
};

export const segmentNames: Record<string, string> = {
  Champions: 'Чемпіони',
  Loyal: 'Лояльні',
  'Potential Loyal': 'Потенційно лояльні',
  'New Customers': 'Нові клієнти',
  Promising: 'Перспективні',
  'Need Attention': 'Потребують уваги',
  'About To Sleep': 'Засинають',
  'At Risk': 'В зоні ризику',
  "Can't Lose Them": 'Не можна втратити',
  Hibernating: 'Сплячі',
  Lost: 'Втрачені',
};

export function getSegmentLabel(segmentName: string | null | undefined) {
  if (!segmentName) return '';
  return segmentNames[segmentName] || segmentName;
}
