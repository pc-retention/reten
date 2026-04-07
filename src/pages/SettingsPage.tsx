import { useEffect, useMemo, useState } from 'react';
import { EyeOff, KeyRound, LogOut, MessageSquare, Save, Settings, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { ADMIN_EMAIL_SETTING_KEY, ADMIN_USERNAME_SETTING_KEY, useAuth } from '../lib/auth';
import { hideableNavItems } from '../lib/navigation';
import { supabase } from '../lib/supabase';
import { fetchCommunicationTemplatesListRpc, fetchSettingsListRpc } from '../lib/serverQueries';
import type { CommunicationTemplate, Setting } from '../types';

type SettingValues = Record<string, string>;
type VisibilityValues = Record<string, boolean>;

export default function SettingsPage() {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<'settings' | 'security' | 'templates'>('settings');
  const [settings, setSettings] = useState<Setting[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [settingValues, setSettingValues] = useState<SettingValues>({});
  const [visibilityValues, setVisibilityValues] = useState<VisibilityValues>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savingVisibilityKey, setSavingVisibilityKey] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const hideableKeys = useMemo(
    () => hideableNavItems.map((item) => item.visibilityKey).filter((key): key is string => Boolean(key)),
    [],
  );

  const hiddenSettingKeys = useMemo(
    () => new Set([...hideableKeys, ADMIN_EMAIL_SETTING_KEY, ADMIN_USERNAME_SETTING_KEY]),
    [hideableKeys],
  );

  useEffect(() => {
    async function load() {
      const [settingsRes, templatesRes] = await Promise.all([
        fetchSettingsListRpc(),
        fetchCommunicationTemplatesListRpc(),
      ]);

      const settingsRows = settingsRes.data ?? [];
      setSettings(settingsRows);
      setTemplates(templatesRes.data ?? []);

      const values: SettingValues = {};
      const visibility: VisibilityValues = {};

      for (const row of settingsRows) {
        values[row.key] = row.value;
      }

      for (const key of hideableKeys) {
        visibility[key] = values[key] !== 'false';
      }

      setSettingValues(values);
      setVisibilityValues(visibility);
      setLoading(false);
    }

    void load();
  }, [hideableKeys]);

  async function saveSetting(setting: Setting) {
    const nextValue = settingValues[setting.key] ?? '';
    setSavingKey(setting.key);

    const { error } = await supabase.rpc('upsert_public_setting', {
      p_key: setting.key,
      p_value: nextValue,
      p_description: setting.description,
    });

    if (error) {
      toast.error('Не вдалося зберегти параметр');
    } else {
      setSettings((prev) =>
        prev.map((item) =>
          item.key === setting.key
            ? { ...item, value: nextValue }
            : item,
        ),
      );
      toast.success('Параметр збережено');
    }

    setSavingKey(null);
  }

  async function toggleVisibility(settingKey: string, label: string) {
    const nextValue = !(visibilityValues[settingKey] ?? true);
    setSavingVisibilityKey(settingKey);

    const { error } = await supabase.rpc('upsert_public_setting', {
      p_key: settingKey,
      p_value: String(nextValue),
      p_description: `Показувати вкладку "${label}" у sidebar`,
    });

    if (error) {
      toast.error('Не вдалося оновити видимість вкладки');
    } else {
      setVisibilityValues((prev) => ({ ...prev, [settingKey]: nextValue }));
      setSettingValues((prev) => ({ ...prev, [settingKey]: String(nextValue) }));
      window.dispatchEvent(new Event('sidebar-visibility-changed'));
      toast.success(nextValue ? `Вкладку "${label}" показано` : `Вкладку "${label}" приховано`);
    }

    setSavingVisibilityKey(null);
  }

  async function savePassword() {
    if (!newPassword) {
      toast.error('Введіть новий пароль');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Пароль має містити щонайменше 6 символів');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Паролі не співпадають');
      return;
    }

    setSavingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error('Не вдалося оновити пароль');
    } else {
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Пароль оновлено');
    }

    setSavingPassword(false);
  }

  async function handleSignOut() {
    await signOut();
    toast.success('Сесію завершено');
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Завантаження...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Налаштування</h1>

      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 w-fit">
        <button
          onClick={() => setTab('settings')}
          className={`flex items-center gap-1.5 rounded-[14px] px-4 py-2 text-sm font-medium transition ${
            tab === 'settings' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
          }`}
        >
          <Settings className="w-4 h-4" /> Параметри
        </button>
        <button
          onClick={() => setTab('security')}
          className={`flex items-center gap-1.5 rounded-[14px] px-4 py-2 text-sm font-medium transition ${
            tab === 'security' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
          }`}
        >
          <Shield className="w-4 h-4" /> Безпека
        </button>
        <button
          onClick={() => setTab('templates')}
          className={`flex items-center gap-1.5 rounded-[14px] px-4 py-2 text-sm font-medium transition ${
            tab === 'templates' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Шаблони ({templates.length})
        </button>
      </div>

      {tab === 'settings' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <EyeOff className="h-5 w-5 text-indigo-600" />
                Видимість вкладок
              </div>
              <p className="mt-1 text-sm text-slate-500">Можна приховати пункти меню від `Замовлення` до `Синхронізація`.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {hideableNavItems.map((item) => {
                const settingKey = item.visibilityKey!;
                const isVisible = visibilityValues[settingKey] ?? true;
                return (
                  <div key={settingKey} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3 text-slate-800">
                      <span className="text-slate-500">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <button
                      onClick={() => void toggleVisibility(settingKey, item.label)}
                      disabled={savingVisibilityKey === settingKey}
                      className="relative inline-flex items-center cursor-pointer disabled:cursor-wait"
                      title={isVisible ? 'Приховати вкладку' : 'Показати вкладку'}
                    >
                      <div className={`h-6 w-10 rounded-full transition-colors duration-200 ${isVisible ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                      <div className={`absolute h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${isVisible ? 'translate-x-5' : 'translate-x-1'} ${savingVisibilityKey === settingKey ? 'opacity-50' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Ключ</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Значення</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Опис</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {settings
                  .filter((setting) => !hiddenSettingKeys.has(setting.key))
                  .map((setting) => (
                    <tr key={setting.key} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{setting.key}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={settingValues[setting.key] ?? ''}
                          onChange={(e) => setSettingValues((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                          className="w-32 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{setting.description}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => void saveSetting(setting)}
                          disabled={savingKey === setting.key}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-md hover:bg-indigo-100 disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5 inline mr-1" />Зберегти
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <KeyRound className="h-5 w-5 text-indigo-600" />
                Пароль адміністратора
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Вхід у дашборд працює лише по паролю для внутрішнього адміністраторського акаунта.
              </p>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Логін більше не потрібен. Для входу використовується лише пароль.
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Новий пароль</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
                    placeholder="Не менше 6 символів"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Повторіть пароль</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
                    placeholder="Повторіть новий пароль"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void savePassword()}
                  disabled={savingPassword}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  Оновити пароль
                </button>
                <button
                  onClick={() => void handleSignOut()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  <LogOut className="h-4 w-4" />
                  Вийти
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-base font-semibold text-amber-950">
              <Shield className="h-5 w-5" />
              Пам’ятай
            </div>
            <div className="mt-3 space-y-3 text-sm leading-6 text-amber-900/85">
              <p>Пароль змінюється для поточного адміністратора Supabase Auth.</p>
              <p>Після зміни використовуй новий пароль для всіх наступних входів.</p>
              <p>Пароль уводиться одразу на стартовому екрані, без додаткового логіну.</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'templates' && (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-3xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-500">{t.id}</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{t.communication_type}</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{t.channel}</span>
                  {t.ab_variant && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">{t.ab_variant}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {t.is_active ? 'Активний' : 'Вимкнено'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{t.body_template}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
