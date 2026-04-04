import { useState, useEffect } from 'react';
import { Settings, Save, MessageSquare, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Setting, CommunicationTemplate } from '../types';

export default function SettingsPage() {
  const [tab, setTab] = useState<'settings' | 'templates'>('settings');
  const [settings, setSettings] = useState<Setting[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [settingsRes, templatesRes] = await Promise.all([
        supabase.from('settings').select('*').order('key'),
        supabase.from('communication_templates').select('*').order('communication_type').order('channel'),
      ]);
      setSettings(settingsRes.data ?? []);
      setTemplates(templatesRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Завантаження...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Налаштування</h1>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setTab('settings')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition ${
            tab === 'settings' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
          }`}>
          <Settings className="w-4 h-4" /> Параметри
        </button>
        <button onClick={() => setTab('templates')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition ${
            tab === 'templates' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
          }`}>
          <MessageSquare className="w-4 h-4" /> Шаблони ({templates.length})
        </button>
      </div>

      {tab === 'settings' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
              {settings.map(s => (
                <tr key={s.key} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.key}</td>
                  <td className="px-4 py-3">
                    <input type="text" defaultValue={s.value}
                      className="px-3 py-1.5 border border-gray-200 rounded-md text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{s.description}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-md hover:bg-indigo-100">
                      <Save className="w-3.5 h-3.5 inline mr-1" />Зберегти
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'templates' && (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-500">{t.id}</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{t.communication_type}</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{t.channel}</span>
                  {t.ab_variant && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">{t.ab_variant}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>{t.is_active ? 'Активний' : 'Вимкнено'}</span>
                </div>
                <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{t.body_template}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
