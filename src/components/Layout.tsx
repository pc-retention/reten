import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { HeartHandshake, LogOut, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import { appNavItems } from '../lib/navigation';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: ReactNode;
}

type VisibilityMap = Record<string, boolean>;

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visibilityMap, setVisibilityMap] = useState<VisibilityMap>({});
  const { signOut } = useAuth();

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

  async function handleSignOut() {
    await signOut();
    toast.success('Сесію завершено');
  }

  return (
    <div className="min-h-screen bg-[#f6f4fb]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 flex h-full w-[280px] flex-col border-r border-[#dddbe9]
          bg-[linear-gradient(180deg,#f6f4fb_0%,#f1f2f8_100%)] text-slate-700
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 shadow-[0_18px_48px_rgba(148,163,184,0.14)]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center gap-3 border-b border-[#dfddea] px-6 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/75 ring-1 ring-[#dddbe9] shadow-[0_10px_24px_rgba(148,163,184,0.12)]">
            <HeartHandshake size={24} className="text-[#6f6ccf]" />
          </div>
          <div className="text-[17px] font-semibold tracking-tight text-slate-800">ProCare Retention</div>
          <button
            className="ml-auto text-slate-400 transition hover:text-slate-700 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="flex flex-col gap-1.5">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3.5 rounded-[22px] px-4 py-3 text-[15px] font-medium tracking-[-0.01em] transition-all ${
                    isActive
                      ? 'bg-[#e9e5f2] text-slate-900 shadow-[0_10px_24px_rgba(148,163,184,0.12)] ring-1 ring-[#ddd8ea]'
                      : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'
                  }`
                }
              >
                <span className="shrink-0 text-current transition-transform duration-200 group-hover:translate-x-0.5">
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-[#dfddea] px-4 py-4">
          <button
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-[14px] font-medium text-slate-500 transition hover:bg-white/70 hover:text-slate-800"
          >
            <LogOut size={18} />
            Вийти
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#dfddea] bg-[#f8f7fc]/95 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setSidebarOpen(true)} className="text-slate-600">
          <Menu size={22} />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-[#dddbe9]">
          <HeartHandshake size={18} className="text-[#6f6ccf]" />
        </div>
        <span className="text-sm font-semibold text-slate-800">ProCare Retention</span>
      </div>

      <main className="p-6 lg:ml-[280px]">{children}</main>
    </div>
  );
}
