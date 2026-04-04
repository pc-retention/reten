import { useState } from 'react';
import { Package, AlertTriangle, Plus, Edit2, Trash2 } from 'lucide-react';
import { products, unknownBarcodes } from '../lib/testData';

export default function ProductsPage() {
  const [tab, setTab] = useState<'products' | 'unknown'>('products');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Товари</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
          <Plus className="w-4 h-4" /> Додати товар
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setTab('products')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${tab === 'products' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          <Package className="w-4 h-4 inline mr-1.5" />Товари ({products.length})
        </button>
        <button onClick={() => setTab('unknown')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${tab === 'unknown' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          <AlertTriangle className="w-4 h-4 inline mr-1.5" />Невідомі ({unknownBarcodes.length})
        </button>
      </div>

      {tab === 'products' ? (
        <>
          <div className="flex flex-wrap gap-3">
            <input
              type="text" placeholder="Пошук за назвою або штрихкодом..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
              <option value="all">Всі категорії</option>
              {categories.map(c => <option key={c} value={c!}>{c}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Штрихкод</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Назва</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Категорія</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Ціна</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Днів використання</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Супутні</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.barcode} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.barcode}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{p.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{p.price} грн</td>
                    <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{p.usage_days} д.</td>
                    <td className="px-4 py-3 text-right text-gray-500 hidden lg:table-cell">{p.cross_sell_barcodes.length}</td>
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
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Штрихкод</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Приклад назви</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Кількість</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Перше виявлення</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {unknownBarcodes.map(b => (
                <tr key={b.barcode} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.barcode}</td>
                  <td className="px-4 py-3 text-gray-700">{b.sample_name || '-'}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{b.seen_count}</td>
                  <td className="px-4 py-3 text-gray-500">{b.first_seen_at.split('T')[0]}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100">
                      Додати як товар
                    </button>
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
