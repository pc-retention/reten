import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { AllowedSource } from '../types';

export default function SourcesPage() {
  const [sources, setSources] = useState<AllowedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('allowed_sources')
        .select('*')
        .order('source_id', { ascending: true });
      setSources(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function toggleActive(source: AllowedSource) {
    setToggling(source.source_id);
    const newVal = !source.is_active;

    const { error } = await supabase
      .from('allowed_sources')
      .update({ is_active: newVal })
      .eq('source_id', source.source_id);

    if (error) {
      toast.error('Помилка оновлення');
    } else {
      setSources(prev =>
        prev.map(s => s.source_id === source.source_id ? { ...s, is_active: newVal } : s)
      );
      toast.success(newVal ? `"${source.source_name}" увімкнено` : `"${source.source_name}" вимкнено`);
    }
    setToggling(null);
  }

  const active = sources.filter(s => s.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Джерела</h1>
          <p className="text-sm text-gray-500 mt-0.5">{active} активних з {sources.length}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
          <Plus className="w-4 h-4" /> Додати джерело
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Завантаження...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">ID</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Назва</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Статус</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Увімк.</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sources.map(s => (
                <tr key={s.source_id} className={`hover:bg-gray-50 transition-colors ${!s.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-gray-400 text-xs">{s.source_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.source_name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {s.is_active ? 'Активне' : 'Вимкнене'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(s)}
                      disabled={toggling === s.source_id}
                      className="relative inline-flex items-center cursor-pointer disabled:cursor-wait"
                      title={s.is_active ? 'Вимкнути' : 'Увімкнути'}
                    >
                      <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                        s.is_active ? 'bg-indigo-600' : 'bg-gray-200'
                      }`} />
                      <div className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                        s.is_active ? 'translate-x-5' : 'translate-x-1'
                      } ${toggling === s.source_id ? 'opacity-50' : ''}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
