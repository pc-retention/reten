import { Package, Edit2 } from 'lucide-react';
import type { Product } from '../../types';
import { getBadgeTextColor } from '../../lib/colors';

interface Props {
  inactiveProducts: Product[];
  inactivePage: number;
  inactiveTotalPages: number;
  inactiveTotal: number;
  PAGE_SIZE: number;
  toggling: string | null;
  toggleActive: (product: Product) => void;
  setEditingProduct: (product: Product) => void;
  getResolvedBrandColor: (brandName: string | null | undefined, rowColor?: string | null) => string | null;
  setInactivePage: (fn: (p: number) => number) => void;
}

export function InactiveProductsTable({
  inactiveProducts,
  inactivePage,
  inactiveTotalPages,
  inactiveTotal,
  PAGE_SIZE,
  toggling,
  toggleActive,
  setEditingProduct,
  getResolvedBrandColor,
  setInactivePage,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Штрихкод</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Назва</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Категорія</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Бренд</th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium whitespace-nowrap">Ціна</th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium hidden md:table-cell whitespace-nowrap">Днів викор.</th>
            <th className="text-center px-4 py-3 text-gray-500 font-medium">Увімк.</th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium">Дії</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {inactiveProducts.map((p) => (
            <tr key={p.barcode} className="hover:bg-gray-50 transition-colors opacity-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.barcode}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-8 h-8 rounded bg-gray-100 object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <span className="font-medium text-gray-900 leading-tight">{p.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{p.category || 'Без категорії'}</span>
              </td>
              <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                <span
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={p.brand ? {
                    backgroundColor: getResolvedBrandColor(p.brand, p.brand_color) || '#F3F4F6',
                    color: getBadgeTextColor(getResolvedBrandColor(p.brand, p.brand_color)),
                  } : undefined}
                >
                  {p.brand || 'Без бренду'}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">{p.price} грн</td>
              <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell whitespace-nowrap">{p.usage_days} д.</td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => toggleActive(p)}
                  disabled={toggling === p.barcode}
                  className="relative inline-flex items-center cursor-pointer disabled:cursor-wait"
                  title="Увімкнути"
                >
                  <div className="w-10 h-6 rounded-full transition-colors duration-200 bg-gray-200" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200" />
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => setEditingProduct(p)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                  <Edit2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
          {inactiveProducts.length === 0 && (
            <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Немає вимкнених товарів</td></tr>
          )}
        </tbody>
      </table>
      {inactiveTotalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <span className="text-sm text-gray-500">
            Показано {inactivePage * PAGE_SIZE + 1}–{Math.min((inactivePage + 1) * PAGE_SIZE, inactiveTotal)} з {inactiveTotal} вимкнених товарів
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setInactivePage(p => Math.max(0, p - 1))} disabled={inactivePage === 0} className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Попередня</button>
            <span className="text-sm text-gray-600 font-medium px-2">{inactivePage + 1} / {inactiveTotalPages}</span>
            <button onClick={() => setInactivePage(p => Math.min(inactiveTotalPages - 1, p + 1))} disabled={inactivePage === inactiveTotalPages - 1} className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Наступна</button>
          </div>
        </div>
      )}
    </div>
  );
}
