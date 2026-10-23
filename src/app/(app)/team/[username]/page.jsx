'use client';
import { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApi, api, avatarUrl, fileToAvatar } from '@/lib/client';
import { useT } from '@/lib/i18n';
import { useUser } from '@/components/Shell';
import { LABEL } from '@/lib/constants';
import { Card, Btn, Badge, Avatar, Field, PageHead, inputCls } from '@/components/ui';

export default function Profile() {
  const { username } = useParams();
  const me = useUser();
  const t = useT();
  const router = useRouter();
  const { data, reload } = useApi('/api/users');
  const [form, setForm] = useState(null);
  const [pw, setPw] = useState({ currentPassword: '', password: '' });
  const [msg, setMsg] = useState({ ok: true, text: '' });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  if (!data) return <p className="text-mute">{t('loading')}</p>;
  const u = data.users?.find((x) => x.username === username);
  if (!u) return <Card>{t('empty')}</Card>;

  const isSelf = u.id === me.id;
  const f = form ?? { name: u.name, password: '' };

  const patch = async (body) => {
    try {
      await api(`/api/users/${u.id}`, { method: 'PATCH', body });
      setMsg({ ok: true, text: t('saved') });
      setForm(null);
      setPw({ currentPassword: '', password: '' });
      reload();
      router.refresh();
    } catch (e) { setMsg({ ok: false, text: e.message }); }
  };
  const savePhoto = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      let image;
      try { image = await fileToAvatar(file); } catch { throw new Error(t('photoBad')); }
      await api(`/api/users/${u.id}/avatar`, { method: 'PUT', body: { image } });
      setMsg({ ok: true, text: t('saved') });
      reload();
      router.refresh();
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };
  const removePhoto = async () => {
    setBusy(true);
    try {
      await api(`/api/users/${u.id}/avatar`, { method: 'DELETE' });
      setMsg({ ok: true, text: t('saved') });
      reload();
      router.refresh();
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    setBusy(false);
  };
  const saveAdmin = (e) => {
    e.preventDefault();
    patch({ name: f.name, ...(f.password ? { password: f.password } : {}) });
  };

  return (
    <>
      <PageHead title={u.name} sub={t('profile')} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-2 text-center">
          <Avatar name={u.name} src={avatarUrl(u)} size={88} />
          <div className="mt-2 text-lg font-semibold">{u.name}</div>
          <div className="text-sm text-mute">{u.title}</div>
          <Badge>{LABEL[u.position]}</Badge>
          <div className="mt-2 text-xs text-mute">@{u.username}</div>
          {(isSelf || me.isAdmin) && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => savePhoto(e.target.files?.[0])} />
              <Btn type="button" v="ghost" disabled={busy} onClick={() => fileRef.current?.click()}>{t('changePhoto')}</Btn>
              {u.avatarV > 0 && <Btn type="button" v="danger" disabled={busy} onClick={removePhoto}>{t('removePhoto')}</Btn>}
              <span className="text-xs text-mute">{t('photoHint')}</span>
            </div>
          )}
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {me.isAdmin && (
            <Card>
              <h2 className="mb-4 font-semibold">{t('manageMember')}</h2>
              <form onSubmit={saveAdmin} className="grid gap-3 sm:grid-cols-2">
                <Field label={t('fFullName')}><input className={inputCls} value={f.name} onChange={(e) => setForm({ ...f, name: e.target.value })} /></Field>
                {!isSelf && (
                  <Field label={`${t('newPassword')} (${t('keepBlank')})`}>
                    <input type="text" className={inputCls} value={f.password} onChange={(e) => setForm({ ...f, password: e.target.value })} />
                  </Field>
                )}
                <div className="sm:col-span-2"><Btn type="submit">{t('save')}</Btn></div>
              </form>
            </Card>
          )}

          {isSelf && (
            <Card>
              <h2 className="mb-4 font-semibold">{t('changePassword')}</h2>
              <form onSubmit={(e) => { e.preventDefault(); patch(pw); }} className="grid gap-3 sm:grid-cols-2">
                <Field label={t('currentPassword')}><input required type="password" className={inputCls} value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
                <Field label={t('newPassword')}><input required minLength={6} type="password" className={inputCls} value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} /></Field>
                <div className="sm:col-span-2"><Btn type="submit">{t('changePassword')}</Btn></div>
              </form>
            </Card>
          )}
          {msg.text && <p className={msg.ok ? 'text-sm text-brand-600' : 'text-sm text-rose-500'}>{msg.text}</p>}
        </div>
      </div>
    </>
  );
}
