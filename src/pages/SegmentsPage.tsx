import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Users, Settings2 } from 'lucide-react';
import { clients, rfmSegments, rfmConfig, getSegmentClients } from '../lib/testData';

export default function SegmentsPage() {
  const [tab, setTab] = useState<'overview' | 'matrix' | 'config'>('overview');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const navigate = useNavigate();

  // Підрахунок клієнтів по сегментах
  const segmentCounts: Record<string, number> = {};
  clients.forEach(c => {
    if (c.rfm_segment) segmentCounts[c.rfm_segment] = (segmentCounts[c.rfm_segment] || 0) + 1;
  });

  // RFM матриця: R по Y, F по X, значення = кількість клієнтів
  const matrix: Record<string, Record<string, number>> = {};
  for (let r = 5; r >= 1; r--) {
    matrix[r] = {};
    for (let f = 1; f <= 5; f++) {
      matrix[r][f] = clients.filter(c => c.rfm_recency === r && c.rfm_frequency === f).length;
    }
  }

  function cellColor(count: number): string {
    if (count === 0) return 'bg-gray-50 text-gray-300';
    if (count <= 2) return 'bg-blue-100 text-blue-700';
    if (count <= 5) return 'bg-blue-300 text-white';
    if (count <= 10) return 'bg-indigo-500 text-white';
    return 'bg-indigo-700 text-white';
  }

  const segmentClients = selectedSegment ? getSegmentClients(selectedSegment) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">RFM Сегменти</h1>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'overview', label: 'Огляд', icon: Target },
          { key: 'matrix', label: 'RFM Матриця', icon: Users },
          { key: 'config', label: 'Конфігурація', icon: Settings2 },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key as any); setSelectedSegment(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition flex items-center gap-1.5 ${
              tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && !selectedSegment && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rfmSegments.map(seg => {
            const count = segmentCounts[seg.segment_name] || 0;
            return (
              <div key={seg.segment_name}
                onClick={() => setSelectedSegment(seg.segment_name)}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm cursor-pointer hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: seg.color }} />
                  <h3 className="font-semibold text-gray-900">{seg.segment_name}</h3>
                </div>
                <div className="flex items-end justify-between mb-3">
                  <p className="text-3xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-500">R:{seg.r_scores.join(',')}&nbsp; F:{seg.f_scores.join(',')}&nbsp; M:{seg.m_scores.join(',')}</p>
                </div>
                <p className="text-sm text-gray-600">{seg.recommended_action}</p>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'overview' && selectedSegment && (
        <div className="space-y-4">
          <button onClick={() => setSelectedSegment(null)} className="text-sm text-indigo-600 hover:text-indigo-800">
            ← Назад до сегментів
          </button>
          <h2 className="text-xl font-bold text-gray-900">{selectedSegment} ({segmentClients.length})</h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Клієнт</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">RFM</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Замовлень</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Витрачено</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Остання</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {segmentClients.map(c => (
                  <tr key={c.client_id} onClick={() => navigate(`/clients/${c.client_id}`)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.full_name}</td>
                    <td className="px-4 py-3 text-center font-mono text-gray-600">{c.rfm_recency}-{c.rfm_frequency}-{c.rfm_monetary}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{c.total_orders}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{c.total_spent.toLocaleString()} грн</td>
                    <td className="px-4 py-3 text-right text-gray-500">{c.last_order_date || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'matrix' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">RFM Теплова карта (R × F)</h2>
          <div className="overflow-x-auto">
            <table className="mx-auto">
              <thead>
                <tr>
                  <th className="w-20 text-xs text-gray-500 font-medium text-right pr-2">R \ F</th>
                  {[1, 2, 3, 4, 5].map(f => (
                    <th key={f} className="w-16 text-center text-xs text-gray-500 font-medium pb-2">F={f}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[5, 4, 3, 2, 1].map(r => (
                  <tr key={r}>
                    <td className="text-right pr-3 text-xs text-gray-500 font-medium">R={r}</td>
                    {[1, 2, 3, 4, 5].map(f => (
                      <td key={f} className="p-1">
                        <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-sm font-bold ${cellColor(matrix[r][f])}`}>
                          {matrix[r][f]}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-50 border" /> 0</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100" /> 1-2</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-300" /> 3-5</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-500" /> 6-10</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-700" /> 10+</span>
          </div>
        </div>
      )}

      {tab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {['recency', 'frequency', 'monetary'].map(metric => {
            const metricLabels: Record<string, string> = { recency: 'Давність (R)', frequency: 'Частота (F)', monetary: 'Грошовий (M)' };
            return (
            <div key={metric} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{metricLabels[metric]}</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left pb-2 text-gray-500">Скор</th>
                    <th className="text-right pb-2 text-gray-500">Від</th>
                    <th className="text-right pb-2 text-gray-500">До</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rfmConfig.filter(c => c.metric === metric).sort((a, b) => b.score - a.score).map(c => (
                    <tr key={c.score}>
                      <td className="py-2">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium text-xs">{c.score}</span>
                      </td>
                      <td className="py-2 text-right text-gray-700">{c.min_value}</td>
                      <td className="py-2 text-right text-gray-700">{c.max_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
