import { X } from 'lucide-react';
import type { Product } from '../../types';
import type { ProductBrandOption } from './types';

interface Props {
  editingProduct: Product;
  setEditingProduct: (product: Product | null) => void;
  saveProduct: (e: React.FormEvent) => Promise<void>;
  categories: string[];
  brands: ProductBrandOption[];
  saving: boolean;
}

export function ProductModal({ editingProduct, setEditingProduct, saveProduct, categories, brands, saving }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-900">Редагувати товар</h3>
          <button type="button" onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={saveProduct} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Назва</label>
            <input required type="text" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Категорія</label>
            <select
              value={editingProduct.category || ''}
              onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Без категорії</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Бренд</label>
            <select
              value={editingProduct.brand || ''}
              onChange={e => setEditingProduct({ ...editingProduct, brand: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Без бренду</option>
              {brands.map((brand) => <option key={brand.brand} value={brand.brand}>{brand.brand}</option>)}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ціна (грн)</label>
              <input required type="number" min="0" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Днів використання</label>
              <input required type="number" min="1" value={editingProduct.usage_days} onChange={e => setEditingProduct({ ...editingProduct, usage_days: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Фото (URL)</label>
            <input type="text" placeholder="https://" value={editingProduct.image_url || ''} onChange={e => setEditingProduct({ ...editingProduct, image_url: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition">Скасувати</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">{saving ? 'Збереження...' : 'Зберегти'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
