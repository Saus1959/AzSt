'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { useT } from '@/lib/i18n';
import { STATUS_HOURS } from '@/lib/constants';
import { Btn, Modal, cx } from './ui';

const KEY = 'presenceAsked'; // the popup is shown once per day
const NUDGE_MS = 30 * 60 * 1000; // "still at work?" banner in the last 30 minutes
const today = () => new Date().toLocaleDateString('en-CA');
const hhmm = (ms) => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// State of the "at work" status for the signed-in user. Active while `until` is in the future.
export function usePresence(user) {
  const [until, setUntil] = useState(user.activeUntil ? new Date(user.activeUntil).getTime() : 0);
  const [now, setNow] = useState(0); // 0 until mounted: server and client render the same HTML
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

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
  const clear = () => run(async () => {
    await api(`/api/users/${user.id}/status`, { method: 'DELETE' });
    setUntil(0);
    asked(); setOpen(false);
  });
  const dismiss = () => { asked(); setOpen(false); };

  return { until, now, mounted: now > 0, active: now > 0 && until > now, open, setOpen, busy, err, set, clear, dismiss };
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
        <Btn v="ghost" disabled={p.busy} onClick={() => p.set(1)}>+1 {t('hourShort')}</Btn>
        <Btn v="ghost" disabled={p.busy} onClick={() => p.set(2)}>+2 {t('hourShort')}</Btn>
        <Btn v="danger" disabled={p.busy} onClick={p.clear}>{t('workLeft')}</Btn>
      </span>
    </div>
  );
}

export function PresenceModal({ p }) {
  const t = useT();
  if (!p.open) return null;
  return (
    <Modal title={t('workQ')} onClose={p.dismiss}>
      <div className="grid grid-cols-2 gap-2">
        {STATUS_HOURS.map((h) => (
          <Btn key={h} disabled={p.busy} onClick={() => p.set(h)}>{h} {t('hourShort')}</Btn>
        ))}
      </div>
      <Btn v="ghost" className="mt-2 w-full" disabled={p.busy} onClick={p.active ? p.clear : p.dismiss}>
        {p.active ? t('workLeft') : t('workNo')}
      </Btn>
      <p className="mt-3 text-xs text-mute">{t('workHint')}</p>
      {p.err && <p className="mt-2 text-sm text-rose-500">{p.err}</p>}
    </Modal>
  );
}
