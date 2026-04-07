import { supabase } from './supabase';
import type { AutomationQueueItem, Campaign, Client, ClientOrder, ClientPurchase, CohortSnapshot, CommunicationLog, CommunicationTemplate, LoyaltyTransaction, MetricsDaily, OrderListItem, Product, Setting, UnknownBarcode, WinBackCandidate } from '../types';

export type ClientListRow = Client & {
  total_count: number;
};

export type ReminderRpcRow = ClientPurchase & {
  client_name: string | null;
  client_phone: string | null;
};

export type ProductListRow = Product & {
  total_count: number;
};

export type UnknownBarcodeRow = UnknownBarcode & {
  total_count: number;
};

export interface ProductSummaryRow {
  active_count: number;
  inactive_count: number;
  unknown_count: number;
  categories_count: number;
  brands_count: number;
}

export interface ProductCategorySummaryRow {
  category: string;
  product_count: number;
}

export interface ProductCategoryRow {
  category: string;
}

export interface ProductBrandSummaryRow {
  brand: string;
  product_count: number;
  brand_color: string | null;
}

export interface ProductBrandRow {
  brand: string;
  brand_color: string | null;
}

export interface RfmSegmentRow {
  segment_name: string;
  r_scores: number[];
  f_scores: number[];
  m_scores: number[];
  color: string | null;
  priority: number | null;
  recommended_action: string | null;
  communication_frequency_days: number | null;
}

export interface RfmConfigRow {
  metric: string;
  score: number;
  min_value: number | null;
  max_value: number | null;
}

export interface ProductsPageParams {
  page: number;
  pageSize: number;
  search: string;
  categoryFilter: string;
  brandFilter: string;
  activeOnly: boolean;
  sortField: 'barcode' | 'name' | 'category' | 'brand' | 'price' | 'usage_days';
  sortAsc: boolean;
}

export interface LoyaltyOverviewRow {
  total_clients: number;
  total_points: number;
  avg_points: number;
  participation_rate: number;
  transactions_count: number;
  bronze_count: number;
  silver_count: number;
  gold_count: number;
  platinum_count: number;
}

export interface LoyaltyTierRow {
  tier_name: string;
  min_total_spent: number;
  min_orders: number;
  cashback_percent: number;
  bonus_multiplier: number;
  perks: string;
  sort_order: number;
}

export interface LoyaltyTopClientRow {
  client_id: number;
  full_name: string;
  loyalty_tier: string;
  loyalty_points: number;
}

export type LoyaltyTransactionRow = LoyaltyTransaction & {
  client_name: string | null;
  total_count: number;
};

export type CampaignListRow = Campaign & {
  total_count: number;
};

export interface AbVariantSummaryRow {
  variant: string;
  total_messages: number;
  opened_messages: number;
  clicked_messages: number;
}

export interface OverviewSummaryRow {
  total_clients: number;
  active_clients: number;
  avg_ltv: number;
  avg_aov: number;
  retention_rate: number;
  churn_rate: number;
}

export interface TopSegmentRow {
  segment_name: string;
  client_count: number;
}

export interface AnalyticsSummaryRow {
  avg_ltv: number;
  avg_aov: number;
  retention_rate: number;
  churn_rate: number;
  total_revenue: number;
  revenue_change_pct: number;
}

export interface FunnelRow {
  step_name: string;
  client_count: number;
  pct: number;
  step_order: number;
}

export interface LtvBySegmentRow {
  segment_name: string;
  ltv: number;
}

export interface ClientsPageParams {
  page: number;
  pageSize: number;
  search: string;
  segmentFilter: string;
  tierFilter: string;
  dateFrom: string;
  dateTo: string;
  activeOnly: boolean;
  sortField: 'total_spent' | 'last_order_date' | 'total_orders';
  sortAsc: boolean;
}

export interface OrdersPageParams {
  page: number;
  pageSize: number;
  dateFrom: string;
  dateTo: string;
  sortField: 'order_id' | 'order_created_at' | 'client_name' | 'order_date' | 'source_name' | 'status_changed_at' | 'status_name' | 'products_count' | 'total_amount';
  sortAsc: boolean;
}

export async function fetchClientsPageRpc(params: ClientsPageParams) {
  const { data, error } = await supabase.rpc('get_clients_page', {
    p_page: params.page,
    p_page_size: params.pageSize,
    p_search: params.search || null,
    p_segment: params.segmentFilter,
    p_tier: params.tierFilter,
    p_date_from: params.dateFrom || null,
    p_date_to: params.dateTo || null,
    p_is_active: params.activeOnly,
    p_sort_field: params.sortField,
    p_sort_asc: params.sortAsc,
  });

  return {
    data: (data ?? []) as ClientListRow[],
    error,
  };
}

export async function refreshClientsDenormalizedRpc() {
  const { data, error } = await supabase.rpc('refresh_clients_denormalized');

  if (!error && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('clients-denormalized-refreshed'));
  }

  return {
    data: ((data ?? [])[0] ?? null) as { updated_clients: number; recalculated_rfm: number } | null,
    error,
  };
}

export async function updateProductActiveRpc(barcode: string, isActive: boolean) {
  const { data, error } = await supabase.rpc('update_product_active', {
    p_barcode: barcode,
    p_is_active: isActive,
  });
  return { data: (data ?? 0) as number, error };
}

export async function rebuildPurchasesForBarcodeRpc(barcode: string) {
  const { data, error } = await supabase.rpc('rebuild_purchases_for_barcode', {
    p_barcode: barcode,
  });

  return {
    data: (data ?? 0) as number,
    error,
  };
}

export async function fetchFilteredRemindersRpc(dateFrom: string, dateTo: string, clientId?: number) {
  const { data, error } = await supabase.rpc('get_filtered_reminders', {
    p_date_from: dateFrom || null,
    p_date_to: dateTo || null,
    p_client_id: clientId ?? null,
  });

  return {
    data: (data ?? []) as ReminderRpcRow[],
    error,
  };
}

export async function fetchProductsPageRpc(params: ProductsPageParams) {
  const { data, error } = await supabase.rpc('get_products_page', {
    p_page: params.page,
    p_page_size: params.pageSize,
    p_search: params.search || null,
    p_category: params.categoryFilter,
    p_brand: params.brandFilter,
    p_is_active: params.activeOnly,
    p_sort_field: params.sortField,
    p_sort_asc: params.sortAsc,
  });

  return {
    data: (data ?? []) as ProductListRow[],
    error,
  };
}

export async function fetchUnknownBarcodesPageRpc(page: number, pageSize: number, search: string) {
  const { data, error } = await supabase.rpc('get_unknown_barcodes_page', {
    p_page: page,
    p_page_size: pageSize,
    p_search: search || null,
  });

  return {
    data: (data ?? []) as UnknownBarcodeRow[],
    error,
  };
}

export async function fetchProductSummaryRpc() {
  const { data, error } = await supabase.rpc('get_product_summary');
  return {
    data: ((data ?? [])[0] ?? null) as ProductSummaryRow | null,
    error,
  };
}

export async function fetchProductCategoriesSummaryRpc() {
  const { data, error } = await supabase.rpc('get_product_categories_summary');
  return {
    data: (data ?? []) as ProductCategorySummaryRow[],
    error,
  };
}

export async function fetchProductCategoriesListRpc() {
  const { data, error } = await supabase.rpc('get_product_categories_list');
  return {
    data: (data ?? []) as ProductCategoryRow[],
    error,
  };
}

export async function fetchProductBrandsSummaryRpc() {
  const { data, error } = await supabase.rpc('get_product_brands_summary');
  return {
    data: (data ?? []) as ProductBrandSummaryRow[],
    error,
  };
}

export async function fetchProductBrandsListRpc() {
  const { data, error } = await supabase.rpc('get_product_brands_list');
  return {
    data: (data ?? []) as ProductBrandRow[],
    error,
  };
}

export async function fetchRfmSegmentsListRpc() {
  const { data, error } = await supabase.rpc('get_rfm_segments_list');
  return {
    data: (data ?? []) as RfmSegmentRow[],
    error,
  };
}

export async function fetchRfmConfigListRpc() {
  const { data, error } = await supabase.rpc('get_rfm_config_list');
  return {
    data: (data ?? []) as RfmConfigRow[],
    error,
  };
}

export async function upsertRfmSegmentRpc(params: {
  segmentName: string;
  rScores: number[];
  fScores: number[];
  mScores: number[];
  color: string;
  priority: number;
  recommendedAction: string;
  communicationFrequencyDays: number;
}) {
  return supabase.rpc('upsert_rfm_segment', {
    p_segment_name: params.segmentName,
    p_r_scores: params.rScores,
    p_f_scores: params.fScores,
    p_m_scores: params.mScores,
    p_color: params.color,
    p_priority: params.priority,
    p_recommended_action: params.recommendedAction,
    p_communication_frequency_days: params.communicationFrequencyDays,
  });
}

export async function upsertRfmConfigRpc(params: {
  metric: string;
  score: number;
  minValue: number | null;
  maxValue: number | null;
}) {
  return supabase.rpc('upsert_rfm_config', {
    p_metric: params.metric,
    p_score: params.score,
    p_min_value: params.minValue,
    p_max_value: params.maxValue,
  });
}

export async function seedDefaultRfmReferenceRpc() {
  return supabase.rpc('seed_default_rfm_reference');
}

export async function createProductCategoryRpc(category: string) {
  const { error } = await supabase.rpc('create_product_category', {
    p_category: category,
  });
  return { error };
}

export async function renameProductCategoryRpc(oldCategory: string, newCategory: string) {
  const { error } = await supabase.rpc('rename_product_category', {
    p_old_category: oldCategory,
    p_new_category: newCategory,
  });
  return { error };
}

export async function deleteProductCategoryRpc(category: string) {
  const { error } = await supabase.rpc('delete_product_category', {
    p_category: category,
  });
  return { error };
}

export async function createProductBrandRpc(brand: string, brandColor: string | null) {
  const { error } = await supabase.rpc('create_product_brand', {
    p_brand: brand,
    p_brand_color: brandColor,
  });
  return { error };
}

export async function renameProductBrandRpc(oldBrand: string, newBrand: string, brandColor: string | null) {
  const { error } = await supabase.rpc('rename_product_brand', {
    p_old_brand: oldBrand,
    p_new_brand: newBrand,
    p_brand_color: brandColor,
  });
  return { error };
}

export async function deleteProductBrandRpc(brand: string) {
  const { error } = await supabase.rpc('delete_product_brand', {
    p_brand: brand,
  });
  return { error };
}

export async function fetchLoyaltyOverviewRpc() {
  const { data, error } = await supabase.rpc('get_loyalty_overview');
  return {
    data: ((data ?? [])[0] ?? null) as LoyaltyOverviewRow | null,
    error,
  };
}

export async function fetchLoyaltyTiersListRpc() {
  const { data, error } = await supabase.rpc('get_loyalty_tiers_list');
  return {
    data: (data ?? []) as LoyaltyTierRow[],
    error,
  };
}

export async function upsertLoyaltyTierRpc(params: {
  tierName: string;
  minTotalSpent: number;
  minOrders: number;
  cashbackPercent: number;
  bonusMultiplier: number;
  perks: string;
  sortOrder: number;
}) {
  return supabase.rpc('upsert_loyalty_tier', {
    p_tier_name: params.tierName,
    p_min_total_spent: params.minTotalSpent,
    p_min_orders: params.minOrders,
    p_cashback_percent: params.cashbackPercent,
    p_bonus_multiplier: params.bonusMultiplier,
    p_perks: params.perks,
    p_sort_order: params.sortOrder,
  });
}

export async function seedDefaultLoyaltyTiersRpc() {
  return supabase.rpc('seed_default_loyalty_tiers');
}

export async function fetchLoyaltyTopClientsRpc(limit = 10) {
  const { data, error } = await supabase.rpc('get_loyalty_top_clients', {
    p_limit: limit,
  });
  return {
    data: (data ?? []) as LoyaltyTopClientRow[],
    error,
  };
}

export async function fetchLoyaltyTransactionsPageRpc(page: number, pageSize: number) {
  const { data, error } = await supabase.rpc('get_loyalty_transactions_page', {
    p_page: page,
    p_page_size: pageSize,
  });
  return {
    data: (data ?? []) as LoyaltyTransactionRow[],
    error,
  };
}

export async function fetchCampaignsPageRpc(page: number, pageSize: number) {
  const { data, error } = await supabase.rpc('get_campaigns_page', {
    p_page: page,
    p_page_size: pageSize,
  });
  return {
    data: (data ?? []) as CampaignListRow[],
    error,
  };
}

export async function fetchCampaignsCalendarRpc(startIso: string, endIso: string) {
  const { data, error } = await supabase.rpc('get_campaigns_calendar', {
    p_start: startIso,
    p_end: endIso,
  });

  return {
    data: (data ?? []) as Campaign[],
    error,
  };
}

export interface CampaignMutationParams {
  name: string;
  type: string;
  targetSegment: string | null;
  targetClientsCount: number;
  channel: string | null;
  templateId: string | null;
  scheduledAt: string | null;
  status: string;
}

export async function createCampaignRpc(params: CampaignMutationParams) {
  const { data, error } = await supabase.rpc('create_campaign', {
    p_name: params.name,
    p_type: params.type,
    p_target_segment: params.targetSegment,
    p_target_clients_count: params.targetClientsCount,
    p_channel: params.channel,
    p_template_id: params.templateId,
    p_scheduled_at: params.scheduledAt,
    p_status: params.status,
  });

  return {
    data: data as string | null,
    error,
  };
}

export async function updateCampaignRpc(campaignId: string, params: CampaignMutationParams) {
  const { error } = await supabase.rpc('update_campaign', {
    p_id: campaignId,
    p_name: params.name,
    p_type: params.type,
    p_target_segment: params.targetSegment,
    p_target_clients_count: params.targetClientsCount,
    p_channel: params.channel,
    p_template_id: params.templateId,
    p_scheduled_at: params.scheduledAt,
    p_status: params.status,
  });

  return { error };
}

export async function deleteCampaignRpc(campaignId: string) {
  const { error } = await supabase.rpc('delete_campaign', {
    p_id: campaignId,
  });

  return { error };
}

export async function fetchAbVariantSummaryRpc() {
  const { data, error } = await supabase.rpc('get_ab_variant_summary');
  return {
    data: (data ?? []) as AbVariantSummaryRow[],
    error,
  };
}

export async function fetchOrdersPageRpc(params: OrdersPageParams) {
  const { data, error } = await supabase.rpc('get_orders_page', {
    p_page: params.page,
    p_page_size: params.pageSize,
    p_date_from: params.dateFrom || null,
    p_date_to: params.dateTo || null,
    p_sort_field: params.sortField,
    p_sort_asc: params.sortAsc,
  });

  return {
    data: (data ?? []) as OrderListItem[],
    error,
  };
}

export async function fetchOverviewSummaryRpc() {
  const { data, error } = await supabase.rpc('get_overview_summary');
  return {
    data: ((data ?? [])[0] ?? null) as OverviewSummaryRow | null,
    error,
  };
}

export async function fetchMetricsSeriesRpc(days: number) {
  const { data, error } = await supabase.rpc('get_metrics_series', {
    p_days: days,
  });
  return {
    data: (data ?? []) as MetricsDaily[],
    error,
  };
}

export async function fetchTopSegmentsRpc(limit = 5) {
  const { data, error } = await supabase.rpc('get_top_segments', {
    p_limit: limit,
  });
  return {
    data: (data ?? []) as TopSegmentRow[],
    error,
  };
}

export async function fetchAnalyticsSummaryRpc(periodDays: number) {
  const { data, error } = await supabase.rpc('get_analytics_summary', {
    p_period_days: periodDays,
  });
  return {
    data: ((data ?? [])[0] ?? null) as AnalyticsSummaryRow | null,
    error,
  };
}

export async function fetchRepeatPurchaseFunnelRpc() {
  const { data, error } = await supabase.rpc('get_repeat_purchase_funnel');
  return {
    data: (data ?? []) as FunnelRow[],
    error,
  };
}

export async function fetchLtvBySegmentRpc(limit = 8) {
  const { data, error } = await supabase.rpc('get_ltv_by_segment', {
    p_limit: limit,
  });
  return {
    data: (data ?? []) as LtvBySegmentRow[],
    error,
  };
}

export async function fetchCohortMatrixRpc() {
  const { data, error } = await supabase.rpc('get_cohort_matrix');
  return {
    data: (data ?? []) as CohortSnapshot[],
    error,
  };
}

// ─── Settings & templates ────────────────────────────────────────────────────

export async function fetchSettingsListRpc() {
  const { data, error } = await supabase.rpc('get_settings_list');
  return { data: (data ?? []) as Setting[], error };
}

export async function fetchCommunicationTemplatesListRpc() {
  const { data, error } = await supabase.rpc('get_communication_templates_list');
  return { data: (data ?? []) as CommunicationTemplate[], error };
}

// ─── Client purchases ────────────────────────────────────────────────────────

export async function deleteClientPurchaseRpc(id: string) {
  const { error } = await supabase.rpc('delete_client_purchase', { p_id: id });
  return { error };
}

// ─── Client card ─────────────────────────────────────────────────────────────

export async function fetchClientByIdRpc(clientId: number) {
  const { data, error } = await supabase.rpc('get_client_by_id', { p_client_id: clientId });
  return { data: ((data ?? [])[0] ?? null) as Client | null, error };
}

export async function fetchClientOrdersRpc(clientId: number) {
  const { data, error } = await supabase.rpc('get_client_orders', { p_client_id: clientId });
  return { data: (data ?? []) as ClientOrder[], error };
}

export async function fetchClientCommsRpc(clientId: number) {
  const { data, error } = await supabase.rpc('get_client_comms', { p_client_id: clientId });
  return { data: (data ?? []) as CommunicationLog[], error };
}

export async function fetchClientLoyaltyTransactionsRpc(clientId: number) {
  const { data, error } = await supabase.rpc('get_client_loyalty_transactions', { p_client_id: clientId });
  return { data: (data ?? []) as LoyaltyTransaction[], error };
}

export async function fetchRfmSegmentActionRpc(segmentName: string) {
  const { data, error } = await supabase.rpc('get_rfm_segment_action', { p_segment_name: segmentName });
  return { data: (data ?? null) as string | null, error };
}

export async function updateClientActiveRpc(clientId: number, isActive: boolean) {
  const { error } = await supabase.rpc('update_client_active', {
    p_client_id: clientId,
    p_is_active: isActive,
  });
  return { error };
}

// ─── Automations ─────────────────────────────────────────────────────────────

export type AutomationQueueRpcRow = Omit<AutomationQueueItem, 'client'> & { client_name: string | null };

export async function fetchAutomationQueueRpc() {
  const { data, error } = await supabase.rpc('get_automation_queue');
  return { data: (data ?? []) as AutomationQueueRpcRow[], error };
}

export async function fetchCommunicationLogAllRpc() {
  const { data, error } = await supabase.rpc('get_communication_log_all');
  return { data: (data ?? []) as CommunicationLog[], error };
}

export async function fetchWinBackCandidatesRpc() {
  const { data, error } = await supabase.rpc('get_win_back_candidates');
  return { data: (data ?? []) as WinBackCandidate[], error };
}

export async function updateProductRpc(params: {
  barcode: string;
  name: string;
  category: string | null;
  brand: string | null;
  price: number | null;
  usageDays: number | null;
  imageUrl: string | null;
}) {
  const { error } = await supabase.rpc('update_product', {
    p_barcode:    params.barcode,
    p_name:       params.name,
    p_category:   params.category,
    p_brand:      params.brand,
    p_price:      params.price,
    p_usage_days: params.usageDays,
    p_image_url:  params.imageUrl,
  });
  return { error };
}
