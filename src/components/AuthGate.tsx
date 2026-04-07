import { type FormEvent, type ReactNode, useState } from 'react';
import { LockKeyhole, LogIn, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { adminEmail, loading, session, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password,
    });

    if (error) {
      toast.error(error.message === 'Invalid login credentials'
        ? 'Невірний пароль'
        : 'Не вдалося увійти');
    } else {
      toast.success('Вхід виконано');
      setPassword('');
    }

    setSubmitting(false);
  }

  async function handleSignOut() {
    await signOut();
    toast.success('Сесію завершено');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5fb]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  const sessionEmail = session?.user.email?.trim().toLowerCase() ?? null;
  const isAuthorized = sessionEmail === adminEmail;

  if (!session) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e8edff_0%,#f4f5fb_48%,#eef2ff_100%)] px-4 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
          <div className="w-full rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
              <LockKeyhole className="h-7 w-7 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Вхід адміністратора</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Доступ до дашборду відкритий лише після введення пароля адміністратора.
            </p>

            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Пароль</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white"
                  placeholder="Введіть пароль"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" />
                Увійти
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5fb] px-4">
        <div className="w-full max-w-md rounded-[28px] border border-amber-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
            <LockKeyhole className="h-7 w-7 text-amber-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Цей акаунт не має доступу</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Поточна сесія Supabase Auth не відповідає внутрішньому адміністраторському акаунту.
          </p>
          <button
            onClick={() => void handleSignOut()}
            className="mt-6 flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Вийти
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
