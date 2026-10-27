"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, CheckCheck, ChevronDown, ChevronUp } from "lucide-react";
import { api, newsChanged } from "@/lib/client";
import { useUser } from "@/components/Shell";
import { useT } from "@/lib/i18n";
import { canCreateTask } from "@/lib/taskUtils";
import { targetLabel } from "@/lib/targetLabel";
import { Card, Btn, Badge, Modal, Field, inputCls, cx } from "@/components/ui";
import TargetFields from "@/components/TargetFields";

const EMPTY = { title: "", body: "", targetScope: "GROUP", targetArea: "electronics", targetDepot: "electronics" };

export default function NewsPanel() {
  const user = useUser();
  const t = useT();
  const manager = canCreateTask(user);

  const [news, setNews] = useState(null);
  const [open, setOpen] = useState(null);
  const [modal, setModal] = useState(null); // null | {} (create) | { id } (edit)
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try { setNews((await api("/api/news")).news || []); } catch { setNews([]); }
  };
  useEffect(() => { load(); }, []);

  const isUnread = (n) => n.mine && !n.read;
  const unreadCount = (news || []).filter(isUnread).length;

  const markRead = async (body) => {
    try { await api("/api/news/read", { method: "POST", body }); } catch {}
    newsChanged();
  };

  const toggle = (n) => {
    const opening = open !== n._id;
    setOpen(opening ? n._id : null);
    if (opening && isUnread(n)) {
      setNews((list) => list.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      markRead({ ids: [n._id] });
    }
  };

  const readAll = async () => {
    setNews((list) => list.map((x) => ({ ...x, read: true })));
    await markRead({ all: true });
  };

  const openCreate = () => { setForm(EMPTY); setError(""); setModal({}); };
  const openEdit = (n) => { setForm({ ...EMPTY, title: n.title, body: n.body || "" }); setError(""); setModal({ id: n._id }); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (modal.id) await api(`/api/news/${modal.id}`, { method: "PATCH", body: { title: form.title, body: form.body } });
      else await api("/api/news", { method: "POST", body: form });
      setModal(null);
      await load();
      newsChanged();
    } catch (err) {
      setError(err.message || t("taskSaveError"));
    }
    setSaving(false);
  };

  const remove = async (n) => {
    if (!confirm(t("confirmDeleteNews"))) return;
    try { await api(`/api/news/${n._id}`, { method: "DELETE" }); } catch {}
    await load();
    newsChanged();
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-mute">
          {unreadCount > 0 ? `${t("unreadNews")}: ${unreadCount}` : ""}
        </div>
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <Btn v="ghost" onClick={readAll}><CheckCheck size={16} />{t("markAllRead")}</Btn>
          )}
          {manager && <Btn onClick={openCreate}><Plus size={16} />{t("createNews")}</Btn>}
        </div>
      </div>

      <div className="space-y-3">
        {news && !news.length && <p className="py-8 text-center text-mute">{t("noNews")}</p>}

        {(news || []).map((n) => {
          const unread = isUnread(n);
          const expanded = open === n._id;
          return (
            <Card key={n._id} className={cx("p-4 sm:p-5", unread && "border-brand-300 bg-brand-50/40")}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <button type="button" onClick={() => toggle(n)} className="min-w-0 flex-1 text-left">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {unread && <Badge tone="rose">{t("newBadge")}</Badge>}
                    <Badge tone="gray">{targetLabel(n, t)}</Badge>
                    <span className="text-xs text-mute">
                      {n.createdBy?.name} · {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className={cx("text-lg", unread ? "font-bold" : "font-semibold")}>{n.title}</h3>
                  {n.body && (
                    <p className={cx("mt-1 whitespace-pre-wrap break-words text-sm text-mute", !expanded && "line-clamp-3")}>
                      {n.body}
                    </p>
                  )}
                  {n.body && n.body.length > 140 && (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-brand-600">
                      {expanded ? <><ChevronUp size={14} />{t("showLess")}</> : <><ChevronDown size={14} />{t("readMore")}</>}
                    </span>
                  )}
                </button>

                {n.canEdit && (
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => openEdit(n)} title={t("editNews")} className="grid h-8 w-8 place-items-center rounded-lg text-mute hover:bg-brand-50">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(n)} title={t("deleteTask")} className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {modal && (
        <Modal title={modal.id ? t("editNews") : t("createNews")} onClose={() => setModal(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label={t("title")}>
              <input required className={inputCls} value={form.title} onChange={set("title")} />
            </Field>
            <Field label={t("newsBody")}>
              <textarea className={inputCls} rows={6} value={form.body} onChange={set("body")} />
            </Field>
            {!modal.id && <TargetFields form={form} set={set} isAdmin={user.isAdmin} />}
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Btn type="button" v="ghost" onClick={() => setModal(null)}>{t("cancel")}</Btn>
              <Btn type="submit" disabled={saving}>{modal.id ? t("save") : t("publish")}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
