'use client';
import { useRef, useState } from 'react';
import {
  Plus, Search, Pencil, Trash2, Download, Eye, Upload, X,
  File, FileText, FileSpreadsheet, FileImage, FileArchive, FileCode, FileAudio, FileVideo, Presentation, Box,
} from 'lucide-react';
import { useApi, api, apiForm } from '@/lib/client';
import { useT } from '@/lib/i18n';
import { useUser } from './Shell';
import { POSITIONS, LABEL, canSee, isLeader } from '@/lib/constants';
import { ACCEPT, MIME, MAX_FILE_MB, MAX_FILE_BYTES, extOf, kindOf, canPreview, fmtSize } from '@/lib/files';
import { Card, Btn, Badge, Modal, Field, inputCls, cx } from './ui';

// icon + colours per kind of file
const KIND = {
  pdf: [FileText, 'bg-rose-50 text-rose-500'],
  word: [FileText, 'bg-blue-50 text-blue-600'],
  sheet: [FileSpreadsheet, 'bg-emerald-50 text-emerald-600'],
  slides: [Presentation, 'bg-orange-50 text-orange-500'],
  image: [FileImage, 'bg-violet-50 text-violet-500'],
  archive: [FileArchive, 'bg-amber-50 text-amber-600'],
  code: [FileCode, 'bg-slate-100 text-slate-600'],
  cad: [Box, 'bg-cyan-50 text-cyan-600'],
  audio: [FileAudio, 'bg-pink-50 text-pink-500'],
  video: [FileVideo, 'bg-pink-50 text-pink-500'],
  other: [File, 'bg-slate-100 text-slate-500'],
};
const FileIcon = ({ name, size = 20 }) => {
  const [Icon, tone] = KIND[kindOf(name)];
  return (
    <div className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-xl', tone)}>
      <Icon size={size} />
    </div>
  );
};

const fileUrl = (d, inline) => `/api/docs/${d._id}/file${inline ? '?inline=1' : ''}`;

// dept — если указан, показываем только Docs этого отдела
export default function DocsPanel({ dept }) {
  const t = useT();
  const user = useUser();
  const { data, reload } = useApi('/api/docs');
  const fileInput = useRef(null);
  const [q, setQ] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [view, setView] = useState(null);
  const [form, setForm] = useState(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const label = (d) => (d === 'all' ? t('everyone') : LABEL[d]);
  const allowed = ['all', ...POSITIONS].filter((a) => canSee(user, a));
  const canEdit = (d) => isLeader(user) || d.author?._id === user.id;
  const docs = (data?.docs || []).filter(
    (d) =>
      (!dept || d.department === dept) &&
      (!deptFilter || d.department === deptFilter) &&
      `${d.title} ${d.file?.name || ''} ${(d.tags || []).join(' ')}`.toLowerCase().includes(q.toLowerCase())
  );

  const pickFile = (file) => {
    if (!file) return;
    if (!(extOf(file.name) in MIME)) return setErr(t('fileBadType'));
    if (file.size > MAX_FILE_BYTES) return setErr(t('fileTooBig').replace('{mb}', MAX_FILE_MB));
    setErr('');
    setForm((f) => ({ ...f, file, title: f.title || file.name.replace(/\.[^.]+$/, '') }));
  };

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const fd = new FormData();
    fd.set('title', form.title);
    fd.set('content', form.content);
    fd.set('tags', form.tags);
    fd.set('department', form.department);
    if (form.file) fd.set('file', form.file);
    try {
      await apiForm(form._id ? `/api/docs/${form._id}` : '/api/docs', form._id ? 'PATCH' : 'POST', fd);
      setForm(null);
      reload();
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };
  const del = async (d) => {
    if (!confirm(t('confirm'))) return;
    await api(`/api/docs/${d._id}`, { method: 'DELETE' });
    setView(null);
    reload();
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const openForm = (f) => { setErr(''); setForm(f); };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-mute" />
          <input className={inputCls + ' pl-9'} placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {!dept && allowed.length > 2 && (
          <select className={inputCls + ' !w-auto'} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">{t('allDepartments')}</option>
            {allowed.map((a) => <option key={a} value={a}>{label(a)}</option>)}
          </select>
        )}
        <Btn className="w-full sm:w-auto" onClick={() => openForm({ title: '', content: '', tags: '', department: dept || 'all', file: null })}>
          <Plus size={16} />{t('addDoc')}
        </Btn>
      </div>

      {!data ? <p className="text-mute">{t('loading')}</p> : !docs.length ? (
        <Card className="text-center text-mute">{t('empty')}</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {docs.map((d) => (
            <Card key={d._id} onClick={() => setView(d)} className="cursor-pointer transition hover:border-brand-300">
              <div className="flex gap-3">
                {d.file && <FileIcon name={d.file.name} />}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="break-words font-semibold">{d.title}</h3>
                    <Badge>{label(d.department)}</Badge>
                  </div>
                  {d.file && (
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-mute">
                      <span className="truncate">{d.file.name} · {fmtSize(d.file.size)}</span>
                      <a
                        href={fileUrl(d)}
                        onClick={(e) => e.stopPropagation()}
                        title={t('download')}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100"
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  )}
                  {d.content && <p className="line-clamp-2 break-words text-sm text-mute">{d.content}</p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">{(d.tags || []).map((g) => <Badge key={g} tone="gray">#{g}</Badge>)}</div>
              <div className="mt-3 text-xs text-mute">{d.author?.name} · {new Date(d.updatedAt).toLocaleDateString()}</div>
            </Card>
          ))}
        </div>
      )}

      {view && (
        <Modal title={view.title} onClose={() => setView(null)}>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-mute">
            <Badge>{label(view.department)}</Badge>{t('author')}: {view.author?.name} · {new Date(view.updatedAt).toLocaleDateString()}
          </div>

          {view.file && (
            <div className="mb-4 rounded-xl border border-line p-3">
              <div className="flex items-center gap-3">
                <FileIcon name={view.file.name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{view.file.name}</div>
                  <div className="text-xs text-mute">{fmtSize(view.file.size)}</div>
                </div>
              </div>
              {kindOf(view.file.name) === 'image' && canPreview(view.file.name) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(view, true)} alt={view.title} className="mt-3 max-h-72 w-full rounded-lg object-contain" />
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={fileUrl(view)}>
                  <Btn type="button"><Download size={15} />{t('download')}</Btn>
                </a>
                {extOf(view.file.name) === 'pdf' && (
                  <a href={fileUrl(view, true)} target="_blank" rel="noreferrer">
                    <Btn type="button" v="ghost"><Eye size={15} />{t('preview')}</Btn>
                  </a>
                )}
              </div>
            </div>
          )}

          {view.content && <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{view.content}</div>}
          {!!view.tags?.length && (
            <div className="mt-3 flex flex-wrap gap-1.5">{view.tags.map((g) => <Badge key={g} tone="gray">#{g}</Badge>)}</div>
          )}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            {canEdit(view) && (
              <>
                <Btn v="danger" onClick={() => del(view)}><Trash2 size={15} />{t('delete')}</Btn>
                <Btn v="ghost" onClick={() => { openForm({ ...view, tags: (view.tags || []).join(', '), file: null, hadFile: !!view.file }); setView(null); }}><Pencil size={15} />{t('edit')}</Btn>
              </>
            )}
          </div>
        </Modal>
      )}

      {form && (
        <Modal title={form._id ? t('editDoc') : t('addDoc')} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-3">
            {/* file picker / drop zone */}
            <div>
              <span className="mb-1 block text-sm text-mute">
                {t('docFile')} <span className="text-xs">({t('maxSize')}: {MAX_FILE_MB} MB)</span>
              </span>
              <input ref={fileInput} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
              {form.file ? (
                <div className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <FileIcon name={form.file.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{form.file.name}</div>
                    <div className="text-xs text-mute">{fmtSize(form.file.size)}</div>
                  </div>
                  <button type="button" onClick={() => setForm({ ...form, file: null })} className="grid h-8 w-8 place-items-center rounded-lg text-mute hover:bg-brand-50" title={t('removeFile')}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files?.[0]); }}
                  className={cx(
                    'flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm text-mute transition',
                    drag ? 'border-brand-400 bg-brand-50' : 'border-line hover:border-brand-300 hover:bg-brand-50/50'
                  )}
                >
                  <Upload size={22} className="text-brand-500" />
                  {t('dropFile')}
                  <span className="text-xs">PDF, Word, Excel, PowerPoint, PNG/JPG, ZIP, CAD, TXT…</span>
                </button>
              )}
              {form._id && form.hadFile && !form.file && <p className="mt-1 text-xs text-mute">{t('replaceHint')}</p>}
            </div>

            <Field label={t('fTitle')}><input required={!form.file} className={inputCls} value={form.title} onChange={set('title')} /></Field>
            <Field label={t('fContent')}><textarea rows={4} className={inputCls} value={form.content} onChange={set('content')} /></Field>
            <Field label={t('fTags')}><input className={inputCls} value={form.tags} onChange={set('tags')} /></Field>
            <Field label={t('fVisible')}>
              <select className={inputCls} value={form.department} onChange={set('department')}>
                {allowed.map((a) => <option key={a} value={a}>{label(a)}</option>)}
              </select>
            </Field>
            {err && <p className="text-sm text-rose-500">{err}</p>}
            <div className="flex justify-end gap-2">
              <Btn type="button" v="ghost" onClick={() => setForm(null)}>{t('cancel')}</Btn>
              <Btn type="submit" disabled={busy}>{busy ? t('uploading') : t('save')}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
