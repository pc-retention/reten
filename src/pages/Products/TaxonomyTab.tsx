import { Edit2, Trash2, FolderPlus } from 'lucide-react';
import { getBadgeTextColor, hexToAlphaHex, parseAlphaHex } from '../../lib/colors';
import type { ProductCategorySummary, ProductBrandSummary } from './types';

interface TaxonomyTabProps {
  tab: 'categories' | 'brands';
  categorySummary: ProductCategorySummary[];
  brandSummary: ProductBrandSummary[];
  newCategoryName: string;
  setNewCategoryName: (v: string) => void;
  newBrandName: string;
  setNewBrandName: (v: string) => void;
  newBrandHex: string;
  setNewBrandHex: (v: string) => void;
  newBrandOpacity: number;
  setNewBrandOpacity: (v: number) => void;
  categorySaving: boolean;
  editingCategoryName: string | null;
  setEditingCategoryName: (v: string | null) => void;
  categoryDraft: string;
  setCategoryDraft: (v: string) => void;
  editingBrandName: string | null;
  setEditingBrandName: (v: string | null) => void;
  brandDraft: string;
  setBrandDraft: (v: string) => void;
  brandDraftHex: string;
  setBrandDraftHex: (v: string) => void;
  brandDraftOpacity: number;
  setBrandDraftOpacity: (v: number) => void;
  createCategory: (e: React.FormEvent) => Promise<void>;
  createBrand: (e: React.FormEvent) => Promise<void>;
  saveCategoryRename: () => Promise<void>;
  deleteCategory: (categoryName: string) => Promise<void>;
  saveBrandRename: () => Promise<void>;
  deleteBrand: (brandName: string) => Promise<void>;
}

export function TaxonomyTab({
  tab,
  categorySummary,
  brandSummary,
  newCategoryName,
  setNewCategoryName,
  newBrandName,
  setNewBrandName,
  newBrandHex,
  setNewBrandHex,
  newBrandOpacity,
  setNewBrandOpacity,
  categorySaving,
  editingCategoryName,
  setEditingCategoryName,
  categoryDraft,
  setCategoryDraft,
  editingBrandName,
  setEditingBrandName,
  brandDraft,
  setBrandDraft,
  brandDraftHex,
  setBrandDraftHex,
  brandDraftOpacity,
  setBrandDraftOpacity,
  createCategory,
  createBrand,
  saveCategoryRename,
  deleteCategory,
  saveBrandRename,
  deleteBrand,
}: TaxonomyTabProps) {
  if (tab === 'categories') {
    return (
      <div className="space-y-6">
        <form onSubmit={createCategory} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Нова категорія</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Наприклад, Гелі"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={categorySaving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
              <FolderPlus className="w-4 h-4" /> Створити категорію
            </button>
          </div>
        </form>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Категорія</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Кількість товарів</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categorySummary.map((item) => {
                const isEditing = editingCategoryName === item.category;
                return (
                  <tr key={item.category} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={categoryDraft}
                          onChange={(e) => setCategoryDraft(e.target.value)}
                          className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : item.category}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{item.product_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button onClick={() => void saveCategoryRename()} disabled={categorySaving} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                              Зберегти
                            </button>
                            <button onClick={() => { setEditingCategoryName(null); setCategoryDraft(''); }} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                              Скасувати
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingCategoryName(item.category); setCategoryDraft(item.category); }} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => void deleteCategory(item.category)} className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {categorySummary.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Немає категорій</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createBrand} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Новий бренд</label>
          <input
            type="text"
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            placeholder="Наприклад, Shelly"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="sm:w-44">
          <label className="block text-sm font-medium text-gray-700 mb-1">Колір</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newBrandHex}
              onChange={(e) => setNewBrandHex(e.target.value)}
              className="h-10 w-14 border border-gray-300 rounded-lg bg-white p-1"
            />
            <div
              className="h-10 flex-1 rounded-lg border border-gray-200"
              style={{ backgroundColor: hexToAlphaHex(newBrandHex, newBrandOpacity / 100) }}
            />
          </div>
        </div>
        <div className="sm:w-40">
          <label className="block text-sm font-medium text-gray-700 mb-1">Прозорість</label>
          <input
            type="range"
            min="5"
            max="100"
            value={newBrandOpacity}
            onChange={(e) => setNewBrandOpacity(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-gray-500 mt-1">{newBrandOpacity}%</div>
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={categorySaving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
            <FolderPlus className="w-4 h-4" /> Створити бренд
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Бренд</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Кількість товарів</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {brandSummary.map((item) => {
              const isEditing = editingBrandName === item.brand;
              return (
                <tr key={item.brand} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {isEditing ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={brandDraft}
                          onChange={(e) => setBrandDraft(e.target.value)}
                          className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="color"
                          value={brandDraftHex}
                          onChange={(e) => setBrandDraftHex(e.target.value)}
                          className="h-10 w-14 border border-gray-300 rounded-lg bg-white p-1"
                        />
                        <div className="w-28">
                          <input
                            type="range"
                            min="5"
                            max="100"
                            value={brandDraftOpacity}
                            onChange={(e) => setBrandDraftOpacity(Number(e.target.value))}
                            className="w-full"
                          />
                          <div className="text-xs text-gray-500">{brandDraftOpacity}%</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-sm"
                          style={{
                            backgroundColor: item.brand_color || '#F3F4F6',
                            color: getBadgeTextColor(item.brand_color),
                          }}
                        >
                          {item.brand}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{item.product_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button onClick={() => void saveBrandRename()} disabled={categorySaving} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                            Зберегти
                          </button>
                          <button onClick={() => { setEditingBrandName(null); setBrandDraft(''); }} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                            Скасувати
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => {
                            const parsed = parseAlphaHex(item.brand_color);
                            setEditingBrandName(item.brand);
                            setBrandDraft(item.brand);
                            setBrandDraftHex(parsed.hex);
                            setBrandDraftOpacity(Math.round(parsed.opacity * 100));
                          }} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => void deleteBrand(item.brand)} className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {brandSummary.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Немає брендів</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
