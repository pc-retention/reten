export interface Client {
  client_id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  source_id: number | null;
  first_order_date: string | null;
  last_order_date: string | null;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  rfm_recency: number | null;
  rfm_frequency: number | null;
  rfm_monetary: number | null;
  rfm_segment: string | null;
  rfm_updated_at: string | null;
  loyalty_tier: string;
  loyalty_points: number;
  is_active: boolean;
  churn_risk: string;
  preferred_channel: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Product {
  barcode: string;
  name: string;
  usage_days: number;
  category: string | null;
  brand?: string | null;
  brand_color?: string | null;
  price: number;
  cross_sell_barcodes: string[];
  is_active?: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UnknownBarcode {
  barcode: string;
  first_seen_at: string;
  seen_count: number;
  last_order_id: number | null;
  sample_name: string | null;
}

export interface ClientOrder {
  id: string;
  client_id: number;
  order_id: number;
  order_date: string;
  order_created_at?: string | null;
  status_changed_at?: string | null;
  status_id: number;
  source_id: number;
  total_amount: number;
  products_count: number;
  created_at: string;
}

export interface OrderListItem extends ClientOrder {
  status_name: string;
  status_color?: string | null;
  source_name: string;
  source_color?: string | null;
  client_name: string | null;
  total_count: number;
}

export interface ClientOrderItem {
  id: string;
  order_id: number;
  client_id: number;
  barcode: string;
  product_name: string;
  quantity: number;
  price: number;
}

export interface CommunicationLog {
  id: string;
  client_id: number;
  communication_type: string;
  channel: string;
  template_id: string | null;
  message_preview: string | null;
  status: string;
  ab_variant: string | null;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
}

export interface CommunicationTemplate {
  id: string;
  communication_type: string;
  channel: string;
  subject: string | null;
  body_template: string;
  is_active: boolean;
  ab_variant: string | null;
}

export interface ClientPurchase {
  id: string;
  client_id: number;
  barcode: string;
  product_name: string;
  quantity: number;
  usage_days: number;
  total_usage_days: number;
  purchase_date: string;
  expected_end_date: string;
  reminder_date: string;
  reminder_sent: boolean;
  source_channel: string;
}

export interface AutomationQueueItem {
  id: string;
  client_id: number;
  automation_type: string;
  trigger_data: Record<string, unknown>;
  scheduled_at: string;
  status: string;
  skip_reason: string | null;
  created_at: string;
  client?: Client;
}

export interface WinBackCandidate {
  client_id: number;
  last_order_date: string;
  days_inactive: number;
  tier: string;
  win_back_sent: boolean;
  win_back_date: string | null;
  client?: Client;
}

export interface LoyaltyTier {
  tier_name: string;
  min_total_spent: number;
  min_orders: number;
  cashback_percent: number;
  bonus_multiplier: number;
  perks: string;
  sort_order: number;
}

export interface LoyaltyTransaction {
  id: string;
  client_id: number;
  transaction_type: string;
  points: number;
  reason: string;
  order_id: number | null;
  created_at: string;
  client?: Client;
}

export interface RfmConfig {
  metric: string;
  score: number;
  min_value: number;
  max_value: number;
}

export interface RfmSegment {
  segment_name: string;
  r_scores: number[];
  f_scores: number[];
  m_scores: number[];
  color: string;
  priority: number;
  recommended_action: string;
  communication_frequency_days: number;
}

export interface CohortSnapshot {
  id: string;
  cohort_month: string;
  period_month: string;
  months_since_first: number;
  cohort_size: number;
  active_clients: number;
  retention_rate: number;
  total_revenue: number;
}

export interface MetricsDaily {
  date: string;
  new_clients: number;
  returning_clients: number;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  communications_sent: number;
  communications_opened: number;
  communications_clicked: number;
}

export interface AllowedSource {
  source_id: number;
  source_name: string;
  color?: string | null;
  is_active: boolean;
}

export interface AllowedOrderStatus {
  status_id: number;
  status_name: string;
  group_name: string | null;
  color?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  orders_fetched: number;
  orders_new: number;
  orders_skipped: number;
  errors: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface Setting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: string;
  target_segment: string | null;
  target_clients_count: number;
  channel: string | null;
  template_id: string | null;
  scheduled_at: string | null;
  status: string;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  conversion_count: number;
  created_at: string;
  updated_at: string;
}

export interface BadgeCounts {
  unknown_barcodes: number;
  at_risk: number;
  pending_queue: number;
  overdue_reminders: number;
  levelup_today: number;
  campaigns_today: number;
  sync_errors: number;
}
