import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { LoyaltyTransactionRow } from '../../lib/serverQueries';

const TYPE_LABELS: Record<string, string> = {
  earn: 'Нарахування',
  spend: 'Списання',
  bonus: 'Бонус',
  expire: 'Згорання',
};

interface Props {
  transactions: LoyaltyTransactionRow[];
  transactionsPage: number;
  transactionsTotalPages: number;
  setTransactionsPage: (fn: (prev: number) => number) => void;
}

export function TransactionsTab({ transactions, transactionsPage, transactionsTotalPages, setTransactionsPage }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Дата</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Клієнт</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Тип</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Причина</th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium">Бали</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-500">{format(parseISO(t.created_at), 'dd.MM.yyyy')}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{t.client_name || '-'}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  t.transaction_type === 'earn' ? 'bg-green-100 text-green-700' :
                  t.transaction_type === 'spend' ? 'bg-red-100 text-red-700' :
                  t.transaction_type === 'bonus' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {TYPE_LABELS[t.transaction_type] ?? t.transaction_type}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{t.reason}</td>
              <td className={`px-4 py-3 text-right font-bold ${t.points >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {t.points > 0 ? '+' : ''}{t.points}
              </td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Немає транзакцій</td></tr>
          )}
        </tbody>
      </table>
      {transactionsTotalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <button
            onClick={() => setTransactionsPage((p) => Math.max(0, p - 1))}
            disabled={transactionsPage === 0}
            className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Попередня
          </button>
          <span className="text-sm text-gray-600 font-medium">{transactionsPage + 1} / {transactionsTotalPages}</span>
          <button
            onClick={() => setTransactionsPage((p) => Math.min(transactionsTotalPages - 1, p + 1))}
            disabled={transactionsPage >= transactionsTotalPages - 1}
            className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Наступна <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
