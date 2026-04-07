import type { ReactNode } from 'react';
import {
  BarChart3,
  Bell,
  Bot,
  Gem,
  LayoutDashboard,
  ListChecks,
  Package,
  Plug,
  RefreshCw,
  Send,
  Settings,
  ShoppingCart,
  Target,
  Users,
} from 'lucide-react';

export interface AppNavItem {
  label: string;
  path: string;
  icon: ReactNode;
  visibilityKey?: string;
}

export const appNavItems: AppNavItem[] = [
  { label: 'Головна', path: '/', icon: <LayoutDashboard size={22} /> },
  { label: 'Замовлення', path: '/orders', icon: <ShoppingCart size={22} />, visibilityKey: 'sidebar_show_orders' },
  { label: 'Товари', path: '/products', icon: <Package size={22} />, visibilityKey: 'sidebar_show_products' },
  { label: 'Клієнти', path: '/clients', icon: <Users size={22} />, visibilityKey: 'sidebar_show_clients' },
  { label: 'Джерела', path: '/sources', icon: <Plug size={22} />, visibilityKey: 'sidebar_show_sources' },
  { label: 'Статуси', path: '/statuses', icon: <ListChecks size={22} />, visibilityKey: 'sidebar_show_statuses' },
  { label: 'Нагадування', path: '/reminders', icon: <Bell size={22} />, visibilityKey: 'sidebar_show_reminders' },
  { label: 'Автоматизації', path: '/automations', icon: <Bot size={22} />, visibilityKey: 'sidebar_show_automations' },
  { label: 'Кампанії', path: '/campaigns', icon: <Send size={22} />, visibilityKey: 'sidebar_show_campaigns' },
  { label: 'Аналітика', path: '/analytics', icon: <BarChart3 size={22} />, visibilityKey: 'sidebar_show_analytics' },
  { label: 'Сегменти', path: '/segments', icon: <Target size={22} />, visibilityKey: 'sidebar_show_segments' },
  { label: 'Лояльність', path: '/loyalty', icon: <Gem size={22} />, visibilityKey: 'sidebar_show_loyalty' },
  { label: 'Синхронізація', path: '/sync', icon: <RefreshCw size={22} />, visibilityKey: 'sidebar_show_sync' },
  { label: 'Налаштування', path: '/settings', icon: <Settings size={22} /> },
];

export const hideableNavItems = appNavItems.filter((item) => item.visibilityKey);
