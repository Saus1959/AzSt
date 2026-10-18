"use client";
import { useState } from "react";
import {
  Users,
  Boxes,
  FileText,
  Warehouse,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { api, useApi } from "@/lib/client";
import { useT } from "@/lib/i18n";
import { useUser } from "@/components/Shell";
import { POSITIONS, TITLES, LABEL } from "@/lib/constants";
import {
  Card,
  Btn,
  Badge,
  Avatar,
  Field,
  Modal,
  PageHead,
  Stat,
  inputCls,
} from "@/components/ui";

const EMPTY = {
  username: "",
  name: "",
  position: "electronics",
  title: TITLES[0],
  password: "",
  isAdmin: false,
};

export default function AdminPage() {
  const t = useT();
  const me = useUser();
  const users = useApi("/api/admin/users");
  const stats = useApi("/api/admin/stats");
  const [form, setForm] = useState(null); // null | { id?, ...поля }
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (!me.isAdmin) return <Card>{t("noAccess")}</Card>;

  const list = (users.data?.users || [])
    .slice()
    .sort(
      (a, b) =>
        POSITIONS.indexOf(a.position) - POSITIONS.indexOf(b.position) ||
        a.name.localeCompare(b.name),
    );
  const s = stats.data || {};
  const depotItems = (s.depots || []).reduce((n, d) => n + d.items, 0);
  const reloadAll = () => {
    users.reload();
    stats.reload();
  };

  const open = (u) => {
    setErr("");
    setForm(
      u
        ? {
            id: u.id,
            username: u.username,
            name: u.name,
            position: u.position,
            title: u.title,
            password: "",
            isAdmin: u.isAdmin,
          }
        : { ...EMPTY },
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const { id, ...data } = form;
      if (!data.password) delete data.password;
      if (id)
        await api(`/api/admin/users/${id}`, { method: "PATCH", body: data });
      else await api("/api/admin/users", { method: "POST", body: data });
      setForm(null);
      reloadAll();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`${t("delete")}: ${u.name}\n${t("confirm")}`)) return;
    try {
      await api(`/api/admin/users/${u.id}`, { method: "DELETE" });
      reloadAll();
    } catch (e) {
      window.alert(e.message);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHead title={t("adminTitle")} sub={t("adminSub")} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label={t("statTeam")} value={s.users ?? "—"} />
        <Stat
          icon={Warehouse}
          label={t("adminDepotObjects")}
          value={s.depots ? depotItems : "—"}
        />
        <Stat
          icon={Boxes}
          label={t("statResources")}
          value={s.resources ?? "—"}
        />
        <Stat icon={FileText} label={t("statDocs")} value={s.docs ?? "—"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">{t("adminUsers")}</h2>
            <Btn onClick={() => open(null)}>
              <Plus size={16} /> {t("addUser")}
            </Btn>
          </div>
          {!users.data ? (
            <p className="text-sm text-mute">{t("loading")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-line">
                  {list.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} size={34} />
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {u.name} {u.isAdmin && <Badge>Admin</Badge>}
                            </div>
                            <div className="text-xs text-mute">
                              @{u.username} · {u.title}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge tone="gray">{LABEL[u.position]}</Badge>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Btn
                            v="ghost"
                            className="!px-2.5"
                            onClick={() => open(u)}
                            title={t("edit")}
                            aria-label={`${t("edit")}: ${u.name}`}
                          >
                            <Pencil size={15} />
                          </Btn>
                          {u.id !== me.id && (
                            <Btn
                              v="danger"
                              className="!px-2.5"
                              onClick={() => remove(u)}
                              title={t("delete")}
                              aria-label={`${t("delete")}: ${u.name}`}
                            >
                              <Trash2 size={15} />
                            </Btn>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">{t("depotTitle")}</h2>
          {!s.depots ? (
            <p className="text-sm text-mute">{t("loading")}</p>
          ) : (
            <ul className="divide-y divide-line">
              {s.depots.map((d) => (
                <li key={d.key} className="py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t("depot_" + d.key)}</span>
                    <span className="text-mute">
                      {d.items} {t("adminObjects")}
                    </span>
                  </div>
                  <div className="mt-1.5 flex gap-2">
                    <Badge>
                      {t("depotActive")} · {d.active}
                    </Badge>
                    <Badge tone="gray">
                      {t("depotPassive")} · {d.passive}
                    </Badge>
                    {d.columns > 0 && (
                      <Badge tone="gray">
                        +{d.columns} {t("adminCustomCols")}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {form && (
        <Modal
          title={form.id ? t("editUser") : t("addUser")}
          onClose={() => setForm(null)}
        >
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <Field label={t("username")}>
              <input
                required
                autoCapitalize="none"
                className={inputCls}
                value={form.username}
                onChange={set("username")}
              />
            </Field>
            <Field label={t("fFullName")}>
              <input
                required
                className={inputCls}
                value={form.name}
                onChange={set("name")}
              />
            </Field>
            <Field label={t("position")}>
              <select
                className={inputCls}
                value={form.position}
                onChange={set("position")}
              >
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {LABEL[p]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("jobTitle")}>
              <select
                className={inputCls}
                value={form.title}
                onChange={set("title")}
              >
                {TITLES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field
                label={
                  form.id
                    ? `${t("newPassword")} (${t("keepBlank")})`
                    : t("password")
                }
              >
                <input
                  required={!form.id}
                  minLength={form.id ? undefined : 6}
                  type="text"
                  autoComplete="off"
                  className={inputCls}
                  value={form.password}
                  onChange={set("password")}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isAdmin}
                disabled={form.id === me.id}
                onChange={(e) =>
                  setForm({ ...form, isAdmin: e.target.checked })
                }
              />
              {t("adminRole")}
            </label>
            {err && (
              <p className="text-sm text-rose-500 sm:col-span-2">{err}</p>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <Btn type="submit" disabled={busy}>
                {t("save")}
              </Btn>
              <Btn type="button" v="ghost" onClick={() => setForm(null)}>
                {t("cancel")}
              </Btn>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
