import { Eye, MousePointer } from 'lucide-react';
import type { AbVariantSummaryRow } from '../../lib/serverQueries';

interface Props {
  abSummary: AbVariantSummaryRow[];
}

export function AbSummary({ abSummary }: Props) {
  const variantA = abSummary.find(item => item.variant === 'A');
  const variantB = abSummary.find(item => item.variant === 'B');
  const variantAOpenRate = variantA && variantA.total_messages > 0 ? Math.round(variantA.opened_messages / variantA.total_messages * 100) : 0;
  const variantBOpenRate = variantB && variantB.total_messages > 0 ? Math.round(variantB.opened_messages / variantB.total_messages * 100) : 0;
  const variantAClickRate = variantA && variantA.total_messages > 0 ? Math.round(variantA.clicked_messages / variantA.total_messages * 100) : 0;
  const variantBClickRate = variantB && variantB.total_messages > 0 ? Math.round(variantB.clicked_messages / variantB.total_messages * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">A/B Тестування шаблонів</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-2 border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold text-sm">A</span>
            <span className="text-sm text-gray-500">{variantA?.total_messages ?? 0} повідомлень</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Eye className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Відкриття</span>
              <span className="ml-auto font-bold text-gray-900">{variantAOpenRate}%</span>
            </div>
            <div className="flex items-center gap-3">
              <MousePointer className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Кліки</span>
              <span className="ml-auto font-bold text-gray-900">{variantAClickRate}%</span>
            </div>
          </div>
        </div>

        <div className="border-2 border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold text-sm">B</span>
            <span className="text-sm text-gray-500">{variantB?.total_messages ?? 0} повідомлень</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Eye className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Відкриття</span>
              <span className="ml-auto font-bold text-green-600">{variantBOpenRate}%</span>
            </div>
            <div className="flex items-center gap-3">
              <MousePointer className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Кліки</span>
              <span className="ml-auto font-bold text-green-600">{variantBClickRate}%</span>
            </div>
          </div>
          {(variantB?.opened_messages ?? 0) > (variantA?.opened_messages ?? 0) && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-green-700 font-medium">Варіант B перемагає</p>
            </div>
          )}
        </div>
      </div>
      <button className="mt-6 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
        Зробити переможця основним
      </button>
    </div>
  );
}
