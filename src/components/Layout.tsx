import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { HeartHandshake, Menu, X } from 'lucide-react';
import { appNavItems } from '../lib/navigation';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: ReactNode;
}

type VisibilityMap = Record<string, boolean>;

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visibilityMap, setVisibilityMap] = useState<VisibilityMap>({});

  useEffect(() => {
    async function loadVisibility() {
      const visibilityKeys = appNavItems
        .map((item) => item.visibilityKey)
        .filter((key): key is string => Boolean(key));

      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', visibilityKeys);

      const nextMap: VisibilityMap = {};
      for (const key of visibilityKeys) {
        nextMap[key] = true;
      }
      for (const row of data ?? []) {
        nextMap[row.key] = row.value !== 'false';
      }
      setVisibilityMap(nextMap);
    }

    void loadVisibility();

    function onVisibilityChanged() {
      void loadVisibility();
    }

    window.addEventListener('sidebar-visibility-changed', onVisibilityChanged);
    return () => window.removeEventListener('sidebar-visibility-changed', onVisibilityChanged);
  }, []);

  const visibleNavItems = useMemo(
    () =>
      appNavItems.filter((item) =>
        item.visibilityKey ? visibilityMap[item.visibilityKey] !== false : true,
      ),
    [visibilityMap],
  );

  return (
    <div className="min-h-screen bg-[#f4f5fb]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/35 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-[280px] bg-[#212c41] text-white
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 shadow-[0_20px_80px_rgba(15,23,42,0.28)]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center gap-3 px-6 py-7 border-b border-white/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <HeartHandshake size={26} className="text-indigo-400" />
          </div>
          <div>
            <div className="text-[18px] font-semibold tracking-tight text-white">ProCare Retention</div>
          </div>
          <button
            className="ml-auto lg:hidden text-white/70 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex h-[calc(100%-88px)] flex-col gap-1 overflow-y-auto px-4 py-5">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-4 rounded-[20px] px-4 py-4 text-[17px] font-medium tracking-[-0.02em] transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#5547ff] to-[#5d36f2] text-white shadow-[0_18px_30px_rgba(91,54,242,0.32)]'
                    : 'text-white/78 hover:bg-white/6 hover:text-white'
                }`
              }
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setSidebarOpen(true)} className="text-slate-600">
          <Menu size={24} />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
          <HeartHandshake size={20} className="text-indigo-600" />
        </div>
        <span className="font-semibold text-slate-800">ProCare Retention</span>
      </div>

      <main className="p-6 lg:ml-[280px]">{children}</main>
    </div>
  );
}
