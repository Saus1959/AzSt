'use client';
import { useEffect, useState } from 'react';
import { api, useApi } from '@/lib/client';
import { useT } from '@/lib/i18n';
import { STATUS_HOURS } from '@/lib/constants';
import { Btn, Modal, cx, inputCls } from './ui';

const KEY = 'presenceAsked'; // the popup is shown once per day
const NUDGE_MS = 30 * 60 * 1000; // "still at work?" banner in the last 30 minutes
const today = () => new Date().toLocaleDateString('en-CA');
const fmtH = (h, t) => (h < 1 ? `${Math.round(h * 60)} ${t('minShort')}` : `${h} ${t('hourShort')}`);
const hhmm = (ms) => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// State of the "at work" status for the signed-in user. Active while `until` is in the future.
export function usePresence(user) {
  const [until, setUntil] = useState(user.activeUntil ? new Date(user.activeUntil).getTime() : 0);
  const [now, setNow] = useState(0); // 0 until mounted: server and client render the same HTML
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const { data: cfg } = useApi('/api/settings');
  const settings = {
    statusHours: cfg?.statusHours || STATUS_HOURS,
    statusFree: !!cfg?.statusFree,
    statusMaxHours: cfg?.statusMaxHours || 24,
  };

  useEffect(() => {
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (until > Date.now()) return;
    try { if (localStorage.getItem(KEY) === today()) return; } catch {}
    setOpen(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const asked = () => { try { localStorage.setItem(KEY, today()); } catch {} };
  const run = async (fn) => {
    setBusy(true); setErr('');
    try { await fn(); } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const set = (hours) => run(async () => {
    const r = await api(`/api/users/${user.id}/status`, { method: 'PUT', body: { hours } });
    setUntil(new Date(r.activeUntil).getTime());
    setNow(Date.now());
    asked(); setOpen(false);
  });
  const setMinutes = (minutes) => run(async () => {
    const r = await api(`/api/users/${user.id}/status`, { method: 'PUT', body: { minutes } });
    setUntil(new Date(r.activeUntil).getTime());
    setNow(Date.now());
    asked(); setOpen(false);
  });
  const clear = () => run(async () => {
    await api(`/api/users/${user.id}/status`, { method: 'DELETE' });
    setUntil(0);
    asked(); setOpen(false);
  });
  const dismiss = () => { asked(); setOpen(false); };

  return { settings, isAdmin: !!user.isAdmin, setMinutes, until, now, mounted: now > 0, active: now > 0 && until > now, open, setOpen, busy, err, set, clear, dismiss };
}

export function PresenceChip({ p }) {
  const t = useT();
  if (!p.mounted) return null;
  return (
    <button type="button" onClick={() => p.setOpen(true)}
      className={cx('flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium',
        p.active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-line bg-white text-mute')}>
      <span className={cx('h-2 w-2 rounded-full', p.active ? 'bg-emerald-500' : 'bg-slate-300')} />
      {p.active ? `${t('statusActive')} · ${t('statusUntil').replace('{time}', hhmm(p.until))}` : t('statusPassive')}
    </button>
  );
}

// Banner for the last 30 minutes: extend or switch off.
export function PresenceNudge({ p }) {
  const t = useT();
  if (!p.active || p.until - p.now > NUDGE_MS) return null;
  return (
    <div role="status" className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <span className="font-medium">
        {t('nudgeQ')} <span className="font-normal text-mute">{t('statusUntil').replace('{time}', hhmm(p.until))}</span>
      </span>
      <span className="ml-auto flex flex-wrap gap-2">
        {p.settings.statusFree ? (
          <Btn v="ghost" disabled={p.busy} onClick={() => p.setOpen(true)}>{t('setNewTime')}</Btn>
        ) : (
          p.settings.statusHours.slice(0, 2).map((h) => (
            <Btn key={h} v="ghost" disabled={p.busy} onClick={() => p.set(h)}>+{fmtH(h, t)}</Btn>
          ))
        )}
        <Btn v="danger" disabled={p.busy} onClick={p.clear}>{t('workLeft')}</Btn>
      </span>
    </div>
  );
}

export function PresenceModal({ p }) {
  const t = useT();
  const [custom, setCustom] = useState('');
  if (!p.open) return null;
  const customH = Number(String(custom).replace(',', '.'));
  const free = p.settings.statusFree;
  const max = p.isAdmin ? 24 : p.settings.statusMaxHours;
  const customOk = custom !== '' && customH >= 1 / 60 && customH <= max;
  return (
    <Modal title={t('workQ')} onClose={p.dismiss}>
      {!free && (
        <div className="grid grid-cols-2 gap-2">
          {p.settings.statusHours.map((h) => (
            <Btn key={h} disabled={p.busy} onClick={() => p.set(h)}>{fmtH(h, t)}</Btn>
          ))}
        </div>
      )}
      {(free || p.isAdmin) && (
        <form className="mt-3 flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (customOk) p.setMinutes(Math.round(customH * 60)); }}>
          <label className="block flex-1 text-sm">
            <span className="mb-1 block text-mute">{free ? t('planQ') : t('customHours')} · ≤ {max} {t('hourShort')}</span>
            <input type="text" inputMode="decimal" placeholder="8" autoFocus={free} value={custom} onChange={(e) => setCustom(e.target.value)} className={inputCls} />
          </label>
          <Btn type="submit" disabled={p.busy || !customOk}>{t('setBtn')}</Btn>
        </form>
      )}
      <Btn v="ghost" className="mt-2 w-full" disabled={p.busy} onClick={p.active ? p.clear : p.dismiss}>
        {p.active ? t('workLeft') : t('workNo')}
      </Btn>
      <p className="mt-3 text-xs text-mute">{t('workHint')}</p>
      {p.err && <p className="mt-2 text-sm text-rose-500">{p.err}</p>}
    </Modal>
  );
}
