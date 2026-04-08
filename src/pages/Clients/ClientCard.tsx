import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, AtSign, Tag, ShoppingCart, MessageSquare, Gift, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Client, ClientOrder, CommunicationLog, LoyaltyTransaction, ClientPurchase } from '../../types';
import {
  fetchClientByIdRpc,
  fetchClientCommsRpc,
  fetchClientLoyaltyTransactionsRpc,
  fetchClientOrdersRpc,
  fetchFilteredRemindersRpc,
  fetchRfmSegmentActionRpc,
  fetchRfmSegmentsListRpc,
} from '../../lib/serverQueries';
import { DEFAULT_BADGE_ALPHA, DEFAULT_BADGE_HEX, getBadgeTextColor, hexToAlphaHex } from '../../lib/colors';
import { getTierBadgeStyle, getTierLabel } from '../../lib/loyalty';
import { getSegmentLabel } from '../../lib/segments';

function safeDate(val: string | null | undefined) {
  if (!val) return '-';
  try { return format(parseISO(val), 'dd.MM.yyyy'); } catch { return '-'; }
}

function getSegmentBadgeStyle(color: string | null | undefined) {
  const backgroundColor = color || hexToAlphaHex(DEFAULT_BADGE_HEX, DEFAULT_BADGE_ALPHA);
  return { backgroundColor, color: getBadgeTextColor(color) };
}

type ClientReminderRow = ClientPurchase & { client_name: string | null; client_phone: string | null };

interface Props { clientId: number }

export function ClientCard({ clientId }: Props) {
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [comms, setComms] = useState<CommunicationLog[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyTransaction[]>([]);
  const [purchases, setPurchases] = useState<ClientPurchase[]>([]);
  const [segmentAction, setSegmentAction] = useState<string | null>(null);
  const [segmentColors, setSegmentColors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [clientRes, ordersRes, commsRes, loyaltyRes, purchasesRes, segmentsRes] = await Promise.all([
        fetchClientByIdRpc(clientId),
        fetchClientOrdersRpc(clientId),
        fetchClientCommsRpc(clientId),
        fetchClientLoyaltyTransactionsRpc(clientId),
        fetchFilteredRemindersRpc('', '', clientId),
        fetchRfmSegmentsListRpc(),
      ]);

      if (clientRes.data) {
        setClient(clientRes.data);
        if (clientRes.data.rfm_segment) {
          const segRes = await fetchRfmSegmentActionRpc(clientRes.data.rfm_segment);
          setSegmentAction(segRes.data ?? null);
        }
      }
      setOrders(clientRes.error ? [] : ordersRes.data);
      setComms(clientRes.error ? [] : commsRes.data);
      setLoyalty(clientRes.error ? [] : loyaltyRes.data);
      setPurchases((purchasesRes.data ?? []) as ClientReminderRow[]);
      setSegmentColors(
        Object.fromEntries((segmentsRes.data ?? []).map((segment) => [segment.segment_name, segment.color ?? null])),
      );
      setLoading(false);
    }
    void load();
  }, [clientId]);

  if (loading) return <div className="text-center py-20 text-gray-400">Завантаження...</div>;
  if (!client) return <p className="text-center text-gray-500 mt-10">Клієнта не знайдено</p>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Назад до списку
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{client.full_name}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              {client.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{client.phone}</span>}
              {client.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{client.email}</span>}
              {client.instagram && (
                <a href={client.instagram.startsWith('http') ? client.instagram : `https://instagram.com/${client.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800">
                  <AtSign className="w-3.5 h-3.5" />{client.instagram}
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={getTierBadgeStyle(client.loyalty_tier)}>
                {getTierLabel(client.loyalty_tier)}
              </span>
              {client.rfm_segment && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={getSegmentBadgeStyle(segmentColors[client.rfm_segment])}>
                  {getSegmentLabel(client.rfm_segment)}
                </span>
              )}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${client.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {client.is_active ? 'Активний' : 'Неактивний'}
              </span>
              {(client.tags || []).map((t) => (
                <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center gap-1">
                  <Tag className="w-3 h-3" />{t}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{client.loyalty_points ?? 0}</p>
            <p className="text-xs text-gray-500">бонусних балів</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div><p className="text-sm text-gray-500">Замовлень</p><p className="text-lg font-bold text-gray-900">{client.total_orders}</p></div>
          <div><p className="text-sm text-gray-500">Витрачено</p><p className="text-lg font-bold text-gray-900">{(client.total_spent ?? 0).toLocaleString()} грн</p></div>
          <div><p className="text-sm text-gray-500">Середній чек</p><p className="text-lg font-bold text-gray-900">{Math.round(client.avg_order_value ?? 0)} грн</p></div>
          <div><p className="text-sm text-gray-500">Остання покупка</p><p className="text-lg font-bold text-gray-900">{safeDate(client.last_order_date)}</p></div>
        </div>

        {segmentAction && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50">
            <p className="text-sm text-gray-600"><strong>Рекомендація:</strong> {segmentAction}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Замовлення ({orders.length})
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {orders.length === 0 && <p className="text-sm text-gray-400">Немає замовлень</p>}
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">#{o.order_id}</p>
                  <p className="text-xs text-gray-500">{safeDate(o.order_date)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{(o.total_amount ?? 0).toLocaleString()} грн</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Комунікації ({comms.length})
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {comms.length === 0 && <p className="text-sm text-gray-400">Немає комунікацій</p>}
            {comms.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.communication_type}</p>
                  <p className="text-xs text-gray-500">{c.message_preview?.slice(0, 40)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  c.status === 'clicked' ? 'bg-green-100 text-green-700' :
                  c.status === 'opened' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>{{ clicked: 'Клік', opened: 'Відкрито', sent: 'Надіслано', delivered: 'Доставлено' }[c.status] || c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5" /> Транзакції балів ({loyalty.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {loyalty.length === 0 && <p className="text-sm text-gray-400">Немає транзакцій</p>}
            {loyalty.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div>
                  <p className="text-sm text-gray-700">{t.reason}</p>
                  <p className="text-xs text-gray-400">{safeDate(t.created_at)}</p>
                </div>
                <span className={`text-sm font-semibold ${t.points >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {t.points > 0 ? '+' : ''}{t.points}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Прогноз покупок
          </h3>
          <div className="space-y-2">
            {purchases.length === 0 && <p className="text-sm text-gray-400">Немає даних</p>}
            {purchases.map((p) => (
              <div key={p.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{p.product_name}</p>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Закінчується: {safeDate(p.expected_end_date)}</span>
                  <span className={p.reminder_sent ? 'text-green-600' : 'text-orange-500'}>
                    {p.reminder_sent ? 'Надіслано' : 'Очікує'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
