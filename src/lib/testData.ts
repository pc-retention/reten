import type {
  Client,
  Product,
  UnknownBarcode,
  ClientOrder,
  ClientOrderItem,
  CommunicationLog,
  CommunicationTemplate,
  ClientPurchase,
  AutomationQueueItem,
  WinBackCandidate,
  LoyaltyTier,
  LoyaltyTransaction,
  RfmConfig,
  RfmSegment,
  CohortSnapshot,
  MetricsDaily,
  AllowedSource,
  SyncLog,
  Setting,
  Campaign,
  BadgeCounts,
} from '../types';

// ═══════════════════════════════════════════════════
// PRODUCTS (15 cosmetic products)
// ═══════════════════════════════════════════════════

export const products: Product[] = [
  { barcode: '4820001001', name: 'Шампунь відновлюючий 250мл', usage_days: 30, category: 'Шампуні', price: 285.00, cross_sell_barcodes: ['4820001002', '4820001003'], created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { barcode: '4820001002', name: 'Кондиціонер зволожуючий 250мл', usage_days: 30, category: 'Кондиціонери', price: 310.00, cross_sell_barcodes: ['4820001001', '4820001004'], created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { barcode: '4820001003', name: 'Маска для волосся 200мл', usage_days: 45, category: 'Маски', price: 420.00, cross_sell_barcodes: ['4820001001', '4820001002'], created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { barcode: '4820001004', name: 'Олія для волосся 100мл', usage_days: 60, category: 'Олії', price: 380.00, cross_sell_barcodes: ['4820001001', '4820001003'], created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { barcode: '4820001005', name: 'Крем для обличчя денний 50мл', usage_days: 30, category: 'Креми', price: 520.00, cross_sell_barcodes: ['4820001006', '4820001007'], created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { barcode: '4820001006', name: 'Крем для обличчя нічний 50мл', usage_days: 30, category: 'Креми', price: 580.00, cross_sell_barcodes: ['4820001005', '4820001007'], created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { barcode: '4820001007', name: 'Сироватка гіалуронова 30мл', usage_days: 45, category: 'Сироватки', price: 720.00, cross_sell_barcodes: ['4820001005', '4820001006'], created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { barcode: '4820001008', name: 'Тонік для обличчя 150мл', usage_days: 30, category: 'Тоніки', price: 340.00, cross_sell_barcodes: ['4820001005', '4820001009'], created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { barcode: '4820001009', name: 'Міцелярна вода 400мл', usage_days: 45, category: 'Очищення', price: 290.00, cross_sell_barcodes: ['4820001008', '4820001005'], created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { barcode: '4820001010', name: 'Крем для рук 75мл', usage_days: 20, category: 'Креми', price: 165.00, cross_sell_barcodes: ['4820001011', '4820001005'], created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { barcode: '4820001011', name: 'Бальзам для губ 15мл', usage_days: 15, category: 'Бальзами', price: 95.00, cross_sell_barcodes: ['4820001010'], created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { barcode: '4820001012', name: 'Скраб для тіла 200мл', usage_days: 60, category: 'Скраби', price: 350.00, cross_sell_barcodes: ['4820001013'], created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { barcode: '4820001013', name: 'Лосьйон для тіла 300мл', usage_days: 30, category: 'Лосьйони', price: 320.00, cross_sell_barcodes: ['4820001012'], created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { barcode: '4820001014', name: 'SPF крем 50мл', usage_days: 30, category: 'Захист від сонця', price: 450.00, cross_sell_barcodes: ['4820001005', '4820001007'], created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { barcode: '4820001015', name: 'Набір "Догляд за обличчям"', usage_days: 45, category: 'Набори', price: 1350.00, cross_sell_barcodes: ['4820001005', '4820001006', '4820001007'], created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
];

// ═══════════════════════════════════════════════════
// UNKNOWN BARCODES (2 items)
// ═══════════════════════════════════════════════════

export const unknownBarcodes: UnknownBarcode[] = [
  { barcode: '9999000001', first_seen_at: '2026-03-01T00:00:00Z', seen_count: 3, last_order_id: null, sample_name: 'Невідомий товар з замовлення #1234' },
  { barcode: '9999000002', first_seen_at: '2026-03-01T00:00:00Z', seen_count: 1, last_order_id: null, sample_name: 'Пробник з акції' },
];

// ═══════════════════════════════════════════════════
// CLIENTS (50 test clients)
// ═══════════════════════════════════════════════════

export const clients: Client[] = [
  { client_id: 1001, full_name: 'Олена Коваленко', phone: '+380501234567', email: 'olena.k@gmail.com', instagram: 'olena_beauty', source_id: 1, first_order_date: '2024-03-15', last_order_date: '2026-03-28', total_orders: 18, total_spent: 16200.00, avg_order_value: 900.00, rfm_recency: 5, rfm_frequency: 5, rfm_monetary: 5, rfm_segment: 'Champions', rfm_updated_at: '2026-03-28T00:00:00Z', loyalty_tier: 'platinum', loyalty_points: 4200, is_active: true, churn_risk: 'low', preferred_channel: 'instagram', tags: ['VIP', 'постійний'], created_at: '2024-03-15T00:00:00Z', updated_at: '2026-03-28T00:00:00Z' },
  { client_id: 1002, full_name: 'Марія Шевченко', phone: '+380671234568', email: 'maria.s@gmail.com', instagram: 'maria_shev', source_id: 1, first_order_date: '2024-05-20', last_order_date: '2026-03-25', total_orders: 14, total_spent: 11800.00, avg_order_value: 842.86, rfm_recency: 5, rfm_frequency: 5, rfm_monetary: 5, rfm_segment: 'Champions', rfm_updated_at: '2026-03-25T00:00:00Z', loyalty_tier: 'gold', loyalty_points: 3100, is_active: true, churn_risk: 'low', preferred_channel: 'instagram', tags: ['VIP'], created_at: '2024-05-20T00:00:00Z', updated_at: '2026-03-25T00:00:00Z' },
  { client_id: 1003, full_name: 'Анна Бондаренко', phone: '+380931234569', email: 'anna.b@gmail.com', instagram: null, source_id: 2, first_order_date: '2024-07-10', last_order_date: '2026-03-20', total_orders: 11, total_spent: 8900.00, avg_order_value: 809.09, rfm_recency: 5, rfm_frequency: 4, rfm_monetary: 4, rfm_segment: 'Loyal', rfm_updated_at: '2026-03-20T00:00:00Z', loyalty_tier: 'gold', loyalty_points: 2400, is_active: true, churn_risk: 'low', preferred_channel: 'sms', tags: ['лояльний'], created_at: '2024-07-10T00:00:00Z', updated_at: '2026-03-20T00:00:00Z' },
  { client_id: 1004, full_name: 'Катерина Мельник', phone: '+380501234570', email: 'kate.m@gmail.com', instagram: 'kate_mel', source_id: 1, first_order_date: '2024-09-01', last_order_date: '2026-03-15', total_orders: 9, total_spent: 6750.00, avg_order_value: 750.00, rfm_recency: 5, rfm_frequency: 4, rfm_monetary: 4, rfm_segment: 'Loyal', rfm_updated_at: '2026-03-15T00:00:00Z', loyalty_tier: 'gold', loyalty_points: 1800, is_active: true, churn_risk: 'low', preferred_channel: 'instagram', tags: [], created_at: '2024-09-01T00:00:00Z', updated_at: '2026-03-15T00:00:00Z' },
  { client_id: 1005, full_name: 'Юлія Ткаченко', phone: '+380671234571', email: null, instagram: 'yulia_tk', source_id: 1, first_order_date: '2024-11-05', last_order_date: '2026-03-10', total_orders: 7, total_spent: 4200.00, avg_order_value: 600.00, rfm_recency: 5, rfm_frequency: 3, rfm_monetary: 3, rfm_segment: 'Loyal', rfm_updated_at: '2026-03-10T00:00:00Z', loyalty_tier: 'silver', loyalty_points: 1100, is_active: true, churn_risk: 'low', preferred_channel: 'instagram', tags: [], created_at: '2024-11-05T00:00:00Z', updated_at: '2026-03-10T00:00:00Z' },
  { client_id: 1006, full_name: 'Наталія Іванова', phone: '+380931234572', email: 'natalia.i@gmail.com', instagram: null, source_id: 2, first_order_date: '2025-01-15', last_order_date: '2026-03-05', total_orders: 5, total_spent: 3100.00, avg_order_value: 620.00, rfm_recency: 4, rfm_frequency: 3, rfm_monetary: 3, rfm_segment: 'Loyal', rfm_updated_at: '2026-03-05T00:00:00Z', loyalty_tier: 'silver', loyalty_points: 820, is_active: true, churn_risk: 'low', preferred_channel: 'email', tags: [], created_at: '2025-01-15T00:00:00Z', updated_at: '2026-03-05T00:00:00Z' },
  { client_id: 1007, full_name: 'Оксана Петренко', phone: '+380501234573', email: null, instagram: 'oksana_petr', source_id: 1, first_order_date: '2025-03-20', last_order_date: '2026-03-01', total_orders: 4, total_spent: 2600.00, avg_order_value: 650.00, rfm_recency: 4, rfm_frequency: 2, rfm_monetary: 3, rfm_segment: 'Potential Loyal', rfm_updated_at: '2026-03-01T00:00:00Z', loyalty_tier: 'silver', loyalty_points: 680, is_active: true, churn_risk: 'low', preferred_channel: 'instagram', tags: [], created_at: '2025-03-20T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { client_id: 1008, full_name: 'Вікторія Сидоренко', phone: '+380671234574', email: 'vika.s@gmail.com', instagram: null, source_id: 2, first_order_date: '2025-05-10', last_order_date: '2026-02-28', total_orders: 3, total_spent: 1850.00, avg_order_value: 616.67, rfm_recency: 4, rfm_frequency: 2, rfm_monetary: 2, rfm_segment: 'Potential Loyal', rfm_updated_at: '2026-02-28T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 480, is_active: true, churn_risk: 'low', preferred_channel: 'sms', tags: [], created_at: '2025-05-10T00:00:00Z', updated_at: '2026-02-28T00:00:00Z' },
  { client_id: 1009, full_name: 'Тетяна Кравченко', phone: '+380931234575', email: null, instagram: 'tanya_kr', source_id: 1, first_order_date: '2025-07-01', last_order_date: '2026-02-20', total_orders: 3, total_spent: 2100.00, avg_order_value: 700.00, rfm_recency: 4, rfm_frequency: 2, rfm_monetary: 3, rfm_segment: 'Potential Loyal', rfm_updated_at: '2026-02-20T00:00:00Z', loyalty_tier: 'silver', loyalty_points: 550, is_active: true, churn_risk: 'low', preferred_channel: 'instagram', tags: [], created_at: '2025-07-01T00:00:00Z', updated_at: '2026-02-20T00:00:00Z' },
  { client_id: 1010, full_name: 'Ірина Мороз', phone: '+380501234576', email: 'iryna.m@gmail.com', instagram: null, source_id: 3, first_order_date: '2025-08-15', last_order_date: '2026-02-15', total_orders: 2, total_spent: 1200.00, avg_order_value: 600.00, rfm_recency: 4, rfm_frequency: 2, rfm_monetary: 2, rfm_segment: 'Potential Loyal', rfm_updated_at: '2026-02-15T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 310, is_active: true, churn_risk: 'low', preferred_channel: 'sms', tags: [], created_at: '2025-08-15T00:00:00Z', updated_at: '2026-02-15T00:00:00Z' },
  { client_id: 1011, full_name: 'Людмила Павленко', phone: '+380671234577', email: null, instagram: null, source_id: 2, first_order_date: '2026-03-25', last_order_date: '2026-03-25', total_orders: 1, total_spent: 520.00, avg_order_value: 520.00, rfm_recency: 5, rfm_frequency: 1, rfm_monetary: 1, rfm_segment: 'New Customers', rfm_updated_at: '2026-03-25T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 50, is_active: true, churn_risk: 'low', preferred_channel: 'sms', tags: ['новий'], created_at: '2026-03-25T00:00:00Z', updated_at: '2026-03-25T00:00:00Z' },
  { client_id: 1012, full_name: 'Дарина Лисенко', phone: '+380931234578', email: 'daryna.l@gmail.com', instagram: 'daryna_l', source_id: 1, first_order_date: '2026-03-20', last_order_date: '2026-03-20', total_orders: 1, total_spent: 720.00, avg_order_value: 720.00, rfm_recency: 5, rfm_frequency: 1, rfm_monetary: 1, rfm_segment: 'New Customers', rfm_updated_at: '2026-03-20T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 50, is_active: true, churn_risk: 'low', preferred_channel: 'instagram', tags: ['новий'], created_at: '2026-03-20T00:00:00Z', updated_at: '2026-03-20T00:00:00Z' },
  { client_id: 1013, full_name: 'Софія Гончар', phone: '+380501234579', email: null, instagram: 'sofia_g', source_id: 1, first_order_date: '2026-03-18', last_order_date: '2026-03-18', total_orders: 1, total_spent: 340.00, avg_order_value: 340.00, rfm_recency: 5, rfm_frequency: 1, rfm_monetary: 1, rfm_segment: 'New Customers', rfm_updated_at: '2026-03-18T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 50, is_active: true, churn_risk: 'low', preferred_channel: 'instagram', tags: ['новий'], created_at: '2026-03-18T00:00:00Z', updated_at: '2026-03-18T00:00:00Z' },
  { client_id: 1014, full_name: 'Алла Руденко', phone: '+380671234580', email: 'alla.r@gmail.com', instagram: null, source_id: 2, first_order_date: '2026-03-15', last_order_date: '2026-03-15', total_orders: 1, total_spent: 285.00, avg_order_value: 285.00, rfm_recency: 5, rfm_frequency: 1, rfm_monetary: 1, rfm_segment: 'New Customers', rfm_updated_at: '2026-03-15T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 50, is_active: true, churn_risk: 'low', preferred_channel: 'email', tags: ['новий'], created_at: '2026-03-15T00:00:00Z', updated_at: '2026-03-15T00:00:00Z' },
  { client_id: 1015, full_name: 'Валентина Козлова', phone: '+380931234581', email: null, instagram: null, source_id: 3, first_order_date: '2026-03-10', last_order_date: '2026-03-10', total_orders: 1, total_spent: 450.00, avg_order_value: 450.00, rfm_recency: 5, rfm_frequency: 1, rfm_monetary: 1, rfm_segment: 'New Customers', rfm_updated_at: '2026-03-10T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 50, is_active: true, churn_risk: 'low', preferred_channel: 'sms', tags: ['новий'], created_at: '2026-03-10T00:00:00Z', updated_at: '2026-03-10T00:00:00Z' },
  { client_id: 1016, full_name: 'Олександра Попова', phone: '+380501234582', email: 'alex.p@gmail.com', instagram: 'alex_pop', source_id: 1, first_order_date: '2025-06-01', last_order_date: '2026-02-25', total_orders: 2, total_spent: 890.00, avg_order_value: 445.00, rfm_recency: 4, rfm_frequency: 2, rfm_monetary: 2, rfm_segment: 'Promising', rfm_updated_at: '2026-02-25T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 230, is_active: true, churn_risk: 'low', preferred_channel: 'instagram', tags: [], created_at: '2025-06-01T00:00:00Z', updated_at: '2026-02-25T00:00:00Z' },
  { client_id: 1017, full_name: 'Яна Кузьменко', phone: '+380671234583', email: null, instagram: 'yana_k', source_id: 1, first_order_date: '2025-08-10', last_order_date: '2026-02-18', total_orders: 2, total_spent: 650.00, avg_order_value: 325.00, rfm_recency: 4, rfm_frequency: 2, rfm_monetary: 2, rfm_segment: 'Promising', rfm_updated_at: '2026-02-18T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 170, is_active: true, churn_risk: 'low', preferred_channel: 'instagram', tags: [], created_at: '2025-08-10T00:00:00Z', updated_at: '2026-02-18T00:00:00Z' },
  { client_id: 1018, full_name: 'Христина Бойко', phone: '+380931234584', email: 'krystyna.b@gmail.com', instagram: null, source_id: 2, first_order_date: '2025-09-20', last_order_date: '2026-02-10', total_orders: 2, total_spent: 760.00, avg_order_value: 380.00, rfm_recency: 4, rfm_frequency: 2, rfm_monetary: 2, rfm_segment: 'Promising', rfm_updated_at: '2026-02-10T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 200, is_active: true, churn_risk: 'low', preferred_channel: 'sms', tags: [], created_at: '2025-09-20T00:00:00Z', updated_at: '2026-02-10T00:00:00Z' },
  { client_id: 1019, full_name: 'Діана Савченко', phone: '+380501234585', email: null, instagram: 'diana_s', source_id: 1, first_order_date: '2025-10-01', last_order_date: '2026-01-20', total_orders: 2, total_spent: 580.00, avg_order_value: 290.00, rfm_recency: 3, rfm_frequency: 2, rfm_monetary: 2, rfm_segment: 'Promising', rfm_updated_at: '2026-01-20T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 150, is_active: true, churn_risk: 'low', preferred_channel: 'instagram', tags: [], created_at: '2025-10-01T00:00:00Z', updated_at: '2026-01-20T00:00:00Z' },
  { client_id: 1020, full_name: 'Поліна Зайцева', phone: '+380671234586', email: 'polina.z@gmail.com', instagram: null, source_id: 2, first_order_date: '2025-11-15', last_order_date: '2026-01-10', total_orders: 1, total_spent: 420.00, avg_order_value: 420.00, rfm_recency: 3, rfm_frequency: 1, rfm_monetary: 1, rfm_segment: 'Promising', rfm_updated_at: '2026-01-10T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 50, is_active: true, churn_risk: 'low', preferred_channel: 'email', tags: [], created_at: '2025-11-15T00:00:00Z', updated_at: '2026-01-10T00:00:00Z' },
  { client_id: 1021, full_name: 'Лариса Федоренко', phone: '+380931234587', email: null, instagram: null, source_id: 3, first_order_date: '2024-06-15', last_order_date: '2025-12-20', total_orders: 6, total_spent: 3800.00, avg_order_value: 633.33, rfm_recency: 3, rfm_frequency: 3, rfm_monetary: 3, rfm_segment: 'Need Attention', rfm_updated_at: '2025-12-20T00:00:00Z', loyalty_tier: 'silver', loyalty_points: 1000, is_active: true, churn_risk: 'medium', preferred_channel: 'sms', tags: [], created_at: '2024-06-15T00:00:00Z', updated_at: '2025-12-20T00:00:00Z' },
  { client_id: 1022, full_name: 'Галина Мартиненко', phone: '+380501234588', email: 'galyna.m@gmail.com', instagram: 'galyna_m', source_id: 1, first_order_date: '2024-08-20', last_order_date: '2025-12-15', total_orders: 5, total_spent: 3200.00, avg_order_value: 640.00, rfm_recency: 3, rfm_frequency: 3, rfm_monetary: 3, rfm_segment: 'Need Attention', rfm_updated_at: '2025-12-15T00:00:00Z', loyalty_tier: 'silver', loyalty_points: 840, is_active: true, churn_risk: 'medium', preferred_channel: 'instagram', tags: [], created_at: '2024-08-20T00:00:00Z', updated_at: '2025-12-15T00:00:00Z' },
  { client_id: 1023, full_name: 'Зоя Григоренко', phone: '+380671234589', email: null, instagram: null, source_id: 2, first_order_date: '2024-10-10', last_order_date: '2025-12-01', total_orders: 4, total_spent: 2800.00, avg_order_value: 700.00, rfm_recency: 3, rfm_frequency: 2, rfm_monetary: 3, rfm_segment: 'Need Attention', rfm_updated_at: '2025-12-01T00:00:00Z', loyalty_tier: 'silver', loyalty_points: 730, is_active: true, churn_risk: 'medium', preferred_channel: 'sms', tags: [], created_at: '2024-10-10T00:00:00Z', updated_at: '2025-12-01T00:00:00Z' },
  { client_id: 1024, full_name: 'Вероніка Тимченко', phone: '+380931234590', email: 'veronika.t@gmail.com', instagram: null, source_id: 2, first_order_date: '2024-12-01', last_order_date: '2025-11-15', total_orders: 4, total_spent: 2400.00, avg_order_value: 600.00, rfm_recency: 3, rfm_frequency: 2, rfm_monetary: 2, rfm_segment: 'About To Sleep', rfm_updated_at: '2025-11-15T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 630, is_active: true, churn_risk: 'medium', preferred_channel: 'email', tags: [], created_at: '2024-12-01T00:00:00Z', updated_at: '2025-11-15T00:00:00Z' },
  { client_id: 1025, full_name: 'Стефанія Левченко', phone: '+380501234591', email: null, instagram: 'stefania_l', source_id: 1, first_order_date: '2025-01-20', last_order_date: '2025-11-01', total_orders: 3, total_spent: 1900.00, avg_order_value: 633.33, rfm_recency: 3, rfm_frequency: 2, rfm_monetary: 2, rfm_segment: 'About To Sleep', rfm_updated_at: '2025-11-01T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 500, is_active: true, churn_risk: 'medium', preferred_channel: 'instagram', tags: [], created_at: '2025-01-20T00:00:00Z', updated_at: '2025-11-01T00:00:00Z' },
  { client_id: 1026, full_name: 'Адріана Харченко', phone: '+380671234592', email: 'adriana.h@gmail.com', instagram: null, source_id: 2, first_order_date: '2025-02-10', last_order_date: '2025-10-20', total_orders: 3, total_spent: 2200.00, avg_order_value: 733.33, rfm_recency: 2, rfm_frequency: 2, rfm_monetary: 3, rfm_segment: 'About To Sleep', rfm_updated_at: '2025-10-20T00:00:00Z', loyalty_tier: 'silver', loyalty_points: 580, is_active: true, churn_risk: 'medium', preferred_channel: 'sms', tags: [], created_at: '2025-02-10T00:00:00Z', updated_at: '2025-10-20T00:00:00Z' },
  { client_id: 1027, full_name: 'Єлизавета Власенко', phone: '+380931234593', email: null, instagram: 'liza_v', source_id: 1, first_order_date: '2024-04-10', last_order_date: '2025-10-05', total_orders: 8, total_spent: 6400.00, avg_order_value: 800.00, rfm_recency: 2, rfm_frequency: 4, rfm_monetary: 4, rfm_segment: 'At Risk', rfm_updated_at: '2025-10-05T00:00:00Z', loyalty_tier: 'gold', loyalty_points: 1680, is_active: true, churn_risk: 'high', preferred_channel: 'instagram', tags: ['цінний'], created_at: '2024-04-10T00:00:00Z', updated_at: '2025-10-05T00:00:00Z' },
  { client_id: 1028, full_name: 'Маргарита Романенко', phone: '+380501234594', email: 'margo.r@gmail.com', instagram: null, source_id: 2, first_order_date: '2024-06-20', last_order_date: '2025-09-30', total_orders: 7, total_spent: 5600.00, avg_order_value: 800.00, rfm_recency: 2, rfm_frequency: 3, rfm_monetary: 4, rfm_segment: 'At Risk', rfm_updated_at: '2025-09-30T00:00:00Z', loyalty_tier: 'gold', loyalty_points: 1470, is_active: true, churn_risk: 'high', preferred_channel: 'email', tags: ['цінний'], created_at: '2024-06-20T00:00:00Z', updated_at: '2025-09-30T00:00:00Z' },
  { client_id: 1029, full_name: 'Аліна Кириченко', phone: '+380671234595', email: null, instagram: 'alina_k', source_id: 1, first_order_date: '2024-08-15', last_order_date: '2025-09-15', total_orders: 6, total_spent: 4800.00, avg_order_value: 800.00, rfm_recency: 1, rfm_frequency: 3, rfm_monetary: 4, rfm_segment: 'At Risk', rfm_updated_at: '2025-09-15T00:00:00Z', loyalty_tier: 'silver', loyalty_points: 1260, is_active: true, churn_risk: 'high', preferred_channel: 'instagram', tags: [], created_at: '2024-08-15T00:00:00Z', updated_at: '2025-09-15T00:00:00Z' },
  { client_id: 1030, full_name: 'Віталіна Демченко', phone: '+380931234596', email: 'vitalina.d@gmail.com', instagram: null, source_id: 3, first_order_date: '2024-10-01', last_order_date: '2025-08-20', total_orders: 5, total_spent: 3500.00, avg_order_value: 700.00, rfm_recency: 1, rfm_frequency: 3, rfm_monetary: 3, rfm_segment: 'At Risk', rfm_updated_at: '2025-08-20T00:00:00Z', loyalty_tier: 'silver', loyalty_points: 920, is_active: true, churn_risk: 'high', preferred_channel: 'sms', tags: [], created_at: '2024-10-01T00:00:00Z', updated_at: '2025-08-20T00:00:00Z' },
  { client_id: 1031, full_name: 'Ангеліна Панченко', phone: '+380501234597', email: null, instagram: null, source_id: 2, first_order_date: '2024-02-10', last_order_date: '2025-08-01', total_orders: 12, total_spent: 12500.00, avg_order_value: 1041.67, rfm_recency: 1, rfm_frequency: 5, rfm_monetary: 5, rfm_segment: "Can't Lose Them", rfm_updated_at: '2025-08-01T00:00:00Z', loyalty_tier: 'platinum', loyalty_points: 3280, is_active: true, churn_risk: 'high', preferred_channel: 'sms', tags: ['VIP', 'втрачаємо'], created_at: '2024-02-10T00:00:00Z', updated_at: '2025-08-01T00:00:00Z' },
  { client_id: 1032, full_name: 'Роксолана Островська', phone: '+380671234598', email: 'roxy.o@gmail.com', instagram: 'roxy_beauty', source_id: 1, first_order_date: '2024-03-25', last_order_date: '2025-07-15', total_orders: 10, total_spent: 9800.00, avg_order_value: 980.00, rfm_recency: 1, rfm_frequency: 5, rfm_monetary: 4, rfm_segment: "Can't Lose Them", rfm_updated_at: '2025-07-15T00:00:00Z', loyalty_tier: 'gold', loyalty_points: 2570, is_active: true, churn_risk: 'high', preferred_channel: 'instagram', tags: ['VIP', 'втрачаємо'], created_at: '2024-03-25T00:00:00Z', updated_at: '2025-07-15T00:00:00Z' },
  { client_id: 1033, full_name: 'Емілія Юрченко', phone: '+380931234599', email: null, instagram: null, source_id: 3, first_order_date: '2025-04-10', last_order_date: '2025-09-10', total_orders: 2, total_spent: 480.00, avg_order_value: 240.00, rfm_recency: 1, rfm_frequency: 2, rfm_monetary: 1, rfm_segment: 'Hibernating', rfm_updated_at: '2025-09-10T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 130, is_active: true, churn_risk: 'high', preferred_channel: 'sms', tags: [], created_at: '2025-04-10T00:00:00Z', updated_at: '2025-09-10T00:00:00Z' },
  { client_id: 1034, full_name: 'Лілія Олійник', phone: '+380501234600', email: 'liliya.o@gmail.com', instagram: null, source_id: 2, first_order_date: '2025-05-15', last_order_date: '2025-08-25', total_orders: 2, total_spent: 350.00, avg_order_value: 175.00, rfm_recency: 1, rfm_frequency: 2, rfm_monetary: 1, rfm_segment: 'Hibernating', rfm_updated_at: '2025-08-25T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 90, is_active: true, churn_risk: 'high', preferred_channel: 'email', tags: [], created_at: '2025-05-15T00:00:00Z', updated_at: '2025-08-25T00:00:00Z' },
  { client_id: 1035, full_name: 'Мілана Гаврилюк', phone: '+380671234601', email: null, instagram: 'milana_g', source_id: 1, first_order_date: '2025-06-20', last_order_date: '2025-09-05', total_orders: 1, total_spent: 290.00, avg_order_value: 290.00, rfm_recency: 1, rfm_frequency: 1, rfm_monetary: 1, rfm_segment: 'Hibernating', rfm_updated_at: '2025-09-05T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 50, is_active: false, churn_risk: 'high', preferred_channel: 'instagram', tags: [], created_at: '2025-06-20T00:00:00Z', updated_at: '2025-09-05T00:00:00Z' },
  { client_id: 1036, full_name: 'Карина Стеценко', phone: '+380931234602', email: null, instagram: null, source_id: 3, first_order_date: '2025-03-10', last_order_date: '2025-07-20', total_orders: 2, total_spent: 410.00, avg_order_value: 205.00, rfm_recency: 1, rfm_frequency: 2, rfm_monetary: 1, rfm_segment: 'Hibernating', rfm_updated_at: '2025-07-20T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 110, is_active: false, churn_risk: 'high', preferred_channel: 'sms', tags: [], created_at: '2025-03-10T00:00:00Z', updated_at: '2025-07-20T00:00:00Z' },
  { client_id: 1037, full_name: 'Злата Діденко', phone: '+380501234603', email: 'zlata.d@gmail.com', instagram: null, source_id: 2, first_order_date: '2025-01-05', last_order_date: '2025-06-10', total_orders: 1, total_spent: 165.00, avg_order_value: 165.00, rfm_recency: 1, rfm_frequency: 1, rfm_monetary: 1, rfm_segment: 'Lost', rfm_updated_at: '2025-06-10T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 0, is_active: false, churn_risk: 'high', preferred_channel: 'email', tags: [], created_at: '2025-01-05T00:00:00Z', updated_at: '2025-06-10T00:00:00Z' },
  { client_id: 1038, full_name: 'Мирослава Андрієнко', phone: '+380671234604', email: null, instagram: null, source_id: 3, first_order_date: '2024-11-20', last_order_date: '2025-05-15', total_orders: 1, total_spent: 285.00, avg_order_value: 285.00, rfm_recency: 1, rfm_frequency: 1, rfm_monetary: 1, rfm_segment: 'Lost', rfm_updated_at: '2025-05-15T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 0, is_active: false, churn_risk: 'high', preferred_channel: 'sms', tags: [], created_at: '2024-11-20T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
  { client_id: 1039, full_name: 'Ніка Гордієнко', phone: '+380931234605', email: null, instagram: 'nika_g', source_id: 1, first_order_date: '2024-09-10', last_order_date: '2025-04-20', total_orders: 1, total_spent: 520.00, avg_order_value: 520.00, rfm_recency: 1, rfm_frequency: 1, rfm_monetary: 1, rfm_segment: 'Lost', rfm_updated_at: '2025-04-20T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 0, is_active: false, churn_risk: 'high', preferred_channel: 'instagram', tags: [], created_at: '2024-09-10T00:00:00Z', updated_at: '2025-04-20T00:00:00Z' },
  { client_id: 1040, full_name: 'Аріна Назаренко', phone: '+380501234606', email: 'arina.n@gmail.com', instagram: null, source_id: 2, first_order_date: '2024-07-15', last_order_date: '2025-03-10', total_orders: 1, total_spent: 340.00, avg_order_value: 340.00, rfm_recency: 1, rfm_frequency: 1, rfm_monetary: 1, rfm_segment: 'Lost', rfm_updated_at: '2025-03-10T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 0, is_active: false, churn_risk: 'high', preferred_channel: 'email', tags: [], created_at: '2024-07-15T00:00:00Z', updated_at: '2025-03-10T00:00:00Z' },
  { client_id: 1041, full_name: 'Євгенія Сергієнко', phone: '+380671234607', email: null, instagram: null, source_id: 1, first_order_date: '2025-12-01', last_order_date: '2026-03-30', total_orders: 4, total_spent: 2800.00, avg_order_value: 700.00, rfm_recency: 5, rfm_frequency: 2, rfm_monetary: 3, rfm_segment: 'Potential Loyal', rfm_updated_at: '2026-03-30T00:00:00Z', loyalty_tier: 'silver', loyalty_points: 730, is_active: true, churn_risk: 'low', preferred_channel: 'instagram', tags: [], created_at: '2025-12-01T00:00:00Z', updated_at: '2026-03-30T00:00:00Z' },
  { client_id: 1042, full_name: 'Олена Яковенко', phone: '+380931234608', email: 'olena.y@gmail.com', instagram: null, source_id: 2, first_order_date: '2025-10-15', last_order_date: '2026-03-28', total_orders: 3, total_spent: 1950.00, avg_order_value: 650.00, rfm_recency: 5, rfm_frequency: 2, rfm_monetary: 2, rfm_segment: 'Potential Loyal', rfm_updated_at: '2026-03-28T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 510, is_active: true, churn_risk: 'low', preferred_channel: 'email', tags: [], created_at: '2025-10-15T00:00:00Z', updated_at: '2026-03-28T00:00:00Z' },
  { client_id: 1043, full_name: 'Надія Прокопенко', phone: '+380501234609', email: null, instagram: 'nadiya_p', source_id: 1, first_order_date: '2025-11-20', last_order_date: '2026-03-22', total_orders: 3, total_spent: 2350.00, avg_order_value: 783.33, rfm_recency: 5, rfm_frequency: 2, rfm_monetary: 3, rfm_segment: 'Potential Loyal', rfm_updated_at: '2026-03-22T00:00:00Z', loyalty_tier: 'silver', loyalty_points: 620, is_active: true, churn_risk: 'low', preferred_channel: 'instagram', tags: [], created_at: '2025-11-20T00:00:00Z', updated_at: '2026-03-22T00:00:00Z' },
  { client_id: 1044, full_name: 'Тамара Василенко', phone: '+380671234610', email: null, instagram: null, source_id: 3, first_order_date: '2026-01-10', last_order_date: '2026-03-15', total_orders: 2, total_spent: 1100.00, avg_order_value: 550.00, rfm_recency: 5, rfm_frequency: 2, rfm_monetary: 2, rfm_segment: 'Potential Loyal', rfm_updated_at: '2026-03-15T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 290, is_active: true, churn_risk: 'low', preferred_channel: 'sms', tags: [], created_at: '2026-01-10T00:00:00Z', updated_at: '2026-03-15T00:00:00Z' },
  { client_id: 1045, full_name: 'Богдана Литвиненко', phone: '+380931234611', email: 'bogdana.l@gmail.com', instagram: 'bogdana_l', source_id: 1, first_order_date: '2026-02-01', last_order_date: '2026-03-20', total_orders: 2, total_spent: 870.00, avg_order_value: 435.00, rfm_recency: 5, rfm_frequency: 2, rfm_monetary: 2, rfm_segment: 'Potential Loyal', rfm_updated_at: '2026-03-20T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 230, is_active: true, churn_risk: 'low', preferred_channel: 'instagram', tags: [], created_at: '2026-02-01T00:00:00Z', updated_at: '2026-03-20T00:00:00Z' },
  { client_id: 1046, full_name: 'Вероніка Даниленко', phone: '+380501234612', email: null, instagram: null, source_id: 2, first_order_date: '2025-09-05', last_order_date: '2026-01-15', total_orders: 3, total_spent: 2100.00, avg_order_value: 700.00, rfm_recency: 3, rfm_frequency: 2, rfm_monetary: 3, rfm_segment: 'Need Attention', rfm_updated_at: '2026-01-15T00:00:00Z', loyalty_tier: 'silver', loyalty_points: 550, is_active: true, churn_risk: 'medium', preferred_channel: 'sms', tags: [], created_at: '2025-09-05T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
  { client_id: 1047, full_name: 'Інна Клименко', phone: '+380671234613', email: 'inna.k@gmail.com', instagram: 'inna_beauty', source_id: 1, first_order_date: '2025-07-20', last_order_date: '2026-01-05', total_orders: 4, total_spent: 3400.00, avg_order_value: 850.00, rfm_recency: 3, rfm_frequency: 2, rfm_monetary: 3, rfm_segment: 'Need Attention', rfm_updated_at: '2026-01-05T00:00:00Z', loyalty_tier: 'silver', loyalty_points: 890, is_active: true, churn_risk: 'medium', preferred_channel: 'instagram', tags: [], created_at: '2025-07-20T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { client_id: 1048, full_name: 'Світлана Захарченко', phone: '+380931234614', email: null, instagram: null, source_id: 3, first_order_date: '2025-06-10', last_order_date: '2025-12-28', total_orders: 3, total_spent: 1800.00, avg_order_value: 600.00, rfm_recency: 3, rfm_frequency: 2, rfm_monetary: 2, rfm_segment: 'About To Sleep', rfm_updated_at: '2025-12-28T00:00:00Z', loyalty_tier: 'bronze', loyalty_points: 470, is_active: true, churn_risk: 'medium', preferred_channel: 'sms', tags: [], created_at: '2025-06-10T00:00:00Z', updated_at: '2025-12-28T00:00:00Z' },
  { client_id: 1049, full_name: 'Раїса Баранова', phone: '+380501234615', email: 'raisa.b@gmail.com', instagram: null, source_id: 2, first_order_date: '2025-04-15', last_order_date: '2025-12-10', total_orders: 5, total_spent: 4500.00, avg_order_value: 900.00, rfm_recency: 3, rfm_frequency: 3, rfm_monetary: 4, rfm_segment: 'Need Attention', rfm_updated_at: '2025-12-10T00:00:00Z', loyalty_tier: 'silver', loyalty_points: 1180, is_active: true, churn_risk: 'medium', preferred_channel: 'email', tags: [], created_at: '2025-04-15T00:00:00Z', updated_at: '2025-12-10T00:00:00Z' },
  { client_id: 1050, full_name: 'Ганна Степаненко', phone: '+380671234616', email: null, instagram: 'ganna_st', source_id: 1, first_order_date: '2024-12-20', last_order_date: '2026-03-31', total_orders: 8, total_spent: 7200.00, avg_order_value: 900.00, rfm_recency: 5, rfm_frequency: 4, rfm_monetary: 4, rfm_segment: 'Loyal', rfm_updated_at: '2026-03-31T00:00:00Z', loyalty_tier: 'gold', loyalty_points: 1890, is_active: true, churn_risk: 'low', preferred_channel: 'instagram', tags: ['лояльний'], created_at: '2024-12-20T00:00:00Z', updated_at: '2026-03-31T00:00:00Z' },
];

// ═══════════════════════════════════════════════════
// CLIENT ORDERS
// ═══════════════════════════════════════════════════

export const clientOrders: ClientOrder[] = [
  // Champions: Олена Коваленко (1001) — 18 orders
  { id: 'uuid-order-1', client_id: 1001, order_id: 10001, order_date: '2024-03-15', status_id: 4, source_id: 1, total_amount: 850.00, products_count: 2, created_at: '2024-03-15T00:00:00Z' },
  { id: 'uuid-order-2', client_id: 1001, order_id: 10002, order_date: '2024-04-20', status_id: 4, source_id: 1, total_amount: 920.00, products_count: 3, created_at: '2024-04-20T00:00:00Z' },
  { id: 'uuid-order-3', client_id: 1001, order_id: 10003, order_date: '2024-06-01', status_id: 4, source_id: 1, total_amount: 780.00, products_count: 2, created_at: '2024-06-01T00:00:00Z' },
  { id: 'uuid-order-4', client_id: 1001, order_id: 10004, order_date: '2024-07-15', status_id: 4, source_id: 1, total_amount: 1100.00, products_count: 3, created_at: '2024-07-15T00:00:00Z' },
  { id: 'uuid-order-5', client_id: 1001, order_id: 10005, order_date: '2024-09-01', status_id: 4, source_id: 1, total_amount: 650.00, products_count: 1, created_at: '2024-09-01T00:00:00Z' },
  { id: 'uuid-order-6', client_id: 1001, order_id: 10006, order_date: '2024-10-20', status_id: 4, source_id: 1, total_amount: 1250.00, products_count: 4, created_at: '2024-10-20T00:00:00Z' },
  { id: 'uuid-order-7', client_id: 1001, order_id: 10007, order_date: '2024-12-05', status_id: 4, source_id: 1, total_amount: 900.00, products_count: 2, created_at: '2024-12-05T00:00:00Z' },
  { id: 'uuid-order-8', client_id: 1001, order_id: 10008, order_date: '2025-01-15', status_id: 4, source_id: 1, total_amount: 1050.00, products_count: 3, created_at: '2025-01-15T00:00:00Z' },
  { id: 'uuid-order-9', client_id: 1001, order_id: 10009, order_date: '2025-03-01', status_id: 4, source_id: 1, total_amount: 780.00, products_count: 2, created_at: '2025-03-01T00:00:00Z' },
  { id: 'uuid-order-10', client_id: 1001, order_id: 10010, order_date: '2025-04-10', status_id: 4, source_id: 1, total_amount: 920.00, products_count: 2, created_at: '2025-04-10T00:00:00Z' },
  { id: 'uuid-order-11', client_id: 1001, order_id: 10011, order_date: '2025-05-20', status_id: 4, source_id: 1, total_amount: 650.00, products_count: 1, created_at: '2025-05-20T00:00:00Z' },
  { id: 'uuid-order-12', client_id: 1001, order_id: 10012, order_date: '2025-07-01', status_id: 4, source_id: 1, total_amount: 1100.00, products_count: 3, created_at: '2025-07-01T00:00:00Z' },
  { id: 'uuid-order-13', client_id: 1001, order_id: 10013, order_date: '2025-08-15', status_id: 4, source_id: 1, total_amount: 850.00, products_count: 2, created_at: '2025-08-15T00:00:00Z' },
  { id: 'uuid-order-14', client_id: 1001, order_id: 10014, order_date: '2025-10-01', status_id: 4, source_id: 1, total_amount: 780.00, products_count: 2, created_at: '2025-10-01T00:00:00Z' },
  { id: 'uuid-order-15', client_id: 1001, order_id: 10015, order_date: '2025-11-20', status_id: 4, source_id: 1, total_amount: 1250.00, products_count: 3, created_at: '2025-11-20T00:00:00Z' },
  { id: 'uuid-order-16', client_id: 1001, order_id: 10016, order_date: '2026-01-05', status_id: 4, source_id: 1, total_amount: 920.00, products_count: 2, created_at: '2026-01-05T00:00:00Z' },
  { id: 'uuid-order-17', client_id: 1001, order_id: 10017, order_date: '2026-02-15', status_id: 4, source_id: 1, total_amount: 650.00, products_count: 1, created_at: '2026-02-15T00:00:00Z' },
  { id: 'uuid-order-18', client_id: 1001, order_id: 10018, order_date: '2026-03-28', status_id: 4, source_id: 1, total_amount: 800.00, products_count: 2, created_at: '2026-03-28T00:00:00Z' },
  // Loyal: Ганна Степаненко (1050) — 8 orders
  { id: 'uuid-order-19', client_id: 1050, order_id: 10050, order_date: '2024-12-20', status_id: 4, source_id: 1, total_amount: 920.00, products_count: 2, created_at: '2024-12-20T00:00:00Z' },
  { id: 'uuid-order-20', client_id: 1050, order_id: 10051, order_date: '2025-02-10', status_id: 4, source_id: 1, total_amount: 850.00, products_count: 2, created_at: '2025-02-10T00:00:00Z' },
  { id: 'uuid-order-21', client_id: 1050, order_id: 10052, order_date: '2025-04-15', status_id: 4, source_id: 1, total_amount: 780.00, products_count: 2, created_at: '2025-04-15T00:00:00Z' },
  { id: 'uuid-order-22', client_id: 1050, order_id: 10053, order_date: '2025-06-20', status_id: 4, source_id: 1, total_amount: 1100.00, products_count: 3, created_at: '2025-06-20T00:00:00Z' },
  { id: 'uuid-order-23', client_id: 1050, order_id: 10054, order_date: '2025-08-10', status_id: 4, source_id: 1, total_amount: 650.00, products_count: 1, created_at: '2025-08-10T00:00:00Z' },
  { id: 'uuid-order-24', client_id: 1050, order_id: 10055, order_date: '2025-10-25', status_id: 4, source_id: 1, total_amount: 1200.00, products_count: 3, created_at: '2025-10-25T00:00:00Z' },
  { id: 'uuid-order-25', client_id: 1050, order_id: 10056, order_date: '2026-01-15', status_id: 4, source_id: 1, total_amount: 900.00, products_count: 2, created_at: '2026-01-15T00:00:00Z' },
  { id: 'uuid-order-26', client_id: 1050, order_id: 10057, order_date: '2026-03-31', status_id: 4, source_id: 1, total_amount: 800.00, products_count: 2, created_at: '2026-03-31T00:00:00Z' },
  // New Customer: Людмила Павленко (1011)
  { id: 'uuid-order-27', client_id: 1011, order_id: 10100, order_date: '2026-03-25', status_id: 4, source_id: 2, total_amount: 520.00, products_count: 1, created_at: '2026-03-25T00:00:00Z' },
  // New Customer: Дарина Лисенко (1012)
  { id: 'uuid-order-28', client_id: 1012, order_id: 10101, order_date: '2026-03-20', status_id: 4, source_id: 1, total_amount: 720.00, products_count: 2, created_at: '2026-03-20T00:00:00Z' },
  // At Risk: Єлизавета Власенко (1027) — 8 orders
  { id: 'uuid-order-29', client_id: 1027, order_id: 10200, order_date: '2024-04-10', status_id: 4, source_id: 1, total_amount: 800.00, products_count: 2, created_at: '2024-04-10T00:00:00Z' },
  { id: 'uuid-order-30', client_id: 1027, order_id: 10201, order_date: '2024-06-15', status_id: 4, source_id: 1, total_amount: 750.00, products_count: 2, created_at: '2024-06-15T00:00:00Z' },
  { id: 'uuid-order-31', client_id: 1027, order_id: 10202, order_date: '2024-08-20', status_id: 4, source_id: 1, total_amount: 900.00, products_count: 2, created_at: '2024-08-20T00:00:00Z' },
  { id: 'uuid-order-32', client_id: 1027, order_id: 10203, order_date: '2024-11-01', status_id: 4, source_id: 1, total_amount: 850.00, products_count: 2, created_at: '2024-11-01T00:00:00Z' },
  { id: 'uuid-order-33', client_id: 1027, order_id: 10204, order_date: '2025-01-15', status_id: 4, source_id: 1, total_amount: 700.00, products_count: 2, created_at: '2025-01-15T00:00:00Z' },
  { id: 'uuid-order-34', client_id: 1027, order_id: 10205, order_date: '2025-04-10', status_id: 4, source_id: 1, total_amount: 800.00, products_count: 2, created_at: '2025-04-10T00:00:00Z' },
  { id: 'uuid-order-35', client_id: 1027, order_id: 10206, order_date: '2025-07-01', status_id: 4, source_id: 1, total_amount: 750.00, products_count: 2, created_at: '2025-07-01T00:00:00Z' },
  { id: 'uuid-order-36', client_id: 1027, order_id: 10207, order_date: '2025-10-05', status_id: 4, source_id: 1, total_amount: 850.00, products_count: 2, created_at: '2025-10-05T00:00:00Z' },
  // Can't Lose: Ангеліна Панченко (1031) — 12 orders
  { id: 'uuid-order-37', client_id: 1031, order_id: 10300, order_date: '2024-02-10', status_id: 4, source_id: 2, total_amount: 1050.00, products_count: 3, created_at: '2024-02-10T00:00:00Z' },
  { id: 'uuid-order-38', client_id: 1031, order_id: 10301, order_date: '2024-03-20', status_id: 4, source_id: 2, total_amount: 920.00, products_count: 2, created_at: '2024-03-20T00:00:00Z' },
  { id: 'uuid-order-39', client_id: 1031, order_id: 10302, order_date: '2024-05-01', status_id: 4, source_id: 2, total_amount: 1100.00, products_count: 3, created_at: '2024-05-01T00:00:00Z' },
  { id: 'uuid-order-40', client_id: 1031, order_id: 10303, order_date: '2024-06-15', status_id: 4, source_id: 2, total_amount: 850.00, products_count: 2, created_at: '2024-06-15T00:00:00Z' },
  { id: 'uuid-order-41', client_id: 1031, order_id: 10304, order_date: '2024-08-01', status_id: 4, source_id: 2, total_amount: 1200.00, products_count: 3, created_at: '2024-08-01T00:00:00Z' },
  { id: 'uuid-order-42', client_id: 1031, order_id: 10305, order_date: '2024-09-20', status_id: 4, source_id: 2, total_amount: 980.00, products_count: 2, created_at: '2024-09-20T00:00:00Z' },
  { id: 'uuid-order-43', client_id: 1031, order_id: 10306, order_date: '2024-11-05', status_id: 4, source_id: 2, total_amount: 1100.00, products_count: 3, created_at: '2024-11-05T00:00:00Z' },
  { id: 'uuid-order-44', client_id: 1031, order_id: 10307, order_date: '2025-01-10', status_id: 4, source_id: 2, total_amount: 1050.00, products_count: 2, created_at: '2025-01-10T00:00:00Z' },
  { id: 'uuid-order-45', client_id: 1031, order_id: 10308, order_date: '2025-03-15', status_id: 4, source_id: 2, total_amount: 920.00, products_count: 2, created_at: '2025-03-15T00:00:00Z' },
  { id: 'uuid-order-46', client_id: 1031, order_id: 10309, order_date: '2025-05-01', status_id: 4, source_id: 2, total_amount: 1080.00, products_count: 3, created_at: '2025-05-01T00:00:00Z' },
  { id: 'uuid-order-47', client_id: 1031, order_id: 10310, order_date: '2025-06-20', status_id: 4, source_id: 2, total_amount: 1250.00, products_count: 3, created_at: '2025-06-20T00:00:00Z' },
  { id: 'uuid-order-48', client_id: 1031, order_id: 10311, order_date: '2025-08-01', status_id: 4, source_id: 2, total_amount: 1000.00, products_count: 2, created_at: '2025-08-01T00:00:00Z' },
];

// ═══════════════════════════════════════════════════
// CLIENT ORDER ITEMS
// ═══════════════════════════════════════════════════

export const clientOrderItems: ClientOrderItem[] = [
  { id: 'uuid-item-1', order_id: 10001, client_id: 1001, barcode: '4820001005', product_name: 'Крем для обличчя денний 50мл', quantity: 1, price: 520.00 },
  { id: 'uuid-item-2', order_id: 10001, client_id: 1001, barcode: '4820001008', product_name: 'Тонік для обличчя 150мл', quantity: 1, price: 340.00 },
  { id: 'uuid-item-3', order_id: 10018, client_id: 1001, barcode: '4820001007', product_name: 'Сироватка гіалуронова 30мл', quantity: 1, price: 720.00 },
  { id: 'uuid-item-4', order_id: 10018, client_id: 1001, barcode: '4820001011', product_name: 'Бальзам для губ 15мл', quantity: 1, price: 95.00 },
  { id: 'uuid-item-5', order_id: 10100, client_id: 1011, barcode: '4820001005', product_name: 'Крем для обличчя денний 50мл', quantity: 1, price: 520.00 },
  { id: 'uuid-item-6', order_id: 10101, client_id: 1012, barcode: '4820001001', product_name: 'Шампунь відновлюючий 250мл', quantity: 1, price: 285.00 },
  { id: 'uuid-item-7', order_id: 10101, client_id: 1012, barcode: '4820001002', product_name: 'Кондиціонер зволожуючий 250мл', quantity: 1, price: 310.00 },
];

// ═══════════════════════════════════════════════════
// COMMUNICATION LOGS
// ═══════════════════════════════════════════════════

export const communicationLogs: CommunicationLog[] = [
  { id: 'uuid-comm-1', client_id: 1001, communication_type: 'replenishment', channel: 'instagram', template_id: 'replenishment_instagram', message_preview: 'Олена, ваш крем закінчується!', status: 'clicked', ab_variant: null, sent_at: '2026-03-15T10:30:00+02:00', opened_at: '2026-03-15T11:00:00+02:00', clicked_at: '2026-03-15T11:05:00+02:00' },
  { id: 'uuid-comm-2', client_id: 1002, communication_type: 'replenishment', channel: 'instagram', template_id: 'replenishment_instagram', message_preview: 'Марія, ваша сироватка закінчується!', status: 'opened', ab_variant: null, sent_at: '2026-03-16T10:30:00+02:00', opened_at: '2026-03-16T14:20:00+02:00', clicked_at: null },
  { id: 'uuid-comm-3', client_id: 1003, communication_type: 'replenishment', channel: 'sms', template_id: 'replenishment_sms', message_preview: 'Анна, ваш шампунь закінчується!', status: 'sent', ab_variant: null, sent_at: '2026-03-17T10:30:00+02:00', opened_at: null, clicked_at: null },
  { id: 'uuid-comm-4', client_id: 1011, communication_type: 'welcome', channel: 'sms', template_id: 'welcome_sms_1', message_preview: 'Людмила, дякуємо за першу покупку!', status: 'delivered', ab_variant: 'A', sent_at: '2026-03-25T12:00:00+02:00', opened_at: null, clicked_at: null },
  { id: 'uuid-comm-5', client_id: 1012, communication_type: 'welcome', channel: 'instagram', template_id: 'welcome_sms_1b', message_preview: 'Вітаємо, Дарина! Вам нараховано 50 балів!', status: 'opened', ab_variant: 'B', sent_at: '2026-03-20T14:00:00+02:00', opened_at: '2026-03-20T15:30:00+02:00', clicked_at: null },
  { id: 'uuid-comm-6', client_id: 1027, communication_type: 'win_back', channel: 'instagram', template_id: 'winback_warm_sms', message_preview: 'Єлизавета, ми сумуємо!', status: 'clicked', ab_variant: null, sent_at: '2026-03-01T10:00:00+02:00', opened_at: '2026-03-01T12:00:00+02:00', clicked_at: '2026-03-01T12:10:00+02:00' },
  { id: 'uuid-comm-7', client_id: 1031, communication_type: 'win_back', channel: 'sms', template_id: 'winback_cold_sms', message_preview: 'Ангеліна, давно не бачились!', status: 'sent', ab_variant: null, sent_at: '2026-02-15T10:00:00+02:00', opened_at: null, clicked_at: null },
  { id: 'uuid-comm-8', client_id: 1050, communication_type: 'post_purchase', channel: 'instagram', template_id: 'post_purchase_1', message_preview: 'Ганна, ваше замовлення доставлено!', status: 'opened', ab_variant: null, sent_at: '2026-04-01T11:00:00+02:00', opened_at: '2026-04-01T13:00:00+02:00', clicked_at: null },
  { id: 'uuid-comm-9', client_id: 1004, communication_type: 'replenishment', channel: 'instagram', template_id: 'replenishment_instagram', message_preview: 'Катерина, ваш тонік закінчується!', status: 'clicked', ab_variant: null, sent_at: '2026-03-10T10:30:00+02:00', opened_at: '2026-03-10T11:45:00+02:00', clicked_at: '2026-03-10T12:00:00+02:00' },
  { id: 'uuid-comm-10', client_id: 1005, communication_type: 'campaign', channel: 'instagram', template_id: null, message_preview: '8 Березня! Знижка -20% на все!', status: 'opened', ab_variant: null, sent_at: '2026-03-08T09:00:00+02:00', opened_at: '2026-03-08T10:00:00+02:00', clicked_at: null },
  { id: 'uuid-comm-11', client_id: 1006, communication_type: 'campaign', channel: 'email', template_id: null, message_preview: 'Весняний розпродаж!', status: 'clicked', ab_variant: null, sent_at: '2026-03-01T08:00:00+02:00', opened_at: '2026-03-01T09:30:00+02:00', clicked_at: '2026-03-01T09:45:00+02:00' },
  { id: 'uuid-comm-12', client_id: 1021, communication_type: 'win_back', channel: 'sms', template_id: 'winback_warm_sms', message_preview: 'Лариса, ми сумуємо!', status: 'sent', ab_variant: null, sent_at: '2026-03-20T10:00:00+02:00', opened_at: null, clicked_at: null },
  { id: 'uuid-comm-13', client_id: 1022, communication_type: 'win_back', channel: 'instagram', template_id: 'winback_warm_sms', message_preview: 'Галина, давно не бачились!', status: 'opened', ab_variant: null, sent_at: '2026-03-18T10:00:00+02:00', opened_at: '2026-03-18T16:00:00+02:00', clicked_at: null },
];

// ═══════════════════════════════════════════════════
// COMMUNICATION TEMPLATES
// ═══════════════════════════════════════════════════

export const communicationTemplates: CommunicationTemplate[] = [
  { id: 'replenishment_sms', communication_type: 'replenishment', channel: 'sms', subject: null, body_template: '{{name}}, ваш {{product}} закінчується! Замовте зі знижкою -10% \u{1F486}\u200D\u2640\uFE0F', is_active: true, ab_variant: null },
  { id: 'replenishment_instagram', communication_type: 'replenishment', channel: 'instagram', subject: null, body_template: 'Привіт, {{name}}! \u{1F44B} Ваш {{product}} скоро закінчиться. Хочете замовити ще? Для вас знижка -10%!', is_active: true, ab_variant: null },
  { id: 'welcome_sms_1', communication_type: 'welcome', channel: 'sms', subject: null, body_template: '{{name}}, дякуємо за першу покупку! Ваш бонус: 50 балів \u{1F381}', is_active: true, ab_variant: 'A' },
  { id: 'welcome_sms_1b', communication_type: 'welcome', channel: 'sms', subject: null, body_template: 'Вітаємо, {{name}}! \u{1F389} Вам нараховано 50 бонусних балів за першу покупку!', is_active: true, ab_variant: 'B' },
  { id: 'welcome_sms_2', communication_type: 'welcome', channel: 'sms', subject: null, body_template: '{{name}}, як вам наш {{product}}? Потрібна допомога з використанням?', is_active: true, ab_variant: null },
  { id: 'welcome_sms_3', communication_type: 'welcome', channel: 'sms', subject: null, body_template: '{{name}}, ось що ще обирають наші клієнти: {{cross_sell}}', is_active: true, ab_variant: null },
  { id: 'welcome_sms_4', communication_type: 'welcome', channel: 'sms', subject: null, body_template: '{{name}}, спеціально для вас: знижка -15% на друге замовлення! Код: WELCOME15', is_active: true, ab_variant: null },
  { id: 'winback_warm_sms', communication_type: 'win_back', channel: 'sms', subject: null, body_template: '{{name}}, ми сумуємо! Ось персональна знижка -10% \u{1F49D}', is_active: true, ab_variant: null },
  { id: 'winback_cold_sms', communication_type: 'win_back', channel: 'sms', subject: null, body_template: '{{name}}, давно не бачились! Подарунок при замовленні від 500 грн \u{1F381}', is_active: true, ab_variant: null },
  { id: 'winback_lost_sms', communication_type: 'win_back', channel: 'sms', subject: null, body_template: '{{name}}, останній шанс! Ексклюзивна пропозиція -20% тільки для вас \u26A1', is_active: true, ab_variant: null },
  { id: 'post_purchase_1', communication_type: 'post_purchase', channel: 'sms', subject: null, body_template: '{{name}}, ваше замовлення доставлено! Все ок? \u{1F4E6}', is_active: true, ab_variant: null },
  { id: 'post_purchase_2', communication_type: 'post_purchase', channel: 'sms', subject: null, body_template: '{{name}}, як вам {{product}}? Оцініть від 1 до 5 \u2B50', is_active: true, ab_variant: null },
  { id: 'post_purchase_3', communication_type: 'post_purchase', channel: 'sms', subject: null, body_template: '{{name}}, вам також може сподобатись: {{cross_sell}}', is_active: true, ab_variant: null },
  { id: 'post_purchase_4', communication_type: 'post_purchase', channel: 'sms', subject: null, body_template: '{{name}}, залиште відгук і отримайте 100 бонусних балів! \u270D\uFE0F', is_active: true, ab_variant: null },
  { id: 'abandoned_cart_1', communication_type: 'abandoned_cart', channel: 'sms', subject: null, body_template: '{{name}}, ви забули оформити замовлення! Ваші товари чекають \u{1F6D2}', is_active: true, ab_variant: null },
  { id: 'abandoned_cart_2', communication_type: 'abandoned_cart', channel: 'sms', subject: null, body_template: '{{name}}, ваш кошик сумує! Завершіть покупку зі знижкою -5% \u{1F381}', is_active: true, ab_variant: null },
];

// ═══════════════════════════════════════════════════
// CLIENT PURCHASES (replenishment data)
// ═══════════════════════════════════════════════════

export const clientPurchases: ClientPurchase[] = [
  { id: 'uuid-purch-1', client_id: 1001, barcode: '4820001007', product_name: 'Сироватка гіалуронова 30мл', quantity: 1, usage_days: 45, total_usage_days: 45, purchase_date: '2026-03-28', expected_end_date: '2026-05-12', reminder_date: '2026-05-09', reminder_sent: false, source_channel: 'webhook' },
  { id: 'uuid-purch-2', client_id: 1001, barcode: '4820001011', product_name: 'Бальзам для губ 15мл', quantity: 2, usage_days: 15, total_usage_days: 30, purchase_date: '2026-03-28', expected_end_date: '2026-04-27', reminder_date: '2026-04-24', reminder_sent: false, source_channel: 'webhook' },
  { id: 'uuid-purch-3', client_id: 1001, barcode: '4820001005', product_name: 'Крем для обличчя денний 50мл', quantity: 1, usage_days: 30, total_usage_days: 30, purchase_date: '2026-02-15', expected_end_date: '2026-03-17', reminder_date: '2026-03-14', reminder_sent: false, source_channel: 'webhook' },
  { id: 'uuid-purch-4', client_id: 1011, barcode: '4820001005', product_name: 'Крем для обличчя денний 50мл', quantity: 1, usage_days: 30, total_usage_days: 30, purchase_date: '2026-03-25', expected_end_date: '2026-04-24', reminder_date: '2026-04-21', reminder_sent: false, source_channel: 'webhook' },
  { id: 'uuid-purch-5', client_id: 1012, barcode: '4820001001', product_name: 'Шампунь відновлюючий 250мл', quantity: 1, usage_days: 30, total_usage_days: 30, purchase_date: '2026-03-20', expected_end_date: '2026-04-19', reminder_date: '2026-04-16', reminder_sent: false, source_channel: 'webhook' },
  { id: 'uuid-purch-6', client_id: 1012, barcode: '4820001002', product_name: 'Кондиціонер зволожуючий 250мл', quantity: 1, usage_days: 30, total_usage_days: 30, purchase_date: '2026-03-20', expected_end_date: '2026-04-19', reminder_date: '2026-04-16', reminder_sent: false, source_channel: 'webhook' },
  // Overdue reminders
  { id: 'uuid-purch-7', client_id: 1003, barcode: '4820001009', product_name: 'Міцелярна вода 400мл', quantity: 1, usage_days: 45, total_usage_days: 45, purchase_date: '2026-01-15', expected_end_date: '2026-03-01', reminder_date: '2026-02-26', reminder_sent: false, source_channel: 'hourly' },
  { id: 'uuid-purch-8', client_id: 1005, barcode: '4820001010', product_name: 'Крем для рук 75мл', quantity: 2, usage_days: 20, total_usage_days: 40, purchase_date: '2026-02-10', expected_end_date: '2026-03-22', reminder_date: '2026-03-19', reminder_sent: false, source_channel: 'hourly' },
  { id: 'uuid-purch-9', client_id: 1006, barcode: '4820001001', product_name: 'Шампунь відновлюючий 250мл', quantity: 1, usage_days: 30, total_usage_days: 30, purchase_date: '2026-02-20', expected_end_date: '2026-03-22', reminder_date: '2026-03-19', reminder_sent: false, source_channel: 'webhook' },
];

// ═══════════════════════════════════════════════════
// AUTOMATION QUEUE
// ═══════════════════════════════════════════════════

export const automationQueue: AutomationQueueItem[] = [
  { id: 'uuid-auto-1', client_id: 1011, automation_type: 'welcome', trigger_data: { step: 2, product: 'Крем для обличчя денний 50мл' }, scheduled_at: '2026-04-04T12:00:00+02:00', status: 'pending', skip_reason: null, created_at: '2026-03-25T12:00:00Z' },
  { id: 'uuid-auto-2', client_id: 1011, automation_type: 'welcome', trigger_data: { step: 3, cross_sell: ['Крем нічний', 'Сироватка'] }, scheduled_at: '2026-04-08T12:00:00+02:00', status: 'pending', skip_reason: null, created_at: '2026-03-25T12:00:00Z' },
  { id: 'uuid-auto-3', client_id: 1011, automation_type: 'welcome', trigger_data: { step: 4, offer: '-15%' }, scheduled_at: '2026-04-15T12:00:00+02:00', status: 'pending', skip_reason: null, created_at: '2026-03-25T12:00:00Z' },
  { id: 'uuid-auto-4', client_id: 1012, automation_type: 'welcome', trigger_data: { step: 2, product: 'Шампунь відновлюючий' }, scheduled_at: '2026-04-02T14:00:00+02:00', status: 'pending', skip_reason: null, created_at: '2026-03-20T14:00:00Z' },
  { id: 'uuid-auto-5', client_id: 1001, automation_type: 'replenishment', trigger_data: { barcode: '4820001005', product: 'Крем для обличчя денний' }, scheduled_at: '2026-04-03T10:00:00+02:00', status: 'pending', skip_reason: null, created_at: '2026-03-14T10:00:00Z' },
  { id: 'uuid-auto-6', client_id: 1027, automation_type: 'win_back', trigger_data: { tier: 'cold', offer: '-15%' }, scheduled_at: '2026-04-03T10:00:00+02:00', status: 'pending', skip_reason: null, created_at: '2026-03-01T10:00:00Z' },
  { id: 'uuid-auto-7', client_id: 1031, automation_type: 'win_back', trigger_data: { tier: 'lost', offer: '-20%' }, scheduled_at: '2026-04-03T10:00:00+02:00', status: 'pending', skip_reason: null, created_at: '2026-02-15T10:00:00Z' },
  { id: 'uuid-auto-8', client_id: 1050, automation_type: 'post_purchase', trigger_data: { step: 2, product: 'Крем денний' }, scheduled_at: '2026-04-05T11:00:00+02:00', status: 'pending', skip_reason: null, created_at: '2026-03-31T11:00:00Z' },
  // Sent
  { id: 'uuid-auto-9', client_id: 1011, automation_type: 'welcome', trigger_data: { step: 1 }, scheduled_at: '2026-03-25T12:00:00+02:00', status: 'sent', skip_reason: null, created_at: '2026-03-25T12:00:00Z' },
  { id: 'uuid-auto-10', client_id: 1012, automation_type: 'welcome', trigger_data: { step: 1 }, scheduled_at: '2026-03-20T14:00:00+02:00', status: 'sent', skip_reason: null, created_at: '2026-03-20T14:00:00Z' },
  // Skipped
  { id: 'uuid-auto-11', client_id: 1033, automation_type: 'win_back', trigger_data: { tier: 'cold' }, scheduled_at: '2026-03-20T10:00:00+02:00', status: 'skipped', skip_reason: 'frequency_limit', created_at: '2026-03-20T10:00:00Z' },
];

// ═══════════════════════════════════════════════════
// WIN-BACK CANDIDATES
// ═══════════════════════════════════════════════════

export const winBackCandidates: WinBackCandidate[] = [
  { client_id: 1027, last_order_date: '2025-10-05', days_inactive: 180, tier: 'cold', win_back_sent: true, win_back_date: '2026-03-01' },
  { client_id: 1028, last_order_date: '2025-09-30', days_inactive: 185, tier: 'cold', win_back_sent: true, win_back_date: '2026-02-15' },
  { client_id: 1029, last_order_date: '2025-09-15', days_inactive: 200, tier: 'lost', win_back_sent: false, win_back_date: null },
  { client_id: 1030, last_order_date: '2025-08-20', days_inactive: 226, tier: 'lost', win_back_sent: false, win_back_date: null },
  { client_id: 1031, last_order_date: '2025-08-01', days_inactive: 245, tier: 'lost', win_back_sent: true, win_back_date: '2026-02-15' },
  { client_id: 1032, last_order_date: '2025-07-15', days_inactive: 262, tier: 'lost', win_back_sent: true, win_back_date: '2026-01-20' },
  { client_id: 1033, last_order_date: '2025-09-10', days_inactive: 205, tier: 'lost', win_back_sent: false, win_back_date: null },
  { client_id: 1034, last_order_date: '2025-08-25', days_inactive: 221, tier: 'lost', win_back_sent: false, win_back_date: null },
  { client_id: 1024, last_order_date: '2025-11-15', days_inactive: 139, tier: 'cold', win_back_sent: false, win_back_date: null },
  { client_id: 1025, last_order_date: '2025-11-01', days_inactive: 153, tier: 'cold', win_back_sent: false, win_back_date: null },
  { client_id: 1026, last_order_date: '2025-10-20', days_inactive: 165, tier: 'cold', win_back_sent: false, win_back_date: null },
];

// ═══════════════════════════════════════════════════
// LOYALTY TIERS (4 tiers)
// ═══════════════════════════════════════════════════

export const loyaltyTiers: LoyaltyTier[] = [
  { tier_name: 'bronze', min_total_spent: 0, min_orders: 1, cashback_percent: 3, bonus_multiplier: 1.0, perks: 'Базові привілеї', sort_order: 1 },
  { tier_name: 'silver', min_total_spent: 2000, min_orders: 3, cashback_percent: 5, bonus_multiplier: 1.5, perks: 'Безкоштовна доставка', sort_order: 2 },
  { tier_name: 'gold', min_total_spent: 5000, min_orders: 7, cashback_percent: 7, bonus_multiplier: 2.0, perks: 'Ранній доступ до новинок', sort_order: 3 },
  { tier_name: 'platinum', min_total_spent: 15000, min_orders: 15, cashback_percent: 10, bonus_multiplier: 3.0, perks: 'VIP підтримка, персональний менеджер', sort_order: 4 },
];

// ═══════════════════════════════════════════════════
// LOYALTY TRANSACTIONS
// ═══════════════════════════════════════════════════

export const loyaltyTransactions: LoyaltyTransaction[] = [
  { id: 'uuid-lt-1', client_id: 1001, transaction_type: 'earn', points: 850, reason: 'order_10001', order_id: 10001, created_at: '2024-03-15T00:00:00Z' },
  { id: 'uuid-lt-2', client_id: 1001, transaction_type: 'earn', points: 920, reason: 'order_10002', order_id: 10002, created_at: '2024-04-20T00:00:00Z' },
  { id: 'uuid-lt-3', client_id: 1001, transaction_type: 'earn', points: 500, reason: 'level_up', order_id: null, created_at: '2024-04-20T00:00:00Z' },
  { id: 'uuid-lt-4', client_id: 1001, transaction_type: 'earn', points: 800, reason: 'order_10018', order_id: 10018, created_at: '2026-03-28T00:00:00Z' },
  { id: 'uuid-lt-5', client_id: 1001, transaction_type: 'spend', points: -300, reason: 'discount_order_10015', order_id: 10015, created_at: '2025-11-20T00:00:00Z' },
  { id: 'uuid-lt-6', client_id: 1001, transaction_type: 'earn', points: 200, reason: 'birthday', order_id: null, created_at: '2025-06-15T00:00:00Z' },
  { id: 'uuid-lt-7', client_id: 1011, transaction_type: 'earn', points: 50, reason: 'welcome_bonus', order_id: null, created_at: '2026-03-25T00:00:00Z' },
  { id: 'uuid-lt-8', client_id: 1012, transaction_type: 'earn', points: 50, reason: 'welcome_bonus', order_id: null, created_at: '2026-03-20T00:00:00Z' },
  { id: 'uuid-lt-9', client_id: 1012, transaction_type: 'earn', points: 720, reason: 'order_10101', order_id: 10101, created_at: '2026-03-20T00:00:00Z' },
  { id: 'uuid-lt-10', client_id: 1050, transaction_type: 'earn', points: 920, reason: 'order_10050', order_id: 10050, created_at: '2024-12-20T00:00:00Z' },
  { id: 'uuid-lt-11', client_id: 1050, transaction_type: 'earn', points: 800, reason: 'order_10057', order_id: 10057, created_at: '2026-03-31T00:00:00Z' },
  { id: 'uuid-lt-12', client_id: 1050, transaction_type: 'earn', points: 500, reason: 'level_up', order_id: null, created_at: '2025-06-20T00:00:00Z' },
  { id: 'uuid-lt-13', client_id: 1031, transaction_type: 'earn', points: 1050, reason: 'order_10300', order_id: 10300, created_at: '2024-02-10T00:00:00Z' },
  { id: 'uuid-lt-14', client_id: 1031, transaction_type: 'earn', points: 500, reason: 'level_up', order_id: null, created_at: '2024-05-01T00:00:00Z' },
  { id: 'uuid-lt-15', client_id: 1031, transaction_type: 'earn', points: 500, reason: 'level_up', order_id: null, created_at: '2024-09-20T00:00:00Z' },
  { id: 'uuid-lt-16', client_id: 1027, transaction_type: 'earn', points: 800, reason: 'order_10200', order_id: 10200, created_at: '2024-04-10T00:00:00Z' },
  { id: 'uuid-lt-17', client_id: 1027, transaction_type: 'earn', points: 500, reason: 'level_up', order_id: null, created_at: '2025-01-15T00:00:00Z' },
];

// ═══════════════════════════════════════════════════
// RFM CONFIG (15 entries)
// ═══════════════════════════════════════════════════

export const rfmConfig: RfmConfig[] = [
  { metric: 'recency', score: 5, min_value: 0, max_value: 15 },
  { metric: 'recency', score: 4, min_value: 16, max_value: 30 },
  { metric: 'recency', score: 3, min_value: 31, max_value: 60 },
  { metric: 'recency', score: 2, min_value: 61, max_value: 120 },
  { metric: 'recency', score: 1, min_value: 121, max_value: 9999 },
  { metric: 'frequency', score: 5, min_value: 10, max_value: 9999 },
  { metric: 'frequency', score: 4, min_value: 7, max_value: 9 },
  { metric: 'frequency', score: 3, min_value: 4, max_value: 6 },
  { metric: 'frequency', score: 2, min_value: 2, max_value: 3 },
  { metric: 'frequency', score: 1, min_value: 1, max_value: 1 },
  { metric: 'monetary', score: 5, min_value: 10000, max_value: 999999 },
  { metric: 'monetary', score: 4, min_value: 5000, max_value: 9999 },
  { metric: 'monetary', score: 3, min_value: 2000, max_value: 4999 },
  { metric: 'monetary', score: 2, min_value: 500, max_value: 1999 },
  { metric: 'monetary', score: 1, min_value: 0, max_value: 499 },
];

// ═══════════════════════════════════════════════════
// RFM SEGMENTS (11 segments)
// ═══════════════════════════════════════════════════

export const rfmSegments: RfmSegment[] = [
  { segment_name: 'Champions', r_scores: [5], f_scores: [5], m_scores: [5], color: '#22c55e', priority: 1, recommended_action: 'VIP-оффери, ексклюзив', communication_frequency_days: 7 },
  { segment_name: 'Loyal', r_scores: [4, 5], f_scores: [3, 4, 5], m_scores: [3, 4, 5], color: '#3b82f6', priority: 2, recommended_action: 'Upsell, програма лояльності', communication_frequency_days: 5 },
  { segment_name: 'Potential Loyal', r_scores: [4, 5], f_scores: [1, 2], m_scores: [1, 2], color: '#8b5cf6', priority: 3, recommended_action: 'Стимулювати 2-3 покупку', communication_frequency_days: 5 },
  { segment_name: 'New Customers', r_scores: [5], f_scores: [1], m_scores: [1], color: '#06b6d4', priority: 4, recommended_action: 'Welcome flow, onboarding', communication_frequency_days: 3 },
  { segment_name: 'Promising', r_scores: [3, 4], f_scores: [1, 2], m_scores: [1, 2], color: '#f59e0b', priority: 5, recommended_action: 'Нагадування, знижка', communication_frequency_days: 5 },
  { segment_name: 'Need Attention', r_scores: [3], f_scores: [3, 4], m_scores: [3, 4], color: '#f97316', priority: 6, recommended_action: 'Реактивація, спеціальна акція', communication_frequency_days: 3 },
  { segment_name: 'About To Sleep', r_scores: [2, 3], f_scores: [2, 3], m_scores: [2, 3], color: '#ef4444', priority: 7, recommended_action: "Win-back м'який", communication_frequency_days: 3 },
  { segment_name: 'At Risk', r_scores: [1, 2], f_scores: [3, 4, 5], m_scores: [3, 4, 5], color: '#dc2626', priority: 8, recommended_action: 'Win-back терміновий (цінні!)', communication_frequency_days: 2 },
  { segment_name: "Can't Lose Them", r_scores: [1], f_scores: [5], m_scores: [5], color: '#991b1b', priority: 9, recommended_action: 'Агресивний win-back, дзвінок', communication_frequency_days: 1 },
  { segment_name: 'Hibernating', r_scores: [1, 2], f_scores: [1, 2], m_scores: [1, 2], color: '#6b7280', priority: 10, recommended_action: 'Останній шанс або відпустити', communication_frequency_days: 7 },
  { segment_name: 'Lost', r_scores: [1], f_scores: [1], m_scores: [1], color: '#374151', priority: 11, recommended_action: 'Не витрачати ресурси', communication_frequency_days: 30 },
];

// ═══════════════════════════════════════════════════
// COHORT SNAPSHOTS
// ═══════════════════════════════════════════════════

export const cohortSnapshots: CohortSnapshot[] = [
  { id: 'uuid-cohort-1', cohort_month: '2024-03-01', period_month: '2024-03-01', months_since_first: 0, cohort_size: 8, active_clients: 8, retention_rate: 100.00, total_revenue: 7200.00 },
  { id: 'uuid-cohort-2', cohort_month: '2024-03-01', period_month: '2024-04-01', months_since_first: 1, cohort_size: 8, active_clients: 5, retention_rate: 62.50, total_revenue: 4600.00 },
  { id: 'uuid-cohort-3', cohort_month: '2024-03-01', period_month: '2024-05-01', months_since_first: 2, cohort_size: 8, active_clients: 4, retention_rate: 50.00, total_revenue: 3800.00 },
  { id: 'uuid-cohort-4', cohort_month: '2024-03-01', period_month: '2024-06-01', months_since_first: 3, cohort_size: 8, active_clients: 6, retention_rate: 75.00, total_revenue: 5200.00 },
  { id: 'uuid-cohort-5', cohort_month: '2024-03-01', period_month: '2024-07-01', months_since_first: 4, cohort_size: 8, active_clients: 3, retention_rate: 37.50, total_revenue: 2800.00 },
  { id: 'uuid-cohort-6', cohort_month: '2024-03-01', period_month: '2024-08-01', months_since_first: 5, cohort_size: 8, active_clients: 4, retention_rate: 50.00, total_revenue: 3600.00 },
  { id: 'uuid-cohort-7', cohort_month: '2024-03-01', period_month: '2024-09-01', months_since_first: 6, cohort_size: 8, active_clients: 3, retention_rate: 37.50, total_revenue: 2500.00 },
  { id: 'uuid-cohort-8', cohort_month: '2024-03-01', period_month: '2024-10-01', months_since_first: 7, cohort_size: 8, active_clients: 3, retention_rate: 37.50, total_revenue: 3100.00 },
  { id: 'uuid-cohort-9', cohort_month: '2024-03-01', period_month: '2024-11-01', months_since_first: 8, cohort_size: 8, active_clients: 4, retention_rate: 50.00, total_revenue: 3900.00 },
  { id: 'uuid-cohort-10', cohort_month: '2024-03-01', period_month: '2024-12-01', months_since_first: 9, cohort_size: 8, active_clients: 3, retention_rate: 37.50, total_revenue: 2700.00 },
  { id: 'uuid-cohort-11', cohort_month: '2024-03-01', period_month: '2025-01-01', months_since_first: 10, cohort_size: 8, active_clients: 4, retention_rate: 50.00, total_revenue: 3800.00 },
  { id: 'uuid-cohort-12', cohort_month: '2024-03-01', period_month: '2025-02-01', months_since_first: 11, cohort_size: 8, active_clients: 2, retention_rate: 25.00, total_revenue: 1700.00 },
  { id: 'uuid-cohort-13', cohort_month: '2024-03-01', period_month: '2025-03-01', months_since_first: 12, cohort_size: 8, active_clients: 3, retention_rate: 37.50, total_revenue: 2500.00 },
  { id: 'uuid-cohort-14', cohort_month: '2024-06-01', period_month: '2024-06-01', months_since_first: 0, cohort_size: 6, active_clients: 6, retention_rate: 100.00, total_revenue: 5400.00 },
  { id: 'uuid-cohort-15', cohort_month: '2024-06-01', period_month: '2024-07-01', months_since_first: 1, cohort_size: 6, active_clients: 4, retention_rate: 66.67, total_revenue: 3200.00 },
  { id: 'uuid-cohort-16', cohort_month: '2024-06-01', period_month: '2024-08-01', months_since_first: 2, cohort_size: 6, active_clients: 3, retention_rate: 50.00, total_revenue: 2700.00 },
  { id: 'uuid-cohort-17', cohort_month: '2024-06-01', period_month: '2024-09-01', months_since_first: 3, cohort_size: 6, active_clients: 4, retention_rate: 66.67, total_revenue: 3500.00 },
  { id: 'uuid-cohort-18', cohort_month: '2024-06-01', period_month: '2024-10-01', months_since_first: 4, cohort_size: 6, active_clients: 2, retention_rate: 33.33, total_revenue: 1800.00 },
  { id: 'uuid-cohort-19', cohort_month: '2024-06-01', period_month: '2024-11-01', months_since_first: 5, cohort_size: 6, active_clients: 3, retention_rate: 50.00, total_revenue: 2900.00 },
  { id: 'uuid-cohort-20', cohort_month: '2024-06-01', period_month: '2024-12-01', months_since_first: 6, cohort_size: 6, active_clients: 3, retention_rate: 50.00, total_revenue: 2600.00 },
  { id: 'uuid-cohort-21', cohort_month: '2024-09-01', period_month: '2024-09-01', months_since_first: 0, cohort_size: 5, active_clients: 5, retention_rate: 100.00, total_revenue: 4200.00 },
  { id: 'uuid-cohort-22', cohort_month: '2024-09-01', period_month: '2024-10-01', months_since_first: 1, cohort_size: 5, active_clients: 3, retention_rate: 60.00, total_revenue: 2400.00 },
  { id: 'uuid-cohort-23', cohort_month: '2024-09-01', period_month: '2024-11-01', months_since_first: 2, cohort_size: 5, active_clients: 3, retention_rate: 60.00, total_revenue: 2500.00 },
  { id: 'uuid-cohort-24', cohort_month: '2024-09-01', period_month: '2024-12-01', months_since_first: 3, cohort_size: 5, active_clients: 2, retention_rate: 40.00, total_revenue: 1600.00 },
  { id: 'uuid-cohort-25', cohort_month: '2024-12-01', period_month: '2024-12-01', months_since_first: 0, cohort_size: 7, active_clients: 7, retention_rate: 100.00, total_revenue: 5800.00 },
  { id: 'uuid-cohort-26', cohort_month: '2024-12-01', period_month: '2025-01-01', months_since_first: 1, cohort_size: 7, active_clients: 4, retention_rate: 57.14, total_revenue: 3200.00 },
  { id: 'uuid-cohort-27', cohort_month: '2024-12-01', period_month: '2025-02-01', months_since_first: 2, cohort_size: 7, active_clients: 3, retention_rate: 42.86, total_revenue: 2500.00 },
  { id: 'uuid-cohort-28', cohort_month: '2024-12-01', period_month: '2025-03-01', months_since_first: 3, cohort_size: 7, active_clients: 4, retention_rate: 57.14, total_revenue: 3400.00 },
  { id: 'uuid-cohort-29', cohort_month: '2025-03-01', period_month: '2025-03-01', months_since_first: 0, cohort_size: 5, active_clients: 5, retention_rate: 100.00, total_revenue: 4100.00 },
  { id: 'uuid-cohort-30', cohort_month: '2025-03-01', period_month: '2025-04-01', months_since_first: 1, cohort_size: 5, active_clients: 3, retention_rate: 60.00, total_revenue: 2300.00 },
  { id: 'uuid-cohort-31', cohort_month: '2025-03-01', period_month: '2025-05-01', months_since_first: 2, cohort_size: 5, active_clients: 3, retention_rate: 60.00, total_revenue: 2500.00 },
  { id: 'uuid-cohort-32', cohort_month: '2025-06-01', period_month: '2025-06-01', months_since_first: 0, cohort_size: 4, active_clients: 4, retention_rate: 100.00, total_revenue: 3200.00 },
  { id: 'uuid-cohort-33', cohort_month: '2025-06-01', period_month: '2025-07-01', months_since_first: 1, cohort_size: 4, active_clients: 2, retention_rate: 50.00, total_revenue: 1500.00 },
  { id: 'uuid-cohort-34', cohort_month: '2025-06-01', period_month: '2025-08-01', months_since_first: 2, cohort_size: 4, active_clients: 2, retention_rate: 50.00, total_revenue: 1400.00 },
  { id: 'uuid-cohort-35', cohort_month: '2025-09-01', period_month: '2025-09-01', months_since_first: 0, cohort_size: 3, active_clients: 3, retention_rate: 100.00, total_revenue: 2100.00 },
  { id: 'uuid-cohort-36', cohort_month: '2025-09-01', period_month: '2025-10-01', months_since_first: 1, cohort_size: 3, active_clients: 2, retention_rate: 66.67, total_revenue: 1600.00 },
  { id: 'uuid-cohort-37', cohort_month: '2025-12-01', period_month: '2025-12-01', months_since_first: 0, cohort_size: 4, active_clients: 4, retention_rate: 100.00, total_revenue: 3600.00 },
  { id: 'uuid-cohort-38', cohort_month: '2025-12-01', period_month: '2026-01-01', months_since_first: 1, cohort_size: 4, active_clients: 3, retention_rate: 75.00, total_revenue: 2800.00 },
  { id: 'uuid-cohort-39', cohort_month: '2025-12-01', period_month: '2026-02-01', months_since_first: 2, cohort_size: 4, active_clients: 2, retention_rate: 50.00, total_revenue: 1900.00 },
  { id: 'uuid-cohort-40', cohort_month: '2025-12-01', period_month: '2026-03-01', months_since_first: 3, cohort_size: 4, active_clients: 3, retention_rate: 75.00, total_revenue: 2600.00 },
  { id: 'uuid-cohort-41', cohort_month: '2026-03-01', period_month: '2026-03-01', months_since_first: 0, cohort_size: 6, active_clients: 6, retention_rate: 100.00, total_revenue: 4800.00 },
];

// ═══════════════════════════════════════════════════
// METRICS DAILY (30 days)
// ═══════════════════════════════════════════════════

export const metricsDaily: MetricsDaily[] = [
  { date: '2026-03-04', new_clients: 1, returning_clients: 3, total_orders: 4, total_revenue: 2800.00, avg_order_value: 700.00, communications_sent: 5, communications_opened: 3, communications_clicked: 1 },
  { date: '2026-03-05', new_clients: 0, returning_clients: 4, total_orders: 4, total_revenue: 3200.00, avg_order_value: 800.00, communications_sent: 3, communications_opened: 2, communications_clicked: 1 },
  { date: '2026-03-06', new_clients: 1, returning_clients: 2, total_orders: 3, total_revenue: 1950.00, avg_order_value: 650.00, communications_sent: 4, communications_opened: 2, communications_clicked: 0 },
  { date: '2026-03-07', new_clients: 0, returning_clients: 3, total_orders: 3, total_revenue: 2400.00, avg_order_value: 800.00, communications_sent: 6, communications_opened: 4, communications_clicked: 2 },
  { date: '2026-03-08', new_clients: 2, returning_clients: 5, total_orders: 7, total_revenue: 5600.00, avg_order_value: 800.00, communications_sent: 12, communications_opened: 8, communications_clicked: 4 },
  { date: '2026-03-09', new_clients: 0, returning_clients: 2, total_orders: 2, total_revenue: 1200.00, avg_order_value: 600.00, communications_sent: 2, communications_opened: 1, communications_clicked: 0 },
  { date: '2026-03-10', new_clients: 1, returning_clients: 3, total_orders: 4, total_revenue: 2900.00, avg_order_value: 725.00, communications_sent: 5, communications_opened: 3, communications_clicked: 1 },
  { date: '2026-03-11', new_clients: 0, returning_clients: 2, total_orders: 2, total_revenue: 1500.00, avg_order_value: 750.00, communications_sent: 3, communications_opened: 1, communications_clicked: 0 },
  { date: '2026-03-12', new_clients: 1, returning_clients: 4, total_orders: 5, total_revenue: 3800.00, avg_order_value: 760.00, communications_sent: 4, communications_opened: 3, communications_clicked: 1 },
  { date: '2026-03-13', new_clients: 0, returning_clients: 3, total_orders: 3, total_revenue: 2200.00, avg_order_value: 733.33, communications_sent: 5, communications_opened: 2, communications_clicked: 1 },
  { date: '2026-03-14', new_clients: 1, returning_clients: 2, total_orders: 3, total_revenue: 1800.00, avg_order_value: 600.00, communications_sent: 3, communications_opened: 2, communications_clicked: 1 },
  { date: '2026-03-15', new_clients: 1, returning_clients: 4, total_orders: 5, total_revenue: 3600.00, avg_order_value: 720.00, communications_sent: 6, communications_opened: 4, communications_clicked: 2 },
  { date: '2026-03-16', new_clients: 0, returning_clients: 3, total_orders: 3, total_revenue: 2100.00, avg_order_value: 700.00, communications_sent: 4, communications_opened: 2, communications_clicked: 1 },
  { date: '2026-03-17', new_clients: 0, returning_clients: 2, total_orders: 2, total_revenue: 1400.00, avg_order_value: 700.00, communications_sent: 3, communications_opened: 1, communications_clicked: 0 },
  { date: '2026-03-18', new_clients: 1, returning_clients: 3, total_orders: 4, total_revenue: 2800.00, avg_order_value: 700.00, communications_sent: 5, communications_opened: 3, communications_clicked: 2 },
  { date: '2026-03-19', new_clients: 0, returning_clients: 4, total_orders: 4, total_revenue: 3100.00, avg_order_value: 775.00, communications_sent: 4, communications_opened: 2, communications_clicked: 1 },
  { date: '2026-03-20', new_clients: 2, returning_clients: 3, total_orders: 5, total_revenue: 3500.00, avg_order_value: 700.00, communications_sent: 7, communications_opened: 4, communications_clicked: 2 },
  { date: '2026-03-21', new_clients: 0, returning_clients: 2, total_orders: 2, total_revenue: 1300.00, avg_order_value: 650.00, communications_sent: 2, communications_opened: 1, communications_clicked: 0 },
  { date: '2026-03-22', new_clients: 0, returning_clients: 3, total_orders: 3, total_revenue: 2400.00, avg_order_value: 800.00, communications_sent: 3, communications_opened: 2, communications_clicked: 1 },
  { date: '2026-03-23', new_clients: 1, returning_clients: 2, total_orders: 3, total_revenue: 1900.00, avg_order_value: 633.33, communications_sent: 4, communications_opened: 2, communications_clicked: 1 },
  { date: '2026-03-24', new_clients: 0, returning_clients: 4, total_orders: 4, total_revenue: 3200.00, avg_order_value: 800.00, communications_sent: 5, communications_opened: 3, communications_clicked: 2 },
  { date: '2026-03-25', new_clients: 2, returning_clients: 3, total_orders: 5, total_revenue: 3800.00, avg_order_value: 760.00, communications_sent: 6, communications_opened: 4, communications_clicked: 2 },
  { date: '2026-03-26', new_clients: 0, returning_clients: 2, total_orders: 2, total_revenue: 1400.00, avg_order_value: 700.00, communications_sent: 3, communications_opened: 1, communications_clicked: 0 },
  { date: '2026-03-27', new_clients: 1, returning_clients: 3, total_orders: 4, total_revenue: 2600.00, avg_order_value: 650.00, communications_sent: 4, communications_opened: 2, communications_clicked: 1 },
  { date: '2026-03-28', new_clients: 0, returning_clients: 5, total_orders: 5, total_revenue: 4200.00, avg_order_value: 840.00, communications_sent: 5, communications_opened: 3, communications_clicked: 2 },
  { date: '2026-03-29', new_clients: 1, returning_clients: 2, total_orders: 3, total_revenue: 1800.00, avg_order_value: 600.00, communications_sent: 3, communications_opened: 2, communications_clicked: 1 },
  { date: '2026-03-30', new_clients: 0, returning_clients: 3, total_orders: 3, total_revenue: 2300.00, avg_order_value: 766.67, communications_sent: 4, communications_opened: 2, communications_clicked: 1 },
  { date: '2026-03-31', new_clients: 1, returning_clients: 4, total_orders: 5, total_revenue: 3900.00, avg_order_value: 780.00, communications_sent: 6, communications_opened: 4, communications_clicked: 2 },
  { date: '2026-04-01', new_clients: 0, returning_clients: 3, total_orders: 3, total_revenue: 2100.00, avg_order_value: 700.00, communications_sent: 4, communications_opened: 2, communications_clicked: 1 },
  { date: '2026-04-02', new_clients: 1, returning_clients: 2, total_orders: 3, total_revenue: 1700.00, avg_order_value: 566.67, communications_sent: 3, communications_opened: 2, communications_clicked: 1 },
];

// ═══════════════════════════════════════════════════
// ALLOWED SOURCES
// ═══════════════════════════════════════════════════

export const allowedSources: AllowedSource[] = [
  { source_id: 1, source_name: 'Instagram', is_active: true },
  { source_id: 2, source_name: 'Сайт', is_active: true },
  { source_id: 3, source_name: 'Телефон', is_active: true },
  { source_id: 4, source_name: 'Rozetka', is_active: true },
  { source_id: 5, source_name: 'Prom.ua', is_active: false },
];

// ═══════════════════════════════════════════════════
// SYNC LOGS
// ═══════════════════════════════════════════════════

export const syncLogs: SyncLog[] = [
  { id: 'uuid-sync-1', sync_type: 'webhook', status: 'success', orders_fetched: 1, orders_new: 1, orders_skipped: 0, errors: null, started_at: '2026-04-02T15:30:00+02:00', finished_at: '2026-04-02T15:30:01+02:00' },
  { id: 'uuid-sync-2', sync_type: 'hourly', status: 'success', orders_fetched: 12, orders_new: 3, orders_skipped: 9, errors: null, started_at: '2026-04-02T14:00:00+02:00', finished_at: '2026-04-02T14:00:15+02:00' },
  { id: 'uuid-sync-3', sync_type: 'webhook', status: 'success', orders_fetched: 1, orders_new: 1, orders_skipped: 0, errors: null, started_at: '2026-04-02T13:15:00+02:00', finished_at: '2026-04-02T13:15:01+02:00' },
  { id: 'uuid-sync-4', sync_type: 'hourly', status: 'success', orders_fetched: 8, orders_new: 2, orders_skipped: 6, errors: null, started_at: '2026-04-02T13:00:00+02:00', finished_at: '2026-04-02T13:00:12+02:00' },
  { id: 'uuid-sync-5', sync_type: 'manual', status: 'success', orders_fetched: 45, orders_new: 5, orders_skipped: 40, errors: null, started_at: '2026-04-01T10:00:00+02:00', finished_at: '2026-04-01T10:02:30+02:00' },
  { id: 'uuid-sync-6', sync_type: 'hourly', status: 'error', orders_fetched: 0, orders_new: 0, orders_skipped: 0, errors: null, started_at: '2026-03-31T12:00:00+02:00', finished_at: '2026-03-31T12:00:05+02:00' },
  { id: 'uuid-sync-7', sync_type: 'initial_import', status: 'success', orders_fetched: 1250, orders_new: 1250, orders_skipped: 0, errors: null, started_at: '2026-03-01T02:00:00+02:00', finished_at: '2026-03-01T02:45:00+02:00' },
];

// ═══════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════

export const settings: Setting[] = [
  { key: 'min_communication_interval_days', value: '3', description: 'Мін. днів між повідомленнями клієнту', updated_at: '2026-03-01T00:00:00Z' },
  { key: 'win_back_warm_days', value: '30', description: 'Днів без покупки для warm win-back', updated_at: '2026-03-01T00:00:00Z' },
  { key: 'win_back_cold_days', value: '60', description: 'Днів без покупки для cold win-back', updated_at: '2026-03-01T00:00:00Z' },
  { key: 'win_back_lost_days', value: '120', description: 'Днів без покупки для lost', updated_at: '2026-03-01T00:00:00Z' },
  { key: 'loyalty_points_per_uah', value: '1', description: 'Балів за 1 грн покупки', updated_at: '2026-03-01T00:00:00Z' },
  { key: 'rfm_update_frequency', value: 'weekly', description: 'Як часто перераховувати RFM', updated_at: '2026-03-01T00:00:00Z' },
];

// ═══════════════════════════════════════════════════
// CAMPAIGNS
// ═══════════════════════════════════════════════════

export const campaigns: Campaign[] = [
  { id: 'uuid-camp-1', name: '8 Березня — знижка 20%', type: 'seasonal', target_segment: 'all', target_clients_count: 45, channel: 'multi', template_id: null, scheduled_at: '2026-03-08T09:00:00+02:00', status: 'sent', sent_count: 45, opened_count: 28, clicked_count: 12, conversion_count: 5, created_at: '2026-03-01T00:00:00Z' },
  { id: 'uuid-camp-2', name: 'Весняний розпродаж', type: 'manual', target_segment: 'Loyal', target_clients_count: 18, channel: 'email', template_id: null, scheduled_at: '2026-03-01T08:00:00+02:00', status: 'sent', sent_count: 18, opened_count: 11, clicked_count: 6, conversion_count: 3, created_at: '2026-02-25T00:00:00Z' },
  { id: 'uuid-camp-3', name: 'Нова колекція кремів', type: 'manual', target_segment: 'Champions', target_clients_count: 8, channel: 'instagram', template_id: null, scheduled_at: '2026-04-05T10:00:00+02:00', status: 'scheduled', sent_count: 0, opened_count: 0, clicked_count: 0, conversion_count: 0, created_at: '2026-03-28T00:00:00Z' },
  { id: 'uuid-camp-4', name: 'Win-Back квітень', type: 'manual', target_segment: 'At Risk', target_clients_count: 12, channel: 'sms', template_id: 'winback_warm_sms', scheduled_at: '2026-04-10T10:00:00+02:00', status: 'draft', sent_count: 0, opened_count: 0, clicked_count: 0, conversion_count: 0, created_at: '2026-04-01T00:00:00Z' },
  { id: 'uuid-camp-5', name: 'Великдень — подарунок', type: 'seasonal', target_segment: 'all', target_clients_count: 50, channel: 'multi', template_id: null, scheduled_at: '2026-04-20T09:00:00+02:00', status: 'draft', sent_count: 0, opened_count: 0, clicked_count: 0, conversion_count: 0, created_at: '2026-04-01T00:00:00Z' },
];

// ═══════════════════════════════════════════════════
// BADGE COUNTS
// ═══════════════════════════════════════════════════

export const badgeCounts: BadgeCounts = {
  unknown_barcodes: 2,
  at_risk: 6, // At Risk (4) + Can't Lose Them (2)
  pending_queue: 8,
  overdue_reminders: 3, // client_purchases where reminder_date < today and not sent
  levelup_today: 0,
  campaigns_today: 0,
  sync_errors: 1,
};

// ═══════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════

export function getClientById(id: number): Client | undefined {
  return clients.find((c) => c.client_id === id);
}

export function getClientOrders(clientId: number): ClientOrder[] {
  return clientOrders.filter((o) => o.client_id === clientId);
}

export function getClientCommunications(clientId: number): CommunicationLog[] {
  return communicationLogs.filter((c) => c.client_id === clientId);
}

export function getClientLoyaltyTransactions(clientId: number): LoyaltyTransaction[] {
  return loyaltyTransactions.filter((t) => t.client_id === clientId);
}

export function getClientPurchases(clientId: number): ClientPurchase[] {
  return clientPurchases.filter((p) => p.client_id === clientId);
}

export function getSegmentClients(segment: string): Client[] {
  return clients.filter((c) => c.rfm_segment === segment);
}

export function getTodayReminders(): ClientPurchase[] {
  const today = new Date().toISOString().split('T')[0];
  return clientPurchases.filter(
    (p) => p.reminder_date <= today && !p.reminder_sent
  );
}

export function getOverdueReminders(): ClientPurchase[] {
  const today = new Date().toISOString().split('T')[0];
  return clientPurchases.filter(
    (p) => p.reminder_date < today && !p.reminder_sent
  );
}

export function getAutomationsByType(type: string): AutomationQueueItem[] {
  return automationQueue.filter((a) => a.automation_type === type);
}

export function getWinBackByTier(tier: string): WinBackCandidate[] {
  return winBackCandidates.filter((w) => w.tier === tier);
}
