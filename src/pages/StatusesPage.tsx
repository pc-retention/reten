import { useEffect, useState } from 'react';
import { Edit2, ListChecks, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { DEFAULT_BADGE_ALPHA, DEFAULT_BADGE_HEX, getBadgeTextColor, hexToAlphaHex, parseAlphaHex } from '../lib/colors';
import { refreshClientsDenormalizedRpc } from '../lib/serverQueries';
import { supabase } from '../lib/supabase';
import type { AllowedOrderStatus } from '../types';

export default function StatusesPage() {
  const [statuses, setStatuses] = useState<AllowedOrderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftGroup, setDraftGroup] = useState('');
  const [draftHex, setDraftHex] = useState(DEFAULT_BADGE_HEX);
  const [draftOpacity, setDraftOpacity] = useState(Math.round(DEFAULT_BADGE_ALPHA * 100));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('allowed_order_statuses')
        .select('*')
        .order('status_id', { ascending: true });
      if (error) setErrorMsg(error.message);
      setStatuses(data ?? []);
      setLoading(false);
    }
    void load();
  }, []);

  async function toggleActive(status: AllowedOrderStatus) {
    setToggling(status.status_id);
    const newVal = !status.is_active;

    const { error } = await supabase
      .from('allowed_order_statuses')
      .update({ is_active: newVal })
      .eq('status_id', status.status_id);

    if (error) {
      toast.error('Помилка оновлення. Перевірте, чи створено таблицю.');
    } else {
      setStatuses((prev) =>
        prev.map((s) => (s.status_id === status.status_id ? { ...s, is_active: newVal } : s)),
      );
      const refreshResult = await refreshClientsDenormalizedRpc();
      if (refreshResult.error) {
        toast.error('Статус оновлено, але не вдалося перерахувати клієнтів');
      } else {
        toast.success(newVal ? `Статус "${status.status_name}" увімкнено` : `Статус "${status.status_name}" вимкнено`);
      }
    }
    setToggling(null);
  }

  function startEdit(status: AllowedOrderStatus) {
    const parsed = parseAlphaHex(status.color);
    setEditingId(status.status_id);
    setDraftName(status.status_name);
    setDraftGroup(status.group_name || '');
    setDraftHex(parsed.hex);
    setDraftOpacity(Math.round(parsed.opacity * 100));
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftName('');
    setDraftGroup('');
    setDraftHex(DEFAULT_BADGE_HEX);
    setDraftOpacity(Math.round(DEFAULT_BADGE_ALPHA * 100));
  }

  async function saveEdit(statusId: number) {
    setSaving(true);
    const { error } = await supabase
      .from('allowed_order_statuses')
      .update({
        status_name: draftName.trim(),
        group_name: draftGroup.trim() || null,
        color: hexToAlphaHex(draftHex, draftOpacity / 100),
      })
      .eq('status_id', statusId);

    if (error) {
      toast.error('Не вдалося оновити статус');
    } else {
      setStatuses((prev) =>
        prev.map((item) =>
          item.status_id === statusId
            ? {
                ...item,
                status_name: draftName.trim(),
                group_name: draftGroup.trim() || null,
                color: hexToAlphaHex(draftHex, draftOpacity / 100),
              }
            : item,
        ),
      );
      toast.success('Статус оновлено');
      cancelEdit();
    }
    setSaving(false);
  }

  const active = statuses.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ListChecks className="w-8 h-8 text-indigo-600" />
            Статуси замовлень
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Керуйте тим, які статуси враховуються при розрахунку загальної суми замовлень клієнта (LTV).
            Зараз включено {active} статусів з {statuses.length}.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
          <Plus className="w-4 h-4" /> Додати статус
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Завантаження...</div>
      ) : errorMsg ? (
        <div className="text-center py-20 text-red-500 bg-red-50 rounded-xl border border-red-100 shadow-sm">
          Помилка Supabase: {errorMsg}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">ID (KeyCRM)</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Назва статусу</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Група</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Колір</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Аналітика (LTV)</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {statuses.map((s) => {
                const isEditing = editingId === s.status_id;
                return (
                  <tr key={s.status_id} className={`hover:bg-gray-50 transition-colors ${!s.is_active ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-gray-400 text-xs">{s.status_id}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: s.color || '#F3F4F6',
                            color: getBadgeTextColor(s.color),
                          }}
                        >
                          {s.status_name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {isEditing ? (
                        <input
                          type="text"
                          value={draftGroup}
                          onChange={(e) => setDraftGroup(e.target.value)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        s.group_name && <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{s.group_name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {isEditing ? (
                        <div className="flex items-center gap-3">
                          <input type="color" value={draftHex} onChange={(e) => setDraftHex(e.target.value)} className="h-10 w-14 border border-gray-300 rounded-lg bg-white p-1" />
                          <div className="w-28">
                            <input type="range" min="5" max="100" value={draftOpacity} onChange={(e) => setDraftOpacity(Number(e.target.value))} className="w-full" />
                            <div className="text-xs text-gray-500">{draftOpacity}%</div>
                          </div>
                          <div className="h-10 w-20 rounded-lg border border-gray-200" style={{ backgroundColor: hexToAlphaHex(draftHex, draftOpacity / 100) }} />
                        </div>
                      ) : (
                        <div className="h-8 w-20 rounded-lg border border-gray-200" style={{ backgroundColor: s.color || '#F3F4F6' }} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(s)}
                        disabled={toggling === s.status_id}
                        className="relative inline-flex items-center cursor-pointer disabled:cursor-wait"
                        title={s.is_active ? 'Не враховувати в LTV' : 'Враховувати в LTV'}
                      >
                        <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${s.is_active ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                        <div className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${s.is_active ? 'translate-x-5' : 'translate-x-1'} ${toggling === s.status_id ? 'opacity-50' : ''}`} />
                      </button>
                      <div className="text-[10px] mt-1 text-gray-400 font-medium">{s.is_active ? 'Враховується' : 'Ігнорується'}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button onClick={() => void saveEdit(s.status_id)} disabled={saving} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                              Зберегти
                            </button>
                            <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                              Скасувати
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
