import { useState } from 'react';
import toast from 'react-hot-toast';
import type { Product } from '../../types';
import { DEFAULT_BADGE_ALPHA, DEFAULT_BADGE_HEX, hexToAlphaHex } from '../../lib/colors';
import {
  createProductBrandRpc,
  createProductCategoryRpc,
  deleteProductBrandRpc,
  deleteProductCategoryRpc,
  renameProductBrandRpc,
  renameProductCategoryRpc,
} from '../../lib/serverQueries';
import type { ProductCategorySummary, ProductBrandSummary } from './types';

interface UseTaxonomyOptions {
  refreshCurrentTab: () => Promise<void>;
  loadSummary: () => Promise<void>;
  categorySummary: ProductCategorySummary[];
  brandSummary: ProductBrandSummary[];
  categoryFilter: string;
  brandFilter: string;
  setCategoryFilter: (v: string) => void;
  setBrandFilter: (v: string) => void;
  editingProduct: Product | null;
  setEditingProduct: (p: Product | null) => void;
}

export function useTaxonomy({
  refreshCurrentTab,
  loadSummary,
  categorySummary,
  brandSummary,
  categoryFilter,
  brandFilter,
  setCategoryFilter,
  setBrandFilter,
  editingProduct,
  setEditingProduct,
}: UseTaxonomyOptions) {
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
      if (categoryFilter === oldName) setCategoryFilter(newName);
      if (editingProduct?.category === oldName) setEditingProduct({ ...editingProduct, category: newName });
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
      if (categoryFilter === categoryName) setCategoryFilter('all');
      if (editingProduct?.category === categoryName) setEditingProduct({ ...editingProduct, category: null });
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
    const { error } = await renameProductBrandRpc(oldName, newName, hexToAlphaHex(brandDraftHex, brandDraftOpacity / 100));
    if (error) {
      toast.error('Не вдалося завершити перейменування бренду');
    } else {
      toast.success('Бренд оновлено');
      setEditingBrandName(null);
      setBrandDraft('');
      if (brandFilter === oldName) setBrandFilter(newName);
      if (editingProduct?.brand === oldName) setEditingProduct({ ...editingProduct, brand: newName });
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
      if (brandFilter === brandName) setBrandFilter('all');
      if (editingProduct?.brand === brandName) setEditingProduct({ ...editingProduct, brand: null });
      await refreshCurrentTab();
    }
    setCategorySaving(false);
  }

  return {
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
  };
}
