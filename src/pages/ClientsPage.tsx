import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Phone, Mail, AtSign, Tag, ShoppingCart, MessageSquare, Gift, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import type { Client, ClientOrder, CommunicationLog, LoyaltyTransaction, ClientPurchase } from '../types';

const tierColors: Record<string, string> = {
  bronze: 'bg-amber-100 text-amber-800',
  silver: 'bg-gray-200 text-gray-700',
  gold: 'bg-yellow-100 text-yellow-800',
  platinum: 'bg-purple-100 text-purple-800',
};

const segmentColors: Record<string, string> = {
  'Champions': '#22c55e', 'Loyal': '#3b82f6', 'Potential Loyal': '#8b5cf6',
  'New Customers': '#06b6d4', 'Promising': '#f59e0b', 'Need Attention': '#f97316',
  'About To Sleep': '#ef4444', 'At Risk': '#dc2626', "Can't Lose Them": '#991b1b',
  'Hibernating': '#6b7280', 'Lost': '#374151',
};

function ClientCard({ clientId }: { clientId: number }) {
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [comms, setComms] = useState<CommunicationLog[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyTransaction[]>([]);
  const [purchases, setPurchases] = useState<ClientPurchase[]>([]);
  const [segmentAction, setSegmentAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [clientRes, ordersRes, commsRes, loyaltyRes, purchasesRes] = await Promise.all([
        supabase.from('clients').select('*').eq('client_id', clientId).single(),
        supabase.from('client_orders').select('*').eq('client_id', clientId).order('order_date', { ascending: false }),
        supabase.from('communication_log').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('loyalty_transactions').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('client_purchases').select('*').eq('client_id', clientId),
      ]);

      if (clientRes.data) {
        setClient(clientRes.data);
        if (clientRes.data.rfm_segment) {
          const segRes = await supabase
            .from('rfm_segments')
            .select('recommended_action')
            .eq('segment_name', clientRes.data.rfm_segment)
            .single();
          setSegmentAction(segRes.data?.recommended_action ?? null);
        }
      }
      setOrders(ordersRes.data ?? []);
      setComms(commsRes.data ?? []);
      setLoyalty(loyaltyRes.data ?? []);
      setPurchases(purchasesRes.data ?? []);
      setLoading(false);
    }
    load();
  }, [clientId]);

  if (loading) return <div className="text-center py-20 text-gray-400">Завантаження...</div>;
  if (!client) return <p className="text-center text-gray-500 mt-10">Клієнта не знайдено</p>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Назад до списку
      </button>

      {/* Профіль */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{client.full_name}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              {client.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{client.phone}</span>}
              {client.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{client.email}</span>}
              {client.instagram && <span className="flex items-center gap-1"><AtSign className="w-3.5 h-3.5" />@{client.instagram}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${tierColors[client.loyalty_tier]}`}>
                {client.loyalty_tier}
              </span>
              {client.rfm_segment && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: segmentColors[client.rfm_segment] || '#6b7280' }}>
                  {client.rfm_segment}
                </span>
              )}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${client.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {client.is_active ? 'Активний' : 'Неактивний'}
              </span>
              {client.tags.map(t => (
                <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center gap-1">
                  <Tag className="w-3 h-3" />{t}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{client.loyalty_points}</p>
            <p className="text-xs text-gray-500">бонусних балів</p>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div>
            <p className="text-sm text-gray-500">Замовлень</p>
            <p className="text-lg font-bold text-gray-900">{client.total_orders}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Витрачено</p>
            <p className="text-lg font-bold text-gray-900">{client.total_spent.toLocaleString()} грн</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Середній чек</p>
            <p className="text-lg font-bold text-gray-900">{Math.round(client.avg_order_value)} грн</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">RFM</p>
            <p className="text-lg font-bold text-gray-900">
              {client.rfm_recency || '-'}-{client.rfm_frequency || '-'}-{client.rfm_monetary || '-'}
            </p>
          </div>
        </div>

        {segmentAction && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50">
            <p className="text-sm text-gray-600"><strong>Рекомендація:</strong> {segmentAction}</p>
          </div>
        )}
      </div>

      {/* Замовлення + Комунікації */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Замовлення ({orders.length})
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {orders.length === 0 && <p className="text-sm text-gray-400">Немає замовлень</p>}
            {orders.map(o => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">#{o.order_id}</p>
                  <p className="text-xs text-gray-500">{format(parseISO(o.order_date), 'dd.MM.yyyy')}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{o.total_amount.toLocaleString()} грн</p>
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
            {comms.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.communication_type}</p>
                  <p className="text-xs text-gray-500">{c.message_preview?.slice(0, 40)}...</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  c.status === 'clicked' ? 'bg-green-100 text-green-700' :
                  c.status === 'opened' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{{ clicked: 'Клік', opened: 'Відкрито', sent: 'Надіслано', delivered: 'Доставлено' }[c.status] || c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Лояльність + Покупки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5" /> Транзакції балів ({loyalty.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {loyalty.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div>
                  <p className="text-sm text-gray-700">{t.reason}</p>
                  <p className="text-xs text-gray-400">{format(parseISO(t.created_at), 'dd.MM.yyyy')}</p>
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
            {purchases.map(p => (
              <div key={p.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{p.product_name}</p>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Закінчується: {format(parseISO(p.expected_end_date), 'dd.MM.yyyy')}</span>
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

function ClientsList() {
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('clients')
        .select('*')
        .order('total_spent', { ascending: false });
      setClients(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = clients.filter(c => {
    const matchSearch = !search ||
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchSegment = segmentFilter === 'all' || c.rfm_segment === segmentFilter;
    const matchTier = tierFilter === 'all' || c.loyalty_tier === tierFilter;
    return matchSearch && matchSegment && matchTier;
  });

  const segments = [...new Set(clients.map(c => c.rfm_segment).filter(Boolean))];
  const tiers = ['bronze', 'silver', 'gold', 'platinum'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Клієнти ({clients.length})</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Пошук за ім'ям, телефоном, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select value={segmentFilter} onChange={e => setSegmentFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="all">Всі сегменти</option>
          {segments.map(s => <option key={s} value={s!}>{s}</option>)}
        </select>
        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="all">Всі рівні</option>
          {tiers.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Завантаження...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Клієнт</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Сегмент</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Рівень</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Замовлень</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Витрачено</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Останнє</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.client_id} onClick={() => navigate(`/clients/${c.client_id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.full_name}</p>
                    <p className="text-xs text-gray-500">{c.phone || c.email || '-'}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {c.rfm_segment && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: segmentColors[c.rfm_segment] || '#6b7280' }}>
                        {c.rfm_segment}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[c.loyalty_tier]}`}>
                      {c.loyalty_tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{c.total_orders}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{c.total_spent.toLocaleString()} грн</td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">
                    {c.last_order_date ? format(parseISO(c.last_order_date), 'dd.MM.yyyy') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ClientsPage() {
  const { id } = useParams();

  if (id) return <ClientCard clientId={Number(id)} />;
  return <ClientsList />;
}
