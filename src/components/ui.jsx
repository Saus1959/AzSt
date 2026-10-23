'use client';
import { useEffect, useState } from 'react';
import { useLang } from '@/lib/store';

export const cx = (...a) => a.filter(Boolean).join(' ');

export const Card = ({ className, ...p }) => (
  <div {...p} className={cx('rounded-2xl border border-line bg-white p-5 shadow-[0_2px_12px_rgba(60,90,140,0.06)]', className)} />
);

const BTN = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600',
  ghost: 'bg-brand-50 text-brand-600 hover:bg-brand-100',
  danger: 'bg-rose-50 text-rose-500 hover:bg-rose-100',
};
export const Btn = ({ v = 'primary', className, ...p }) => (
  <button {...p} className={cx('inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition disabled:opacity-50', BTN[v], className)} />
);

export const inputCls = 'w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100';
export const Field = ({ label, children }) => (
  <label className="block text-sm"><span className="mb-1 block text-mute">{label}</span>{children}</label>
);

const TONE = { blue: 'bg-brand-100 text-brand-600', gray: 'bg-slate-100 text-slate-500', rose: 'bg-rose-50 text-rose-500' };
export const Badge = ({ tone = 'blue', children }) => (
  <span className={cx('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', TONE[tone])}>{children}</span>
);

export const STATUS_TONE = { ok: 'blue', in_use: 'gray', low: 'rose', out: 'rose', broken: 'rose' };
export const STATUS_BAR = { ok: 'bg-brand-300', in_use: 'bg-slate-300', low: 'bg-rose-200', out: 'bg-rose-300', broken: 'bg-rose-400' };

export function Avatar({ name = '?', size = 40, src }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  const ini = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  if (src && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} width={size} height={size} onError={() => setBroken(true)}
        className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="grid shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-600"
      style={{ width: size, height: size, fontSize: size / 2.8 }}>{ini}</div>
  );
}

export const PageHead = ({ title, sub, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {sub && <p className="mt-1 text-sm text-mute">{sub}</p>}
    </div>
    {children}
  </div>
);

export const Stat = ({ icon: Icon, label, value }) => (
  <Card className="flex items-center gap-4">
    <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-100 text-brand-600"><Icon size={22} /></div>
    <div><div className="text-2xl font-semibold">{value}</div><div className="text-sm text-mute">{label}</div></div>
  </Card>
);

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/20 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function LangSwitch() {
  const { lang, setLang } = useLang();
  useEffect(() => {
    try { const l = localStorage.getItem('lang'); if (l) useLang.setState({ lang: l }); } catch {}
  }, []);
  return (
    <div className="flex rounded-xl border border-line bg-white p-0.5 text-xs font-semibold">
      {['az', 'en'].map((l) => (
        <button key={l} onClick={() => setLang(l)}
          className={cx('rounded-lg px-2.5 py-1.5 uppercase', lang === l ? 'bg-brand-100 text-brand-600' : 'text-mute')}>{l}</button>
      ))}
    </div>
  );
}
