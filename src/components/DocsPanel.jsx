'use client';
import { useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useApi, api } from '@/lib/client';
import { useT } from '@/lib/i18n';
import { useUser } from './Shell';
import { POSITIONS, LABEL, canSee, isLeader } from '@/lib/constants';
import { Card, Btn, Badge, Modal, Field, inputCls } from './ui';

// dept — если указан, показываем только Docs этого отдела
export default function DocsPanel({ dept }) {
  const t = useT();
  const user = useUser();
  const { data, reload } = useApi('/api/docs');
  const [q, setQ] = useState('');
  const [view, setView] = useState(null);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');

  const label = (d) => (d === 'all' ? t('everyone') : LABEL[d]);
  const allowed = ['all', ...POSITIONS].filter((a) => canSee(user, a));
  const canEdit = (d) => isLeader(user) || d.author?._id === user.id;
  const docs = (data?.docs || []).filter(
    (d) => (!dept || d.department === dept) && `${d.title} ${(d.tags || []).join(' ')}`.toLowerCase().includes(q.toLowerCase())
  );

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    const body = { title: form.title, content: form.content, department: form.department, tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean) };
    try {
      await api(form._id ? `/api/docs/${form._id}` : '/api/docs', { method: form._id ? 'PATCH' : 'POST', body });
      setForm(null);
      reload();
    } catch (e) { setErr(e.message); }
  };
  const del = async (d) => {
    if (!confirm(t('confirm'))) return;
    await api(`/api/docs/${d._id}`, { method: 'DELETE' });
    setView(null);
    reload();
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-mute" />
          <input className={inputCls + ' pl-9'} placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Btn onClick={() => setForm({ title: '', content: '', tags: '', department: dept || 'all' })}><Plus size={16} />{t('addDoc')}</Btn>
      </div>

      {!data ? <p className="text-mute">{t('loading')}</p> : !docs.length ? (
        <Card className="text-center text-mute">{t('empty')}</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {docs.map((d) => (
            <Card key={d._id} onClick={() => setView(d)} className="cursor-pointer transition hover:border-brand-300">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-semibold">{d.title}</h3>
                <Badge>{label(d.department)}</Badge>
              </div>
              <p className="line-clamp-2 text-sm text-mute">{d.content}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">{(d.tags || []).map((g) => <Badge key={g} tone="gray">#{g}</Badge>)}</div>
              <div className="mt-3 text-xs text-mute">{d.author?.name} · {new Date(d.updatedAt).toLocaleDateString()}</div>
            </Card>
          ))}
        </div>
      )}

      {view && (
        <Modal title={view.title} onClose={() => setView(null)}>
          <div className="mb-3 flex items-center gap-2 text-xs text-mute">
            <Badge>{label(view.department)}</Badge>{t('author')}: {view.author?.name} · {new Date(view.updatedAt).toLocaleDateString()}
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{view.content}</div>
          <div className="mt-5 flex justify-end gap-2">
            {canEdit(view) && (
              <>
                <Btn v="danger" onClick={() => del(view)}><Trash2 size={15} />{t('delete')}</Btn>
                <Btn v="ghost" onClick={() => { setForm({ ...view, tags: (view.tags || []).join(', ') }); setView(null); }}><Pencil size={15} />{t('edit')}</Btn>
              </>
            )}
          </div>
        </Modal>
      )}

      {form && (
        <Modal title={form._id ? t('editDoc') : t('addDoc')} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-3">
            <Field label={t('fTitle')}><input required className={inputCls} value={form.title} onChange={set('title')} /></Field>
            <Field label={t('fContent')}><textarea rows={8} className={inputCls} value={form.content} onChange={set('content')} /></Field>
            <Field label={t('fTags')}><input className={inputCls} value={form.tags} onChange={set('tags')} /></Field>
            <Field label={t('fVisible')}>
              <select className={inputCls} value={form.department} onChange={set('department')}>
                {allowed.map((a) => <option key={a} value={a}>{label(a)}</option>)}
              </select>
            </Field>
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
