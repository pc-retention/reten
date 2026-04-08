export type ProductTab = 'products' | 'inactive' | 'categories' | 'brands';

export type ProductCategorySummary = {
  category: string;
  product_count: number;
};

export type ProductBrandSummary = {
  brand: string;
  product_count: number;
  brand_color: string | null;
};

export type ProductBrandOption = {
  brand: string;
  brand_color: string | null;
};

export type ProductSummary = {
  activeCount: number;
  inactiveCount: number;
  unknownCount: number;
  categoriesCount: number;
  brandsCount: number;
};

export type SortField = 'barcode' | 'name' | 'category' | 'brand' | 'price' | 'usage_days';
