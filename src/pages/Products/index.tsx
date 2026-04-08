import { useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { useProducts } from './useProducts';
import { useTaxonomy } from './useTaxonomy';
import { ProductsTable } from './ProductsTable';
import { InactiveProductsTable } from './InactiveProductsTable';
import { TaxonomyTab } from './TaxonomyTab';
import { ProductModal } from './ProductModal';
import type { ProductTab } from './types';

export default function ProductsPage() {
  const [tab, setTab] = useState<ProductTab>('products');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');

  const productsState = useProducts(tab, search, categoryFilter, brandFilter);
  const taxonomyState = useTaxonomy({
    refreshCurrentTab: productsState.refreshCurrentTab,
    loadSummary: productsState.loadSummary,
    categorySummary: productsState.categorySummary,
    brandSummary: productsState.brandSummary,
    categoryFilter,
    brandFilter,
    setCategoryFilter,
    setBrandFilter,
    editingProduct: productsState.editingProduct,
    setEditingProduct: productsState.setEditingProduct,
  });

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
          <Package className="w-4 h-4 inline mr-1.5" />Активні Товари ({productsState.summary.activeCount})
        </button>
        <button onClick={() => setTab('inactive')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${tab === 'inactive' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          Вимкнені Товари ({productsState.summary.inactiveCount})
        </button>
        <button onClick={() => setTab('categories')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${tab === 'categories' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          Категорії ({productsState.summary.categoriesCount})
        </button>
        <button onClick={() => setTab('brands')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${tab === 'brands' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          Бренди ({productsState.summary.brandsCount})
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
              {productsState.categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="all">Всі бренди</option>
              {productsState.brands.map((brand) => <option key={brand.brand} value={brand.brand}>{brand.brand}</option>)}
            </select>
          </>
        )}
      </div>

      {productsState.loading ? (
        <div className="text-center py-20 text-gray-400">Завантаження...</div>
      ) : tab === 'products' ? (
        <ProductsTable
          products={productsState.products}
          page={productsState.page}
          productsTotalPages={productsState.productsTotalPages}
          productsTotal={productsState.productsTotal}
          PAGE_SIZE={productsState.PAGE_SIZE}
          toggling={productsState.toggling}
          sortField={productsState.sortField}
          sortAsc={productsState.sortAsc}
          handleSort={productsState.handleSort}
          toggleActive={productsState.toggleActive}
          setEditingProduct={productsState.setEditingProduct}
          getResolvedBrandColor={productsState.getResolvedBrandColor}
          setPage={productsState.setPage}
        />
      ) : tab === 'inactive' ? (
        <InactiveProductsTable
          inactiveProducts={productsState.inactiveProducts}
          inactivePage={productsState.inactivePage}
          inactiveTotalPages={productsState.inactiveTotalPages}
          inactiveTotal={productsState.inactiveTotal}
          PAGE_SIZE={productsState.PAGE_SIZE}
          toggling={productsState.toggling}
          toggleActive={productsState.toggleActive}
          setEditingProduct={productsState.setEditingProduct}
          getResolvedBrandColor={productsState.getResolvedBrandColor}
          setInactivePage={productsState.setInactivePage}
        />
      ) : (tab === 'categories' || tab === 'brands') ? (
        <TaxonomyTab
          tab={tab}
          categorySummary={productsState.categorySummary}
          brandSummary={productsState.brandSummary}
          {...taxonomyState}
        />
      ) : null}

      {productsState.editingProduct && (
        <ProductModal
          editingProduct={productsState.editingProduct}
          setEditingProduct={productsState.setEditingProduct}
          saveProduct={productsState.saveProduct}
          categories={productsState.categories}
          brands={productsState.brands}
          saving={productsState.saving}
        />
      )}
    </div>
  );
}
