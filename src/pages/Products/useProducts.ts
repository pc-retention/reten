import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Product } from '../../types';
import {
  fetchProductsPageRpc,
  fetchProductSummaryRpc,
  fetchProductCategoriesSummaryRpc,
  fetchProductCategoriesListRpc,
  fetchProductBrandsSummaryRpc,
  fetchProductBrandsListRpc,
  rebuildPurchasesForBarcodeRpc,
  refreshClientsDenormalizedRpc,
  updateProductActiveRpc,
  updateProductRpc,
} from '../../lib/serverQueries';
import type { ProductSummary, ProductCategorySummary, ProductBrandSummary, ProductBrandOption, SortField } from './types';

const PAGE_SIZE = 100;
const MAX_VISIBLE_TOASTS = 3;

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

function sortCategorySummary(a: ProductCategorySummary, b: ProductCategorySummary) {
  if (b.product_count !== a.product_count) return b.product_count - a.product_count;
  return a.category.localeCompare(b.category, 'uk');
}

function sortBrandSummary(a: ProductBrandSummary, b: ProductBrandSummary) {
  if (b.product_count !== a.product_count) return b.product_count - a.product_count;
  return a.brand.localeCompare(b.brand, 'uk');
}

function mergeCategorySummary(summaryRows: ProductCategorySummary[], categoryNames: string[]) {
  const summaryMap = new Map(summaryRows.map((row) => [row.category, row]));
  for (const categoryName of categoryNames) {
    if (!summaryMap.has(categoryName)) {
      summaryMap.set(categoryName, { category: categoryName, product_count: 0 });
    }
  }
  return Array.from(summaryMap.values()).sort(sortCategorySummary);
}

function mergeBrandSummary(summaryRows: ProductBrandSummary[], brandRows: ProductBrandOption[]) {
  const summaryMap = new Map(summaryRows.map((row) => [row.brand, row]));
  for (const brandRow of brandRows) {
    const existing = summaryMap.get(brandRow.brand);
    if (!existing) {
      summaryMap.set(brandRow.brand, { brand: brandRow.brand, brand_color: brandRow.brand_color, product_count: 0 });
      continue;
    }
    if (!existing.brand_color && brandRow.brand_color) {
      summaryMap.set(brandRow.brand, { ...existing, brand_color: brandRow.brand_color });
    }
  }
  return Array.from(summaryMap.values()).sort(sortBrandSummary);
}

export function useProducts(tab: string, search: string, categoryFilter: string, brandFilter: string) {
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
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const loadSummary = useCallback(async () => {
    const [summaryRes, categoriesRes, categoriesListRes, brandsRes, brandsListRes] = await Promise.all([
      fetchProductSummaryRpc(),
      fetchProductCategoriesSummaryRpc(),
      fetchProductCategoriesListRpc(),
      fetchProductBrandsSummaryRpc(),
      fetchProductBrandsListRpc(),
    ]);

    const categoryNames = !categoriesListRes.error
      ? categoriesListRes.data.map((item) => item.category)
      : (!categoriesRes.error ? categoriesRes.data.map((item) => item.category) : []);

    const brandRows = !brandsListRes.error
      ? brandsListRes.data
      : (!brandsRes.error
        ? brandsRes.data.map((item) => ({ brand: item.brand, brand_color: item.brand_color }))
        : []);

    setSummary((prev) => ({
      activeCount: summaryRes.data?.active_count ?? prev.activeCount,
      inactiveCount: summaryRes.data?.inactive_count ?? prev.inactiveCount,
      unknownCount: summaryRes.data?.unknown_count ?? prev.unknownCount,
      categoriesCount: !categoriesListRes.error
        ? categoryNames.length
        : (summaryRes.data?.categories_count ?? prev.categoriesCount),
      brandsCount: !brandsListRes.error
        ? brandRows.length
        : (summaryRes.data?.brands_count ?? prev.brandsCount),
    }));

    if (!categoriesRes.error || categoryNames.length > 0) {
      setCategorySummary(mergeCategorySummary(categoriesRes.error ? [] : categoriesRes.data, categoryNames));
    }
    if (categoryNames.length > 0 || !categoriesListRes.error) {
      setCategories(categoryNames);
    }
    if (!brandsRes.error || brandRows.length > 0) {
      setBrandSummary(mergeBrandSummary(brandsRes.error ? [] : brandsRes.data, brandRows));
    }
    if (brandRows.length > 0 || !brandsListRes.error) {
      setBrands(brandRows);
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
    setProducts(result.data.map(({ total_count: _, ...product }) => product));
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
    setInactiveProducts(inactiveRes.data.map(({ total_count: _, ...product }) => product));
    setInactiveTotal(inactiveRes.data[0]?.total_count ?? 0);
    setLoading(false);
  }, [inactivePage, search, categoryFilter, brandFilter]);

  const refreshCurrentTab = useCallback(async () => {
    await loadSummary();
    if (tab === 'products') {
      await loadActiveProducts();
    } else if (tab === 'inactive') {
      await loadInactiveProducts();
    }
  }, [tab, loadSummary, loadActiveProducts, loadInactiveProducts]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(0);
    setInactivePage(0);
  }, [search, categoryFilter, brandFilter, tab]);

  useEffect(() => {
    if (tab === 'products') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadActiveProducts();
      return;
    }
    if (tab === 'inactive') {
      void loadInactiveProducts();
      return;
    }
    setLoading(false);
  }, [tab, loadActiveProducts, loadInactiveProducts]);

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

    const { data: affected, error } = await updateProductActiveRpc(product.barcode, newVal);

    if (error) {
      console.error('toggleActive RPC error:', error);
      pushToastId(toast.error(`Помилка: ${error.message}`));
      setProducts(previousProducts);
      setInactiveProducts(previousInactiveProducts);
      setSummary(previousSummary);
      setProductsTotal(previousProductsTotal);
      setInactiveTotal(previousInactiveTotal);
      if (editingProduct?.barcode === product.barcode) setEditingProduct(product);
    } else if (affected === 0) {
      console.error('toggleActive: 0 rows affected, barcode =', product.barcode);
      pushToastId(toast.error(`Товар не знайдено в базі (barcode: ${product.barcode})`));
      setProducts(previousProducts);
      setInactiveProducts(previousInactiveProducts);
      setSummary(previousSummary);
      setProductsTotal(previousProductsTotal);
      setInactiveTotal(previousInactiveTotal);
      if (editingProduct?.barcode === product.barcode) setEditingProduct(product);
    } else {
      pushToastId(toast.success(newVal ? `"${product.name}" увімкнено` : `"${product.name}" вимкнено`));
      if (newVal) {
        void rebuildPurchasesForBarcodeRpc(product.barcode);
        void loadActiveProducts();
      } else {
        void loadInactiveProducts();
      }
      void refreshClientsDenormalizedRpc();
      void loadSummary();
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
    const normalizedImageUrl = editingProduct.image_url ?? null;

    const { error } = await updateProductRpc({
      barcode:   editingProduct.barcode,
      name:      editingProduct.name,
      category:  normalizedCategory,
      brand:     normalizedBrand,
      price:     editingProduct.price,
      usageDays: editingProduct.usage_days,
      imageUrl:  normalizedImageUrl,
    });

    if (error) {
      toast.error('Помилка збереження');
    } else {
      toast.success('Товар оновлено');
      setEditingProduct(null);
      await refreshCurrentTab();
    }
    setSaving(false);
  }

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }, [sortField]);

  const productsTotalPages = Math.ceil(productsTotal / PAGE_SIZE);
  const inactiveTotalPages = Math.ceil(inactiveTotal / PAGE_SIZE);

  return {
    products,
    inactiveProducts,
    categorySummary,
    brandSummary,
    categories,
    brands,
    summary,
    productsTotal,
    inactiveTotal,
    loading,
    toggling,
    editingProduct,
    setEditingProduct,
    saving,
    page,
    setPage,
    inactivePage,
    setInactivePage,
    sortField,
    sortAsc,
    productsTotalPages,
    inactiveTotalPages,
    PAGE_SIZE,
    toggleActive,
    saveProduct,
    handleSort,
    getResolvedBrandColor,
    refreshCurrentTab,
    loadSummary,
  };
}
