'use client';
import { useState } from 'react';
import { Plus, Minus, Pencil, Trash2, Search } from 'lucide-react';
import { useApi, api } from '@/lib/client';
import { useT } from '@/lib/i18n';
import { useUser } from '@/components/Shell';
import { DEPOS, STATUSES, LABEL, canSee } from '@/lib/constants';
import { Card, Btn, Modal, Field, PageHead, inputCls, cx } from '@/components/ui';

const EMPTY = { name: '', category: '', quantity: 1, status: 'ok', location: '', notes: '' };

export default function DepoPage() {
  const t = useT();
  const user = useUser();
  const tabs = DEPOS.filter((d) => canSee(user, d));
  const [tab, setTab] = useState(tabs[0]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');
  const { data, reload } = useApi('/api/resources');

  if (!tabs.length) return <Card>{t('noAccess')}</Card>;

  const rows = (data?.resources || []).filter(
    (r) => r.depo === tab && `${r.name} ${r.category} ${r.location}`.toLowerCase().includes(q.toLowerCase())
  );
  const patch = async (r, body) => { await api(`/api/resources/${r._id}`, { method: 'PATCH', body }); reload(); };
  const del = async (r) => {
    if (!confirm(t('confirm'))) return;
    await api(`/api/resources/${r._id}`, { method: 'DELETE' });
    reload();
  };
  const save = async (e) => {
    e.preventDefault();
    setErr('');
    const body = { ...form, quantity: Number(form.quantity) };
    delete body._id; delete body.updatedBy; delete body.createdAt; delete body.updatedAt; delete body.__v;
    try {
      await api(form._id ? `/api/resources/${form._id}` : '/api/resources', { method: form._id ? 'PATCH' : 'POST', body });
      setForm(null);
      reload();
    } catch (e) { setErr(e.message); }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHead title="Depo" sub={t('depoSub')}>
        <Btn onClick={() => setForm({ ...EMPTY, depo: tab })}><Plus size={16} />{t('addResource')}</Btn>
      </PageHead>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-2xl border border-line bg-white p-1">
          {tabs.map((d) => (
            <button key={d} onClick={() => setTab(d)}
              className={cx('rounded-xl px-4 py-2 text-sm font-medium transition', tab === d ? 'bg-brand-100 text-brand-600' : 'text-mute hover:bg-brand-50')}>
              {LABEL[d]} Depo
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-2.5 text-mute" />
          <input className={inputCls + ' pl-9'} placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <p className="mb-3 text-xs text-mute">{t('note_' + tab)}</p>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-mute">
              {['fName', 'fCategory', 'fQty', 'fStatus', 'fLocation'].map((k) => <th key={k} className="px-4 py-3 font-medium">{t(k)}</th>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {!data && <tr><td colSpan={6} className="px-4 py-6 text-mute">{t('loading')}</td></tr>}
            {data && !rows.length && <tr><td colSpan={6} className="px-4 py-6 text-center text-mute">{t('empty')}</td></tr>}
            {rows.map((r) => (
              <tr key={r._id} className="border-b border-line/60 last:border-0 hover:bg-brand-50/50">
                <td className="px-4 py-3"><div className="font-medium">{r.name}</div>{r.notes && <div className="text-xs text-mute">{r.notes}</div>}</td>
                <td className="px-4 py-3 text-mute">{r.category}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => patch(r, { quantity: Math.max(0, r.quantity - 1) })} className="grid h-6 w-6 place-items-center rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100"><Minus size={13} /></button>
                    <span className="w-8 text-center font-medium">{r.quantity}</span>
                    <button onClick={() => patch(r, { quantity: r.quantity + 1 })} className="grid h-6 w-6 place-items-center rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100"><Plus size={13} /></button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select value={r.status} onChange={(e) => patch(r, { status: e.target.value })} className="rounded-lg border border-line bg-white px-2 py-1 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{t('s_' + s)}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-mute">{r.location}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setForm(r)} className="grid h-8 w-8 place-items-center rounded-lg text-mute hover:bg-brand-50"><Pencil size={15} /></button>
                    <button onClick={() => del(r)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-400 hover:bg-rose-50"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {form && (
        <Modal title={form._id ? t('editResource') : t('addResource')} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-3">
            <Field label={t('fName')}><input required className={inputCls} value={form.name} onChange={set('name')} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('fCategory')}><input className={inputCls} value={form.category} onChange={set('category')} /></Field>
              <Field label={t('fQty')}><input type="number" min="0" className={inputCls} value={form.quantity} onChange={set('quantity')} /></Field>
              <Field label={t('fStatus')}>
                <select className={inputCls} value={form.status} onChange={set('status')}>{STATUSES.map((s) => <option key={s} value={s}>{t('s_' + s)}</option>)}</select>
              </Field>
              <Field label={t('fLocation')}><input className={inputCls} value={form.location} onChange={set('location')} /></Field>
            </div>
            <Field label={t('fDepo')}>
              <select className={inputCls} value={form.depo} onChange={set('depo')}>{tabs.map((d) => <option key={d} value={d}>{LABEL[d]} Depo</option>)}</select>
            </Field>
            <Field label={t('fNotes')}><textarea rows={3} className={inputCls} value={form.notes} onChange={set('notes')} /></Field>
            {err && <p className="text-sm text-rose-500">{err}</p>}
            <div className="flex justify-end gap-2">
              <Btn type="button" v="ghost" onClick={() => setForm(null)}>{t('cancel')}</Btn>
              <Btn type="submit">{t('save')}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
