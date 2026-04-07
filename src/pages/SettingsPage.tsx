import { useEffect, useMemo, useState } from 'react';
import { EyeOff, MessageSquare, Save, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { hideableNavItems } from '../lib/navigation';
import { supabase } from '../lib/supabase';
import type { CommunicationTemplate, Setting } from '../types';

type SettingValues = Record<string, string>;
type VisibilityValues = Record<string, boolean>;

export default function SettingsPage() {
  const [tab, setTab] = useState<'settings' | 'templates'>('settings');
  const [settings, setSettings] = useState<Setting[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [settingValues, setSettingValues] = useState<SettingValues>({});
  const [visibilityValues, setVisibilityValues] = useState<VisibilityValues>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savingVisibilityKey, setSavingVisibilityKey] = useState<string | null>(null);

  const hideableKeys = useMemo(
    () => hideableNavItems.map((item) => item.visibilityKey).filter((key): key is string => Boolean(key)),
    [],
  );

  useEffect(() => {
    async function load() {
      const [settingsRes, templatesRes] = await Promise.all([
        supabase.from('settings').select('*').order('key'),
        supabase.from('communication_templates').select('*').order('communication_type').order('channel'),
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
                  .filter((setting) => !hideableKeys.includes(setting.key))
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
