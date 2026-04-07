export const DEFAULT_BADGE_HEX = '#4F46E5';
export const DEFAULT_BADGE_ALPHA = 0.18;

export function clampOpacity(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function hexToAlphaHex(hex: string, opacity: number) {
  const normalized = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : DEFAULT_BADGE_HEX;
  const alpha = Math.round(clampOpacity(opacity) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  return `${normalized}${alpha}`;
}

export function parseAlphaHex(color: string | null | undefined) {
  if (!color) {
    return { hex: DEFAULT_BADGE_HEX, opacity: DEFAULT_BADGE_ALPHA };
  }

  if (/^#[0-9A-Fa-f]{8}$/.test(color)) {
    return {
      hex: color.slice(0, 7),
      opacity: parseInt(color.slice(7, 9), 16) / 255,
    };
  }

  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return { hex: color, opacity: DEFAULT_BADGE_ALPHA };
  }

  return { hex: DEFAULT_BADGE_HEX, opacity: DEFAULT_BADGE_ALPHA };
}

export function getBadgeTextColor(color: string | null | undefined) {
  if (color && /^#[0-9A-Fa-f]{8}$/.test(color)) {
    return color.slice(0, 7);
  }
  if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color;
  }
  return DEFAULT_BADGE_HEX;
}
