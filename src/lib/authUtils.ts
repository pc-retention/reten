export const LEGACY_AUTH_SETTING_KEYS = ['auth_admin_email', 'auth_admin_username'] as const;

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(value: string) {
  const encodedValue = new TextEncoder().encode(value);
  const digestBuffer = await crypto.subtle.digest('SHA-256', encodedValue);
  return bytesToHex(new Uint8Array(digestBuffer));
}

export async function createDashboardPasswordHash(password: string) {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);

  const salt = bytesToHex(saltBytes);
  const digest = await sha256Hex(`${salt}:${password}`);

  return `sha256$${salt}$${digest}`;
}
