import { Package, Edit2 } from 'lucide-react';
import type { Product } from '../../types';
import { getBadgeTextColor } from '../../lib/colors';
import { SortIcon } from './SortIcon';
import type { SortField } from './types';

interface Props {
  products: Product[];
  page: number;
  productsTotalPages: number;
  productsTotal: number;
  PAGE_SIZE: number;
  toggling: string | null;
  sortField: SortField;
  sortAsc: boolean;
  handleSort: (field: SortField) => void;
  toggleActive: (product: Product) => void;
  setEditingProduct: (product: Product) => void;
  getResolvedBrandColor: (brandName: string | null | undefined, rowColor?: string | null) => string | null;
  setPage: (fn: (p: number) => number) => void;
}

export function ProductsTable({
  products,
  page,
  productsTotalPages,
  productsTotal,
  PAGE_SIZE,
  toggling,
  sortField,
  sortAsc,
  handleSort,
  toggleActive,
  setEditingProduct,
  getResolvedBrandColor,
  setPage,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th onClick={() => handleSort('barcode')} className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer hover:bg-gray-100 group">
              <div className="flex items-center justify-between gap-2">Штрихкод <SortIcon field="barcode" sortField={sortField} sortAsc={sortAsc} /></div>
            </th>
            <th onClick={() => handleSort('name')} className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer hover:bg-gray-100 group">
              <div className="flex items-center justify-between gap-2">Назва <SortIcon field="name" sortField={sortField} sortAsc={sortAsc} /></div>
            </th>
            <th onClick={() => handleSort('category')} className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell cursor-pointer hover:bg-gray-100 group">
              <div className="flex items-center justify-between gap-2">Категорія <SortIcon field="category" sortField={sortField} sortAsc={sortAsc} /></div>
            </th>
            <th onClick={() => handleSort('brand')} className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell cursor-pointer hover:bg-gray-100 group">
              <div className="flex items-center justify-between gap-2">Бренд <SortIcon field="brand" sortField={sortField} sortAsc={sortAsc} /></div>
            </th>
            <th onClick={() => handleSort('price')} className="text-right px-4 py-3 text-gray-500 font-medium cursor-pointer hover:bg-gray-100 group whitespace-nowrap">
              <div className="flex items-center justify-end gap-2"><SortIcon field="price" sortField={sortField} sortAsc={sortAsc} /> Ціна</div>
            </th>
            <th onClick={() => handleSort('usage_days')} className="text-right px-4 py-3 text-gray-500 font-medium hidden md:table-cell cursor-pointer hover:bg-gray-100 group whitespace-nowrap">
              <div className="flex items-center justify-end gap-2"><SortIcon field="usage_days" sortField={sortField} sortAsc={sortAsc} /> Днів викор.</div>
            </th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Супутні</th>
            <th className="text-center px-4 py-3 text-gray-500 font-medium">Увімк.</th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium">Дії</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map(p => (
            <tr key={p.barcode} className={`hover:bg-gray-50 transition-colors ${p.is_active === false ? 'opacity-50' : ''}`}>
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
              <td className="px-4 py-3 text-right text-gray-500 hidden lg:table-cell">{p.cross_sell_barcodes.length}</td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => toggleActive(p)}
                  disabled={toggling === p.barcode}
                  className="relative inline-flex items-center cursor-pointer disabled:cursor-wait"
                  title={p.is_active !== false ? 'Вимкнути' : 'Увімкнути'}
                >
                  <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${p.is_active !== false ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                  <div className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${p.is_active !== false ? 'translate-x-5' : 'translate-x-1'} ${toggling === p.barcode ? 'opacity-50' : ''}`} />
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => setEditingProduct(p)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600"><Edit2 className="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Нічого не знайдено</td></tr>
          )}
        </tbody>
      </table>
      {productsTotalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <span className="text-sm text-gray-500">
            Показано {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, productsTotal)} з {productsTotal} товарів
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Попередня</button>
            <span className="text-sm text-gray-600 font-medium px-2">{page + 1} / {productsTotalPages}</span>
            <button onClick={() => setPage(p => Math.min(productsTotalPages - 1, p + 1))} disabled={page === productsTotalPages - 1} className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Наступна</button>
          </div>
        </div>
      )}
    </div>
  );
}
