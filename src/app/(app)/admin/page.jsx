"use client";
import { useState } from "react";
import { Users, FileText, Warehouse, UserCheck, Pencil, Trash2, Plus, UserRound } from "lucide-react";
import { api, useApi, avatarUrl } from "@/lib/client";
import { useT } from "@/lib/i18n";
import { useUser } from "@/components/Shell";
import { GROUPS, TITLES, DEPOS, ROLES, groupName } from "@/lib/constants";
import { Card, Btn, Badge, Avatar, Field, Modal, PageHead, Stat, inputCls } from "@/components/ui";
import StatusSettings from "@/components/StatusSettings";

const EMPTY_USER = { username: "", name: "", password: "", isAdmin: false };

export default function AdminPage() {
  const t = useT();
  const me = useUser();
  const users = useApi("/api/admin/users");
  const members = useApi("/api/admin/memberships");
  const stats = useApi("/api/admin/stats");
  const [uForm, setUForm] = useState(null); // account modal
  const [mForm, setMForm] = useState(null); // membership modal
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (!me.isAdmin) return <Card>{t("noAccess")}</Card>;

  const userList = (users.data?.users || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  const ms = members.data?.memberships || [];
  const userById = (id) => userList.find((u) => u.id === id);
  const s = stats.data || {};
  const depotItems = (s.depots || []).reduce((n, d) => n + d.items, 0);
  const reloadAll = () => {
    users.reload();
    members.reload();
    stats.reload();
  };

  // ── accounts ────────────────────────────────────────────────
  const openUser = (u) => {
    setErr("");
    setUForm(u ? { id: u.id, username: u.username, name: u.name, password: "", isAdmin: u.isAdmin } : { ...EMPTY_USER });
  };
  const submitUser = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const { id, ...data } = uForm;
      if (!data.password) delete data.password;
      if (id) await api(`/api/admin/users/${id}`, { method: "PATCH", body: data });
      else await api("/api/admin/users", { method: "POST", body: data });
      setUForm(null);
      reloadAll();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  const removeUser = async (u) => {
    if (!window.confirm(`${t("delete")}: ${u.name}\n${t("confirm")}`)) return;
    try {
      await api(`/api/admin/users/${u.id}`, { method: "DELETE" });
      reloadAll();
    } catch (e) {
      window.alert(e.message);
    }
  };

  // ── group places ────────────────────────────────────────────
  const openMember = (m, group) => {
    setErr("");
    setMForm(
      m
        ? { id: m.id, group: m.group, user: m.user || "", title: m.title, extraDepots: m.extraDepots }
        : { group, user: "", title: "Electronics Engineer", extraDepots: [] },
    );
  };
  const submitMember = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const { id, group, ...rest } = mForm;
      const data = { ...rest, user: rest.user || null };
      if (id) await api(`/api/admin/memberships/${id}`, { method: "PATCH", body: data });
      else await api("/api/admin/memberships", { method: "POST", body: { ...data, group } });
      setMForm(null);
      reloadAll();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  const removeMember = async (m) => {
    const who = userById(m.user)?.name || t("npcTitle");
    if (!window.confirm(`${t("delete")}: ${who} · ${m.title}\n${t("confirm")}`)) return;
    try {
      await api(`/api/admin/memberships/${m.id}`, { method: "DELETE" });
      reloadAll();
    } catch (e) {
      window.alert(e.message);
    }
  };
  const toggleDepot = (d) =>
    setMForm({
      ...mForm,
      extraDepots: mForm.extraDepots.includes(d) ? mForm.extraDepots.filter((x) => x !== d) : [...mForm.extraDepots, d],
    });

  const setU = (k) => (e) => setUForm({ ...uForm, [k]: e.target.value });
  const setM = (k) => (e) => setMForm({ ...mForm, [k]: e.target.value });

  return (
    <>
      <PageHead title={t("adminTitle")} sub={`${t("adminSub")} · ${groupName(me.group)}`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={UserCheck} label={t("statMembers")} value={s.members ?? "—"} />
        <Stat icon={Users} label={t("statUsers")} value={s.users ?? "—"} />
        <Stat icon={Warehouse} label={t("adminDepotObjects")} value={s.depots ? depotItems : "—"} />
        <Stat icon={FileText} label={t("statDocs")} value={s.docs ?? "—"} />
      </div>

      <div className="mt-4">
        <StatusSettings />
      </div>

      {/* groups and access */}
      <div className="mb-3 mt-8">
        <h2 className="text-lg font-semibold">{t("adminGroups")}</h2>
        <p className="text-sm text-mute">{t("adminGroupsSub")}</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {GROUPS.map((g) => {
          const list = ms.filter((m) => m.group === g.key)
            .sort((a, b) => TITLES.indexOf(a.title) - TITLES.indexOf(b.title) || (userById(a.user)?.name || "~").localeCompare(userById(b.user)?.name || "~"));
          const free = list.filter((m) => !m.user).length;
          return (
            <Card key={g.key}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{g.name}</h3>
                  <p className="text-xs text-mute">
                    {list.length - free} {t("members2")}
                    {free > 0 && ` · ${free} ${t("vacancies")}`}
                  </p>
                </div>
                <Btn v="ghost" onClick={() => openMember(null, g.key)}>
                  <Plus size={16} /> {t("addMember")}
                </Btn>
              </div>
              {!members.data ? (
                <p className="text-sm text-mute">{t("loading")}</p>
              ) : !list.length ? (
                <p className="text-sm text-mute">{t("noMembersYet")}</p>
              ) : (
                <ul className="divide-y divide-line">
                  {list.map((m) => {
                    const u = userById(m.user);
                    return (
                      <li key={m.id} className="flex items-center gap-3 py-2">
                        {u ? (
                          <Avatar name={u.name} src={avatarUrl(u)} size={30} />
                        ) : (
                          <div className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400"><UserRound size={15} /></div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className={u ? "truncate text-sm font-medium" : "truncate text-sm italic text-mute"}>{u ? u.name : t("npcTitle")}</div>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-mute">
                            {m.title}
                            {m.extraDepots.map((d) => (
                              <Badge key={d} tone="gray">+ {t("depot_" + d)}</Badge>
                            ))}
                          </div>
                        </div>
                        <Btn v="ghost" className="!px-2.5" onClick={() => openMember(m)} title={t("edit")} aria-label={`${t("edit")}: ${u?.name || t("npcTitle")}`}>
                          <Pencil size={15} />
                        </Btn>
                        <Btn v="danger" className="!px-2.5" onClick={() => removeMember(m)} title={t("delete")} aria-label={`${t("delete")}: ${u?.name || t("npcTitle")}`}>
                          <Trash2 size={15} />
                        </Btn>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      {/* accounts */}
      <Card className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">{t("adminUsers")}</h2>
          <Btn onClick={() => openUser(null)}>
            <Plus size={16} /> {t("addUser")}
          </Btn>
        </div>
        {!users.data ? (
          <p className="text-sm text-mute">{t("loading")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-line">
                {userList.map((u) => {
                  const own = ms.filter((m) => m.user === u.id);
                  return (
                    <tr key={u.id}>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} src={avatarUrl(u)} size={34} />
                          <div className="min-w-0">
                            <div className="truncate font-medium">{u.name} {u.isAdmin && <Badge>Admin</Badge>}</div>
                            <div className="text-xs text-mute">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="flex flex-wrap gap-1.5">
                          {u.isAdmin && <Badge tone="gray">{t("inGroups")}: {GROUPS.length}</Badge>}
                          {!u.isAdmin && !own.length && <span className="text-xs text-mute">{t("noGroupsBadge")}</span>}
                          {!u.isAdmin && own.map((m) => (
                            <Badge key={m.id} tone="gray">{groupName(m.group)} · {m.title}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Btn v="ghost" className="!px-2.5" onClick={() => openUser(u)} title={t("edit")} aria-label={`${t("edit")}: ${u.name}`}>
                            <Pencil size={15} />
                          </Btn>
                          {u.id !== me.id && (
                            <Btn v="danger" className="!px-2.5" onClick={() => removeUser(u)} title={t("delete")} aria-label={`${t("delete")}: ${u.name}`}>
                              <Trash2 size={15} />
                            </Btn>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {uForm && (
        <Modal title={uForm.id ? t("editUser") : t("addUser")} onClose={() => setUForm(null)}>
          <form onSubmit={submitUser} className="grid gap-3 sm:grid-cols-2">
            <Field label={t("username")}>
              <input required autoCapitalize="none" className={inputCls} value={uForm.username} onChange={setU("username")} />
            </Field>
            <Field label={t("fFullName")}>
              <input required className={inputCls} value={uForm.name} onChange={setU("name")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label={uForm.id ? `${t("newPassword")} (${t("keepBlank")})` : t("password")}>
                <input required={!uForm.id} minLength={uForm.id ? undefined : 6} type="password" autoComplete="new-password" className={inputCls} value={uForm.password} onChange={setU("password")} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={uForm.isAdmin} disabled={uForm.id === me.id} onChange={(e) => setUForm({ ...uForm, isAdmin: e.target.checked })} />
              {t("adminRole")}
            </label>
            {err && <p className="text-sm text-rose-500 sm:col-span-2">{err}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <Btn type="submit" disabled={busy}>{t("save")}</Btn>
              <Btn type="button" v="ghost" onClick={() => setUForm(null)}>{t("cancel")}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {mForm && (
        <Modal title={mForm.id ? t("editMember") : t("addMember")} onClose={() => setMForm(null)}>
          <form onSubmit={submitMember} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label={t("memberGroup")}>
                <input disabled className={inputCls} value={groupName(mForm.group)} readOnly />
              </Field>
            </div>
            <Field label={t("memberUser")}>
              <select className={inputCls} value={mForm.user} onChange={setM("user")}>
                <option value="">{t("memberVacant")}</option>
                {userList.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </Field>
            <Field label={t("memberRole")}>
              <select className={inputCls} value={mForm.title} onChange={setM("title")}>
                {TITLES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <fieldset className="sm:col-span-2">
              <legend className="mb-1 text-sm text-mute">{t("extraDepots")}</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {DEPOS.map((d) => {
                  const area = ROLES[mForm.title];
                  const byDefault = area === "leadership" || area === d; // this role already sees it
                  return (
                    <label key={d} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={byDefault || mForm.extraDepots.includes(d)} disabled={byDefault} onChange={() => toggleDepot(d)} />
                      {t("depot_" + d)}
                      {byDefault && <span className="text-xs text-mute">({t("byDefault")})</span>}
                    </label>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-mute">{t("extraDepotsHint")}</p>
            </fieldset>
            {err && <p className="text-sm text-rose-500 sm:col-span-2">{err}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <Btn type="submit" disabled={busy}>{t("save")}</Btn>
              <Btn type="button" v="ghost" onClick={() => setMForm(null)}>{t("cancel")}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
