import { type ReactNode, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  Target,
  Bot,
  Bell,
  Gem,
  Send,
  Plug,
  RefreshCw,
  Settings,
  ShieldAlert,
  Menu,
  X,
} from 'lucide-react';
import { badgeCounts } from '../lib/testData';
import type { BadgeCounts } from '../types';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  badgeKey?: keyof BadgeCounts;
}

const navItems: NavItem[] = [
  { label: 'Головна', path: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'Товари', path: '/products', icon: <Package size={20} />, badgeKey: 'unknown_barcodes' },
  { label: 'Клієнти', path: '/clients', icon: <Users size={20} /> },
  { label: 'Аналітика', path: '/analytics', icon: <BarChart3 size={20} /> },
  { label: 'Сегменти', path: '/segments', icon: <Target size={20} />, badgeKey: 'at_risk' },
  { label: 'Автоматизації', path: '/automations', icon: <Bot size={20} />, badgeKey: 'pending_queue' },
  { label: 'Нагадування', path: '/reminders', icon: <Bell size={20} />, badgeKey: 'overdue_reminders' },
  { label: 'Лояльність', path: '/loyalty', icon: <Gem size={20} />, badgeKey: 'levelup_today' },
  { label: 'Кампанії', path: '/campaigns', icon: <Send size={20} />, badgeKey: 'campaigns_today' },
  { label: 'Джерела', path: '/sources', icon: <Plug size={20} /> },
  { label: 'Синхронізація', path: '/sync', icon: <RefreshCw size={20} />, badgeKey: 'sync_errors' },
  { label: 'Налаштування', path: '/settings', icon: <Settings size={20} /> },
];

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const badges = badgeCounts;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64 bg-[#1e293b] text-white
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <ShieldAlert size={28} className="text-indigo-400" />
          <span className="text-lg font-bold tracking-tight">ProCare Retention</span>
          <button
            className="ml-auto lg:hidden text-white/70 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-2 flex flex-col gap-0.5 px-3 overflow-y-auto h-[calc(100%-72px)]">
          {navItems.map((item) => {
            const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-xs font-semibold px-1.5">
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Mobile header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 bg-white border-b px-4 py-3 lg:hidden">
        <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
          <Menu size={24} />
        </button>
        <ShieldAlert size={22} className="text-indigo-600" />
        <span className="font-semibold text-gray-800">ProCare Retention</span>
      </div>

      {/* Main content */}
      <main className="lg:ml-64 p-6">{children}</main>
    </div>
  );
}
