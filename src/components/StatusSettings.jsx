'use client';
import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { api, useApi } from '@/lib/client';
import { useT } from '@/lib/i18n';
import { Card, Btn, Field, inputCls } from './ui';

// Admin: duration options of the "at work" status, or free choice for everyone.
export default function StatusSettings() {
  const t = useT();
  const { data, reload } = useApi('/api/settings');
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState({ ok: true, text: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data?.statusHours) setF({ hours: data.statusHours.join(', '), free: data.statusFree, max: String(data.statusMaxHours) });
  }, [data]);
  if (!f) return null;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ ok: true, text: '' });
    try {
      const statusHours = f.hours.split(/[\s,;]+/).map(Number).filter((n) => n > 0);
      await api('/api/admin/settings', {
        method: 'PUT',
        body: { statusHours, statusFree: f.free, statusMaxHours: Number(String(f.max).replace(',', '.')) },
      });
      setMsg({ ok: true, text: t('saved') });
      reload();
    } catch (err) { setMsg({ ok: false, text: err.message }); }
    setBusy(false);
  };

  return (
    <Card>
      <h2 className="flex items-center gap-2 font-semibold"><Clock size={18} className="text-brand-600" />{t('statusSettings')}</h2>
      <p className="mb-4 text-sm text-mute">{t('statusSettingsSub')}</p>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <Field label={t('presetsLabel')}>
          <input className={inputCls} value={f.hours} disabled={f.free} placeholder="1, 2, 4, 6"
            onChange={(e) => setF({ ...f, hours: e.target.value })} />
        </Field>
        <Field label={t('maxHoursLabel')}>
          <input className={inputCls} value={f.max} inputMode="decimal" onChange={(e) => setF({ ...f, max: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={f.free} onChange={(e) => setF({ ...f, free: e.target.checked })} />
          {t('freeChoice')}
        </label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <Btn type="submit" disabled={busy}>{t('save')}</Btn>
          {msg.text && <span className={msg.ok ? 'text-sm text-brand-600' : 'text-sm text-rose-500'}>{msg.text}</span>}
        </div>
      </form>
    </Card>
  );
}
