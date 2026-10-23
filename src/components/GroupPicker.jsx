'use client';
import { Rocket, Plane, Layers, Wind, Lock, ChevronRight, LogOut } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/client';
import { useT } from '@/lib/i18n';
import { Avatar, Badge, LangSwitch, cx } from './ui';

const ICON = { roket: Rocket, ika: Plane, k2k1: Layers, aerostat: Wind };

export default function GroupPicker({ user, groups }) {
  const t = useT();
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const anyAllowed = groups.some((g) => g.allowed);

  const enter = async (g) => {
    if (!g.allowed || busy) return;
    setBusy(g.key);
    setErr('');
    try {
      await api('/api/auth/group', { method: 'POST', body: { group: g.key } });
      location.href = '/dashboard';
    } catch (e) {
      setErr(e.message);
      setBusy('');
    }
  };
  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-100 via-white to-brand-50 px-4 py-6">
      <div className="mx-auto flex max-w-4xl items-center justify-end gap-3">
        <LangSwitch />
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-2.5 py-1.5">
          <Avatar name={user.name} size={28} />
          <span className="text-sm font-medium">{user.name}</span>
        </div>
        <button onClick={logout} title={t('signOut')} aria-label={t('signOut')}
          className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white text-mute hover:bg-brand-50">
          <LogOut size={16} />
        </button>
      </div>

      <main className="mx-auto mt-10 max-w-4xl">
        <h1 className="text-3xl font-semibold">{t('groupsTitle')}</h1>
        <p className="mt-1.5 text-mute">{t('groupsSub')}</p>

        {!anyAllowed && (
          <p className="mt-6 rounded-2xl border border-line bg-white p-5 text-sm text-mute">{t('noGroups')}</p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {groups.map((g) => {
            const Icon = ICON[g.key] || Layers;
            const current = user.group === g.key;
            return (
              <button
                key={g.key}
                onClick={() => enter(g)}
                disabled={!g.allowed || !!busy}
                aria-disabled={!g.allowed}
                className={cx(
                  'group flex items-center gap-4 rounded-2xl border p-5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
                  g.allowed
                    ? 'border-line bg-white shadow-[0_2px_12px_rgba(60,90,140,0.06)] hover:border-brand-300 hover:shadow-[0_6px_20px_rgba(60,90,140,0.12)]'
                    : 'cursor-not-allowed border-line bg-white/50 text-mute',
                  busy === g.key && 'opacity-70',
                )}
              >
                <div className={cx('grid h-14 w-14 shrink-0 place-items-center rounded-2xl',
                  g.allowed ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400')}>
                  {g.allowed ? <Icon size={26} /> : <Lock size={22} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-semibold">{g.name}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-mute">
                    {g.allowed ? (
                      <>
                        <Badge>{g.title}</Badge>
                        {current && <Badge tone="gray">{t('groupCurrent')}</Badge>}
                      </>
                    ) : (
                      t('groupLocked')
                    )}
                  </div>
                </div>
                {g.allowed && <ChevronRight className="shrink-0 text-brand-400 transition group-hover:translate-x-0.5" size={20} />}
              </button>
            );
          })}
        </div>
        {err && <p className="mt-4 text-sm text-rose-500">{err}</p>}
      </main>
    </div>
  );
}
