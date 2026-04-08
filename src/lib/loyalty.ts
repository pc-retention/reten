import { hexToAlphaHex } from './colors';

const defaultTierColors: Record<string, string> = {
  bronze: '#d97706',
  silver: '#6b7280',
  gold: '#eab308',
  platinum: '#7c3aed',
};

const defaultTierLabels: Record<string, string> = {
  bronze: 'Бронза',
  silver: 'Срібло',
  gold: 'Золото',
  platinum: 'Платина',
};

const fallbackTierPalette = [
  '#0f766e',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#65a30d',
  '#0891b2',
  '#b45309',
];

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function getTierLabel(tierName: string | null | undefined) {
  if (!tierName) {
    return '';
  }

  return defaultTierLabels[tierName] || tierName;
}

export function getTierColor(tierName: string | null | undefined) {
  if (!tierName) {
    return '#64748b';
  }

  return defaultTierColors[tierName]
    || fallbackTierPalette[hashString(tierName) % fallbackTierPalette.length];
}

export function getTierBadgeStyle(tierName: string | null | undefined) {
  const color = getTierColor(tierName);

  return {
    backgroundColor: hexToAlphaHex(color, 0.18),
    color,
  };
}
