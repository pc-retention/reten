import { useCallback, useEffect, useState } from 'react';
import { Package, Plus, Edit2, Trash2, X, ArrowUp, ArrowDown, ArrowUpDown, FolderPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import { DEFAULT_BADGE_ALPHA, DEFAULT_BADGE_HEX, getBadgeTextColor, hexToAlphaHex, parseAlphaHex } from '../lib/colors';
import {
  createProductBrandRpc,
  createProductCategoryRpc,
  deleteProductBrandRpc,
  deleteProductCategoryRpc,
  fetchProductBrandsListRpc,
  fetchProductBrandsSummaryRpc,
  fetchProductCategoriesListRpc,
  fetchProductCategoriesSummaryRpc,
  fetchProductsPageRpc,
  fetchProductSummaryRpc,
  rebuildPurchasesForBarcodeRpc,
  refreshClientsDenormalizedRpc,
  renameProductBrandRpc,
  renameProductCategoryRpc,
} from '../lib/serverQueries';

const PAGE_SIZE = 100;
const MAX_VISIBLE_TOASTS = 3;

type ProductCategorySummary = {
  category: string;
  product_count: number;
};

type ProductBrandSummary = {
  brand: string;
  product_count: number;
  brand_color: string | null;
};

type ProductBrandOption = {
  brand: string;
  brand_color: string | null;
};

type ProductSummary = {
  activeCount: number;
  inactiveCount: number;
  unknownCount: number;
  categoriesCount: number;
  brandsCount: number;
};

const emptySummary: ProductSummary = {
  activeCount: 0,
  inactiveCount: 0,
  unknownCount: 0,
  categoriesCount: 0,
  brandsCount: 0,
};

const recentToastIds: string[] = [];

function pushToastId(toastId: string) {
  recentToastIds.push(toastId);

  while (recentToastIds.length > MAX_VISIBLE_TOASTS) {
    const oldestToastId = recentToastIds.shift();
    if (oldestToastId) {
      toast.dismiss(oldestToastId);
    }
  }
}

export default function ProductsPage() {
  const [tab, setTab] = useState<'products' | 'inactive' | 'categories' | 'brands'>('products');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [inactiveProducts, setInactiveProducts] = useState<Product[]>([]);
  const [categorySummary, setCategorySummary] = useState<ProductCategorySummary[]>([]);
  const [brandSummary, setBrandSummary] = useState<ProductBrandSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<ProductBrandOption[]>([]);
  const [summary, setSummary] = useState<ProductSummary>(emptySummary);
  const [productsTotal, setProductsTotal] = useState(0);
  const [inactiveTotal, setInactiveTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [inactivePage, setInactivePage] = useState(0);
  const [sortField, setSortField] = useState<'barcode' | 'name' | 'category' | 'brand' | 'price' | 'usage_days'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandHex, setNewBrandHex] = useState(DEFAULT_BADGE_HEX);
  const [newBrandOpacity, setNewBrandOpacity] = useState(Math.round(DEFAULT_BADGE_ALPHA * 100));
  const [categorySaving, setCategorySaving] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState('');
  const [editingBrandName, setEditingBrandName] = useState<string | null>(null);
  const [brandDraft, setBrandDraft] = useState('');
  const [brandDraftHex, setBrandDraftHex] = useState(DEFAULT_BADGE_HEX);
  const [brandDraftOpacity, setBrandDraftOpacity] = useState(Math.round(DEFAULT_BADGE_ALPHA * 100));

  const loadSummary = useCallback(async () => {
    const [summaryRes, categoriesRes, categoriesListRes, brandsRes, brandsListRes] = await Promise.all([
      fetchProductSummaryRpc(),
      fetchProductCategoriesSummaryRpc(),
      fetchProductCategoriesListRpc(),
      fetchProductBrandsSummaryRpc(),
      fetchProductBrandsListRpc(),
    ]);

    if (!summaryRes.error && summaryRes.data) {
      setSummary({
        activeCount: summaryRes.data.active_count ?? 0,
        inactiveCount: summaryRes.data.inactive_count ?? 0,
        unknownCount: summaryRes.data.unknown_count ?? 0,
        categoriesCount: summaryRes.data.categories_count ?? 0,
        brandsCount: summaryRes.data.brands_count ?? 0,
      });
    }

    if (!categoriesRes.error) {
      setCategorySummary(categoriesRes.data);
    }

    if (!categoriesListRes.error) {
      setCategories(categoriesListRes.data.map((item) => item.category));
    }

    if (!brandsRes.error) {
      setBrandSummary(brandsRes.data);
    }

    if (!brandsListRes.error) {
      setBrands(brandsListRes.data);
    }
  }, []);

  const getResolvedBrandColor = useCallback((brandName: string | null | undefined, rowColor?: string | null) => {
    if (rowColor) return rowColor;
    if (!brandName) return null;
    return brands.find((item) => item.brand === brandName)?.brand_color ?? null;
  }, [brands]);

  const loadActiveProducts = useCallback(async () => {
    setLoading(true);
    const result = await fetchProductsPageRpc({
      page,
      pageSize: PAGE_SIZE,
      search,
      categoryFilter,
      brandFilter,
      activeOnly: true,
      sortField,
      sortAsc,
    });

    setProducts(result.data.map(({ total_count: _totalCount, ...product }) => product));
    setProductsTotal(result.data[0]?.total_count ?? 0);
    setLoading(false);
  }, [page, search, categoryFilter, brandFilter, sortField, sortAsc]);

  const loadInactiveProducts = useCallback(async () => {
    setLoading(true);
    const inactiveRes = await fetchProductsPageRpc({
      page: inactivePage,
      pageSize: PAGE_SIZE,
      search,
      categoryFilter,
      brandFilter,
      activeOnly: false,
      sortField: 'name',
      sortAsc: true,
    });

    setInactiveProducts(inactiveRes.data.map(({ total_count: _totalCount, ...product }) => product));
    setInactiveTotal(inactiveRes.data[0]?.total_count ?? 0);
    setLoading(false);
  }, [inactivePage, search, categoryFilter, brandFilter]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    setPage(0);
    setInactivePage(0);
  }, [search, categoryFilter, brandFilter, tab]);

  useEffect(() => {
    if (tab === 'products') {
      void loadActiveProducts();
      return;
    }

    if (tab === 'inactive') {
      void loadInactiveProducts();
      return;
    }

    setLoading(false);
  }, [tab, loadActiveProducts, loadInactiveProducts]);

  async function refreshCurrentTab() {
    await loadSummary();
    if (tab === 'products') {
      await loadActiveProducts();
    } else if (tab === 'inactive') {
      await loadInactiveProducts();
    }
  }

  async function toggleActive(product: Product) {
    setToggling(product.barcode);
    const newVal = !(product.is_active ?? true);

    const previousProducts = products;
    const previousInactiveProducts = inactiveProducts;
    const previousSummary = summary;
    const previousProductsTotal = productsTotal;
    const previousInactiveTotal = inactiveTotal;
    const nextProduct = { ...product, is_active: newVal };

    if (newVal) {
      setInactiveProducts((prev) => prev.filter((item) => item.barcode !== product.barcode));
      setInactiveTotal((prev) => Math.max(0, prev - 1));
    } else {
      setProducts((prev) => prev.filter((item) => item.barcode !== product.barcode));
      setProductsTotal((prev) => Math.max(0, prev - 1));
    }

    setSummary((prev) => ({
      ...prev,
      activeCount: Math.max(0, prev.activeCount + (newVal ? 1 : -1)),
      inactiveCount: Math.max(0, prev.inactiveCount + (newVal ? -1 : 1)),
    }));

    if (editingProduct?.barcode === product.barcode) {
      setEditingProduct(nextProduct);
    }

    const { error } = await supabase
      .from('products')
      .update({ is_active: newVal })
      .eq('barcode', product.barcode);

    if (error) {
      pushToastId(toast.error('Помилка оновлення. Переконайтесь що колонка is_active існує в БД.'));
      setProducts(previousProducts);
      setInactiveProducts(previousInactiveProducts);
      setSummary(previousSummary);
      setProductsTotal(previousProductsTotal);
      setInactiveTotal(previousInactiveTotal);
      if (editingProduct?.barcode === product.barcode) {
        setEditingProduct(product);
      }
    } else {
      if (newVal) {
        const purchasesRefreshResult = await rebuildPurchasesForBarcodeRpc(product.barcode);
        if (purchasesRefreshResult.error) {
          pushToastId(toast.error('Товар увімкнено, але не вдалося добудувати нагадування'));
        }
      }

      const refreshResult = await refreshClientsDenormalizedRpc();
      if (refreshResult.error) {
        pushToastId(toast.error('Товар оновлено, але не вдалося перерахувати клієнтів'));
      } else {
        pushToastId(toast.success(newVal ? `"${product.name}" увімкнено` : `"${product.name}" вимкнено`));
      }
    }
    setToggling(null);
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;
    setSaving(true);

    const normalizedCategory = editingProduct.category && editingProduct.category.trim() !== ''
      ? editingProduct.category.trim()
      : null;
    const normalizedBrand = editingProduct.brand && editingProduct.brand.trim() !== ''
      ? editingProduct.brand.trim()
      : null;

    const { error } = await supabase
      .from('products')
      .update({
        name: editingProduct.name,
        category: normalizedCategory,
        brand: normalizedBrand,
        price: editingProduct.price,
        usage_days: editingProduct.usage_days,
        image_url: editingProduct.image_url,
      })
      .eq('barcode', editingProduct.barcode);

    if (error) {
      toast.error('Помилка збереження');
    } else {
      toast.success('Товар оновлено');
      setEditingProduct(null);
      await refreshCurrentTab();
    }
    setSaving(false);
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    const categoryName = newCategoryName.trim();
    if (!categoryName) return;

    setCategorySaving(true);
    const { error } = await createProductCategoryRpc(categoryName);

    if (error) {
      toast.error('Не вдалося створити категорію');
    } else {
      toast.success('Категорію створено');
      setNewCategoryName('');
      await loadSummary();
    }
    setCategorySaving(false);
  }

  async function createBrand(e: React.FormEvent) {
    e.preventDefault();
    const brandName = newBrandName.trim();
    if (!brandName) return;
    const brandColor = hexToAlphaHex(newBrandHex, newBrandOpacity / 100);

    setCategorySaving(true);
    const { error } = await createProductBrandRpc(brandName, brandColor);

    if (error) {
      toast.error('Не вдалося створити бренд');
    } else {
      toast.success('Бренд створено');
      setNewBrandName('');
      setNewBrandHex(DEFAULT_BADGE_HEX);
      setNewBrandOpacity(Math.round(DEFAULT_BADGE_ALPHA * 100));
      await loadSummary();
    }
    setCategorySaving(false);
  }

  async function saveCategoryRename() {
    if (!editingCategoryName) return;
    const oldName = editingCategoryName;
    const newName = categoryDraft.trim();

    if (!newName) {
      toast.error('Назва категорії не може бути порожньою');
      return;
    }

    if (newName === oldName) {
      setEditingCategoryName(null);
      setCategoryDraft('');
      return;
    }

    setCategorySaving(true);

    const { error } = await renameProductCategoryRpc(oldName, newName);

    if (error) {
      toast.error('Не вдалося завершити перейменування категорії');
    } else {
      toast.success('Категорію оновлено');
      setEditingCategoryName(null);
      setCategoryDraft('');
      if (categoryFilter === oldName) {
        setCategoryFilter(newName);
      }
      if (editingProduct?.category === oldName) {
        setEditingProduct({ ...editingProduct, category: newName });
      }
      await refreshCurrentTab();
    }

    setCategorySaving(false);
  }

  async function deleteCategory(categoryName: string) {
    const isUsed = categorySummary.find((item) => item.category === categoryName)?.product_count ?? 0;
    const confirmed = window.confirm(
      isUsed > 0
        ? `Видалити категорію "${categoryName}" і прибрати її у ${isUsed} товарів?`
        : `Видалити категорію "${categoryName}"?`,
    );

    if (!confirmed) return;

    setCategorySaving(true);

    const { error } = await deleteProductCategoryRpc(categoryName);

    if (error) {
      toast.error('Не вдалося видалити категорію');
    } else {
      toast.success('Категорію видалено');
      if (categoryFilter === categoryName) {
        setCategoryFilter('all');
      }
      if (editingProduct?.category === categoryName) {
        setEditingProduct({ ...editingProduct, category: null });
      }
      await refreshCurrentTab();
    }

    setCategorySaving(false);
  }

  async function saveBrandRename() {
    if (!editingBrandName) return;
    const oldName = editingBrandName;
    const newName = brandDraft.trim();

    if (!newName) {
      toast.error('Назва бренду не може бути порожньою');
      return;
    }

    if (newName === oldName) {
      setEditingBrandName(null);
      setBrandDraft('');
      return;
    }

    setCategorySaving(true);

    const { error } = await renameProductBrandRpc(
      oldName,
      newName,
      hexToAlphaHex(brandDraftHex, brandDraftOpacity / 100),
    );

    if (error) {
      toast.error('Не вдалося завершити перейменування бренду');
    } else {
      toast.success('Бренд оновлено');
      setEditingBrandName(null);
      setBrandDraft('');
      if (brandFilter === oldName) {
        setBrandFilter(newName);
      }
      if (editingProduct?.brand === oldName) {
        setEditingProduct({ ...editingProduct, brand: newName });
      }
      await refreshCurrentTab();
    }

    setCategorySaving(false);
  }

  async function deleteBrand(brandName: string) {
    const isUsed = brandSummary.find((item) => item.brand === brandName)?.product_count ?? 0;
    const confirmed = window.confirm(
      isUsed > 0
        ? `Видалити бренд "${brandName}" і прибрати його у ${isUsed} товарів?`
        : `Видалити бренд "${brandName}"?`,
    );

    if (!confirmed) return;

    setCategorySaving(true);

    const { error } = await deleteProductBrandRpc(brandName);

    if (error) {
      toast.error('Не вдалося видалити бренд');
    } else {
      toast.success('Бренд видалено');
      if (brandFilter === brandName) {
        setBrandFilter('all');
      }
      if (editingProduct?.brand === brandName) {
        setEditingProduct({ ...editingProduct, brand: null });
      }
      await refreshCurrentTab();
    }

    setCategorySaving(false);
  }

  const handleSort = (field: 'barcode' | 'name' | 'category' | 'brand' | 'price' | 'usage_days') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const SortIcon = ({ field }: { field: 'barcode' | 'name' | 'category' | 'brand' | 'price' | 'usage_days' }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortAsc ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />;
  };

  const productsTotalPages = Math.ceil(productsTotal / PAGE_SIZE);
  const inactiveTotalPages = Math.ceil(inactiveTotal / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Товари</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
          <Plus className="w-4 h-4" /> Додати товар
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setTab('products')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${tab === 'products' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          <Package className="w-4 h-4 inline mr-1.5" />Активні Товари ({summary.activeCount})
        </button>
        <button onClick={() => setTab('inactive')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${tab === 'inactive' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          Вимкнені Товари ({summary.inactiveCount})
        </button>
        <button onClick={() => setTab('categories')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${tab === 'categories' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          Категорії ({summary.categoriesCount})
        </button>
        <button onClick={() => setTab('brands')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${tab === 'brands' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          Бренди ({summary.brandsCount})
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Пошук за назвою або штрихкодом..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {(tab === 'products' || tab === 'inactive') && (
          <>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="all">Всі категорії</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="all">Всі бренди</option>
              {brands.map((brand) => <option key={brand.brand} value={brand.brand}>{brand.brand}</option>)}
            </select>
          </>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Завантаження...</div>
      ) : tab === 'products' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th onClick={() => handleSort('barcode')} className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer hover:bg-gray-100 group">
                  <div className="flex items-center justify-between gap-2">Штрихкод <SortIcon field="barcode" /></div>
                </th>
                <th onClick={() => handleSort('name')} className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer hover:bg-gray-100 group">
                  <div className="flex items-center justify-between gap-2">Назва <SortIcon field="name" /></div>
                </th>
                <th onClick={() => handleSort('category')} className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell cursor-pointer hover:bg-gray-100 group">
                  <div className="flex items-center justify-between gap-2">Категорія <SortIcon field="category" /></div>
                </th>
                <th onClick={() => handleSort('brand')} className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell cursor-pointer hover:bg-gray-100 group">
                  <div className="flex items-center justify-between gap-2">Бренд <SortIcon field="brand" /></div>
                </th>
                <th onClick={() => handleSort('price')} className="text-right px-4 py-3 text-gray-500 font-medium cursor-pointer hover:bg-gray-100 group whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2"><SortIcon field="price" /> Ціна</div>
                </th>
                <th onClick={() => handleSort('usage_days')} className="text-right px-4 py-3 text-gray-500 font-medium hidden md:table-cell cursor-pointer hover:bg-gray-100 group whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2"><SortIcon field="usage_days" /> Днів викор.</div>
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
      ) : tab === 'inactive' ? (
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
      ) : tab === 'categories' ? (
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
      ) : (
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
      )}

      {editingProduct && (
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
      )}
    </div>
  );
}
