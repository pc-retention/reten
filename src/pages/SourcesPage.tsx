import { Plus, Edit2, Trash2 } from 'lucide-react';
import { allowedSources } from '../lib/testData';

export default function SourcesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Джерела</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
          <Plus className="w-4 h-4" /> Додати джерело
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">ID</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Назва</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">Статус</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allowedSources.map(s => (
              <tr key={s.source_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-gray-600">{s.source_id}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{s.source_name}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {s.is_active ? 'Активне' : 'Вимкнене'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600"><Edit2 className="w-4 h-4" /></button>
                    <button className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
