"use client";
import { useEffect, useState } from "react";
import {
  CheckCircle2, Circle, Clock, ChevronDown, ChevronUp, Plus, Pencil, Trash2, Users,
} from "lucide-react";
import { api, useUnreadNews } from "@/lib/client";
import { targetLabel } from "@/lib/targetLabel";
import TargetFields from "@/components/TargetFields";
import NewsPanel from "@/components/NewsPanel";
import { useUser } from "@/components/Shell";
import { useT } from "@/lib/i18n";
import { canCreateTask, isDoneFor, isOverdue, markedByMe } from "@/lib/taskUtils";
import { Card, Btn, Badge, Modal, Field, inputCls, PageHead, cx } from "@/components/ui";

const EMPTY = {
  title: "", description: "", dueDate: "", targetScope: "GROUP",
  targetArea: "electronics", targetDepot: "electronics", completionType: "INDIVIDUAL",
};
const dayInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export default function TasksPage() {
  const user = useUser();
  const t = useT();
  const manager = canCreateTask(user);
  const unreadNews = useUnreadNews("page");
  const [section, setSection] = useState("tasks"); // "tasks" | "news" (also #news in the URL)

  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState("todo");
  const [openId, setOpenId] = useState(null); // task with the comment box open
  const [pendingId, setPendingId] = useState(null); // task with the "not marked yet" list open
  const [comment, setComment] = useState("");
  const [modal, setModal] = useState(null); // null | { id? } (id → edit)
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setTasks((await api("/api/tasks")).tasks || []);
    } catch {
      setTasks([]);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (location.hash === "#news") setSection("news");
  }, []);
  const go = (k) => {
    setSection(k);
    history.replaceState(null, "", k === "news" ? "#news" : location.pathname);
  };

  const toggleDone = async (id, isDone) => {
    try {
      await api(`/api/tasks/${id}/done`, { method: "POST", body: { comment, isDone } });
    } catch {}
    setComment("");
    setOpenId(null);
    load();
  };

  const openCreate = () => { setForm(EMPTY); setError(""); setModal({}); };
  const openEdit = (task) => {
    setForm({
      ...EMPTY, title: task.title, description: task.description || "",
      dueDate: dayInput(task.dueDate), completionType: task.completionType,
    });
    setError("");
    setModal({ id: task._id });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (modal.id) {
        const { title, description, dueDate, completionType } = form;
        await api(`/api/tasks/${modal.id}`, { method: "PATCH", body: { title, description, dueDate, completionType } });
      } else {
        await api("/api/tasks", { method: "POST", body: form });
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.message || t("taskSaveError"));
    }
    setSaving(false);
  };

  const remove = async (task) => {
    if (!confirm(t("confirmDeleteTask"))) return;
    try { await api(`/api/tasks/${task._id}`, { method: "DELETE" }); } catch {}
    load();
  };

  const tabs = [["todo", t("todoTasks")], ["done", t("completedTasks")], ...(manager ? [["all", t("allTasks")]] : [])];
  const shown = tasks.filter((x) =>
    tab === "all" ? true : x.mine && (tab === "todo" ? !isDoneFor(x, user.id) : isDoneFor(x, user.id)),
  );
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHead title={t("tasksAndNews")}>
        {manager && section === "tasks" && (
          <Btn onClick={openCreate}><Plus size={16} />{t("createTask")}</Btn>
        )}
      </PageHead>

      <div className="mb-5 inline-flex max-w-full rounded-2xl bg-brand-50 p-1">
        {[["tasks", t("tabTasks")], ["news", t("tabNews")]].map(([k, label]) => (
          <button
            key={k}
            onClick={() => go(k)}
            className={cx(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
              section === k ? "bg-white text-brand-600 shadow-sm" : "text-mute hover:text-brand-600",
            )}
          >
            {label}
            {k === "news" && unreadNews > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold leading-none text-white">
                {unreadNews > 99 ? "99+" : unreadNews}
              </span>
            )}
          </button>
        ))}
      </div>

      {section === "news" ? (
        <NewsPanel />
      ) : (
      <>
      <div className="mb-4 flex gap-2 overflow-x-auto border-b border-line">
        {tabs.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cx(
              "shrink-0 border-b-2 px-4 py-2 text-sm font-medium",
              tab === k ? "border-brand-500 text-brand-600" : "border-transparent text-mute",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {!shown.length && <p className="py-8 text-center text-mute">{t("noTasks")}</p>}

        {shown.map((task) => {
          const mine = markedByMe(task, user.id);
          const overdue = task.mine && isOverdue(task) && !isDoneFor(task, user.id);
          const p = task.progress;
          return (
            <Card key={task._id} className={cx(overdue && "border-rose-300 bg-rose-50")}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge>{targetLabel(task, t)}</Badge>
                    {task.dueDate && (
                      <span className={cx("flex items-center text-xs", overdue ? "font-bold text-rose-600" : "text-mute")}>
                        <Clock size={12} className="mr-1" />
                        {new Date(task.dueDate).toLocaleDateString()}
                        {overdue && ` · ${t("overdue")}`}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold">{task.title}</h3>
                  {task.description && <p className="mt-1 whitespace-pre-wrap text-sm text-mute">{task.description}</p>}

                  {/* Manager view: progress and who has not marked it yet */}
                  {p && (
                    <div className="mt-3 rounded-xl border border-line bg-brand-50 p-3 text-sm">
                      {p.shared ? (
                        <div className="font-medium">{p.done ? t("sharedClosed") : t("sharedOpen")}</div>
                      ) : (
                        <>
                          <div className="mb-1.5 flex items-center justify-between font-medium">
                            <span className="flex items-center gap-1.5">
                              <Users size={14} />
                              {p.done}/{p.total} {t("taskDoneCount")}
                            </span>
                            {p.pending.length > 0 ? (
                              <button
                                className="flex items-center gap-1 text-xs text-brand-600"
                                onClick={() => setPendingId(pendingId === task._id ? null : task._id)}
                              >
                                {t("notMarkedYet")} ({p.pending.length})
                                {pendingId === task._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            ) : (
                              p.total > 0 && <Badge tone="green">{t("everyoneDone")}</Badge>
                            )}
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white">
                            <div className="h-full bg-brand-400" style={{ width: p.total ? `${(p.done / p.total) * 100}%` : 0 }} />
                          </div>
                          {pendingId === task._id && (
                            <ul className="mt-2 flex flex-wrap gap-1.5">
                              {p.pending.map((u) => <Badge key={u.id} tone="rose">{u.name}</Badge>)}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {task.completedBy?.length > 0 && (
                    <div className="mt-3 rounded-xl border border-line bg-brand-50 p-2 text-sm">
                      <p className="mb-1 font-medium text-brand-600">{t("completionMarks")}</p>
                      {task.completedBy.map((c) => (
                        <div key={c.user?._id || String(c.user)} className="text-mute">
                          <span className="font-medium">{c.user?.name}</span>
                          {c.comment && <span className="italic"> — «{c.comment}»</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  {task.mine && (
                    <Btn
                      v={mine ? "ghost" : "primary"}
                      onClick={() => {
                        setOpenId(openId === task._id ? null : task._id);
                        setComment(task.completedBy?.find((c) => (c.user?._id || c.user) === user.id)?.comment || "");
                      }}
                    >
                      {mine ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      {mine ? t("completedTasks") : t("markDone")}
                      {openId === task._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </Btn>
                  )}
                  {task.canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(task)} title={t("editTask")} className="grid h-8 w-8 place-items-center rounded-lg text-mute hover:bg-brand-50">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => remove(task)} title={t("deleteTask")} className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {openId === task._id && (
                <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
                  <textarea
                    placeholder={t("commentPlaceholder")}
                    className={inputCls}
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    {mine && <Btn v="danger" onClick={() => toggleDone(task._id, false)}>{t("unmarkDone")}</Btn>}
                    <Btn onClick={() => toggleDone(task._id, true)}>{t("saveResult")}</Btn>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      </>
      )}

      {modal && (
        <Modal title={modal.id ? t("editTask") : t("createTask")} onClose={() => setModal(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label={t("title")}>
              <input required className={inputCls} value={form.title} onChange={set("title")} />
            </Field>
            <Field label={t("description")}>
              <textarea className={inputCls} rows={3} value={form.description} onChange={set("description")} />
            </Field>

            {!modal.id && <TargetFields form={form} set={set} isAdmin={user.isAdmin} />}
            <Field label={t("taskType")}>
              <select className={inputCls} value={form.completionType} onChange={set("completionType")}>
                <option value="INDIVIDUAL">{t("completionIndividual")}</option>
                <option value="SHARED">{t("completionShared")}</option>
              </select>
            </Field>

            <Field label={t("dueDate")}>
              <input type="date" className={inputCls} value={form.dueDate} onChange={set("dueDate")} />
            </Field>

            {error && <p className="text-sm text-rose-500">{error}</p>}
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Btn type="button" v="ghost" onClick={() => setModal(null)}>{t("cancel")}</Btn>
              <Btn type="submit" disabled={saving}>{t("save")}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
