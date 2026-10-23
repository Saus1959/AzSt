"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, X, Search, Columns3, Check, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/client";
import { useT } from "@/lib/i18n";
import { groupName } from "@/lib/constants";
import { useUser } from "./Shell";
import { Card, Btn, Badge, PageHead, inputCls, cx } from "./ui";

// Built-in columns: key in the data, translation key of the default header.
const BASE_COLUMNS = [
  { key: "stock", tk: "depotStock" },
  { key: "seriya", tk: "depotSeriya" },
  { key: "name", tk: "fName" },
  { key: "position", tk: "position" },
];
const ACTIVE_COLUMN = { key: "active", tk: "depotActivePassive" };

const MAX_COLUMNS = 30;
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const newPending = () => ({ items: new Set(), removed: new Set(), columns: false, labels: false });
const norm = (d) => ({ ...d, labels: d.labels || {}, columns: d.columns || [], items: d.items || [] });

export default function DepotBoard() {
  const t = useT();
  const user = useUser();
  const depotLabel = (d) => {
    const k = "depot_" + d.key;
    const v = t(k);
    return v === k ? d.name : v;
  };

  const [depots, setDepots] = useState([]);
  const depotsRef = useRef([]); // always the latest state, readable from timers
  const [activeKey, setActiveKey] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const [loadError, setLoadError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState("");

  const pending = useRef({}); // depot key → what changed since the last save
  const timers = useRef({});
  const inflight = useRef(0);

  const setAll = (next) => {
    depotsRef.current = next;
    setDepots(next);
  };
  const hasPending = () => Object.values(pending.current).some(Boolean);

  // ── load ────────────────────────────────────────────────────
  const load = useCallback(async (first) => {
    try {
      const data = await api("/api/depots");
      setAll(data.depots.map(norm));
      setActiveKey((k) => k ?? data.depots[0]?.key ?? null);
      setLoaded(true);
    } catch {
      if (first) setLoadError(true);
    }
  }, []);
  useEffect(() => {
    load(true);
  }, [load]);

  // pick up other people's changes when the tab becomes visible again (only if nothing is unsaved)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && !hasPending() && !inflight.current) load(false);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  // ── saving: only the changed rows / columns / labels are sent ──
  const buildOps = (key, p) => {
    const d = depotsRef.current.find((x) => x.key === key);
    if (!d) return [];
    const ops = [];
    if (p.columns) ops.push({ op: "columns", columns: d.columns });
    if (p.labels) ops.push({ op: "labels", labels: d.labels });
    p.removed.forEach((id) => ops.push({ op: "removeItem", id }));
    p.items.forEach((id) => {
      const item = d.items.find((i) => i.id === id);
      if (item) ops.push({ op: "item", item });
    });
    return ops;
  };

  const flush = useCallback(async (key) => {
    clearTimeout(timers.current[key]);
    timers.current[key] = null;
    const p = pending.current[key];
    if (!p) return;
    pending.current[key] = null;
    const ops = buildOps(key, p);
    if (!ops.length) return;

    inflight.current++;
    setStatus("saving");
    try {
      await api(`/api/depots/${key}`, { method: "PATCH", body: { ops } });
      inflight.current--;
      if (!hasPending() && !inflight.current) setStatus("saved");
    } catch {
      inflight.current--;
      // put the changes back and try again in 5 seconds
      const cur = (pending.current[key] ||= newPending());
      p.items.forEach((id) => !cur.removed.has(id) && cur.items.add(id));
      p.removed.forEach((id) => cur.removed.add(id));
      cur.columns ||= p.columns;
      cur.labels ||= p.labels;
      setStatus("error");
      timers.current[key] = setTimeout(() => flush(key), 5000);
    }
  }, []);

  const schedule = (key) => {
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => flush(key), 700);
    setStatus("saving");
  };

  // save what is left when the tab is closed
  useEffect(() => {
    const onHide = () => {
      for (const [key, p] of Object.entries(pending.current)) {
        if (!p) continue;
        const ops = buildOps(key, p);
        if (ops.length)
          navigator.sendBeacon?.(`/api/depots/${key}`, new Blob([JSON.stringify({ ops })], { type: "application/json" }));
      }
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  // change the active depot locally and remember what to send
  const apply = (fn, mark) => {
    const key = activeKey;
    setAll(depotsRef.current.map((d) => (d.key === key ? fn(d) : d)));
    mark((pending.current[key] ||= newPending()));
    schedule(key);
  };

  const depot = depots.find((d) => d.key === activeKey);

  // ── actions ─────────────────────────────────────────────────
  const addItem = () => {
    const id = uid();
    apply(
      (d) => ({ ...d, items: [...d.items, { id, stock: "", seriya: "", name: "", position: "", active: true, props: {} }] }),
      (p) => p.items.add(id),
    );
  };
  const removeItem = (id) =>
    apply(
      (d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }),
      (p) => {
        p.items.delete(id);
        p.removed.add(id);
      },
    );
  const setField = (id, field, value) =>
    apply(
      (d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, [field]: value } : i)) }),
      (p) => p.items.add(id),
    );
  const setProp = (id, colKey, value) =>
    apply(
      (d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, props: { ...i.props, [colKey]: value } } : i)) }),
      (p) => p.items.add(id),
    );

  const addColumn = () => {
    const label = newColumnLabel.trim();
    if (!label || depot.columns.length >= MAX_COLUMNS) return;
    apply(
      (d) => ({ ...d, columns: [...d.columns, { key: "c_" + uid(), label }] }),
      (p) => (p.columns = true),
    );
    setNewColumnLabel("");
    setAddingColumn(false);
  };
  const removeColumn = (colKey) => {
    const col = depot.columns.find((c) => c.key === colKey);
    const filled = depot.items.filter((i) => i.props?.[colKey]).length;
    const msg = `${t("delete")}: ${col.label}\n${t("confirm")}` + (filled ? `\n${t("depotValuesLost")} (${filled})` : "");
    if (!window.confirm(msg)) return;
    apply(
      (d) => ({
        ...d,
        columns: d.columns.filter((c) => c.key !== colKey),
        items: d.items.map((i) => {
          const { [colKey]: _gone, ...rest } = i.props || {};
          return { ...i, props: rest };
        }),
      }),
      (p) => (p.columns = true), // the server also drops the values of the removed column
    );
  };
  const renameColumn = (colKey, label) =>
    apply(
      (d) => ({ ...d, columns: d.columns.map((c) => (c.key === colKey ? { ...c, label: label.slice(0, 40) } : c)) }),
      (p) => (p.columns = true),
    );
  // Rename a built-in column. Empty or equal to the default → back to the translated default.
  const renameBase = (baseKey, value, def) =>
    apply(
      (d) => {
        const labels = { ...d.labels };
        const s = value.trim().slice(0, 40);
        if (!s || s === def) delete labels[baseKey];
        else labels[baseKey] = s;
        return { ...d, labels };
      },
      (p) => (p.labels = true),
    );

  // ── filter and counters ─────────────────────────────────────
  const visible = useMemo(() => {
    if (!depot) return [];
    const q = query.trim().toLowerCase();
    const rows = depot.items.map((item, index) => ({ item, number: index + 1 }));
    if (!q) return rows;
    return rows.filter(({ item }) =>
      [item.stock, item.seriya, item.name, item.position, ...Object.values(item.props || {})].join(" ").toLowerCase().includes(q),
    );
  }, [depot, query]);

  const activeCount = depot?.items.filter((i) => i.active).length ?? 0;
  const passiveCount = (depot?.items.length ?? 0) - activeCount;

  if (loadError) return <Card className="text-rose-500">{t("depotLoadError")}</Card>;
  if (!depot) return <p className="p-4 text-mute">{loaded ? t("noAccess") : t("loading")}</p>;

  const headerLabel = (c) => depot.labels?.[c.key] || t(c.tk);
  const colSpan = BASE_COLUMNS.length + depot.columns.length + 3;

  return (
    <div className="space-y-5">
      <PageHead title={t("depotTitle")} sub={`${groupName(user.group)} · ${t("depoSub")}`}>
        <SaveStatus status={status} t={t} />
      </PageHead>

      {/* depot tabs */}
      <nav className="flex flex-wrap gap-2" role="tablist" aria-label={t("fDepo")}>
        {depots.map((d) => {
          const selected = d.key === activeKey;
          return (
            <button
              key={d.key}
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setActiveKey(d.key);
                setQuery("");
                setAddingColumn(false);
              }}
              className={cx(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
                selected ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-white text-ink hover:border-brand-300",
              )}
            >
              {depotLabel(d)}
              <span className={cx("rounded-md px-1.5 py-0.5 text-xs tabular-nums", selected ? "bg-white/25 text-white" : "bg-brand-50 text-brand-600")}>
                {d.items.length}
              </span>
            </button>
          );
        })}
      </nav>

      <p className="text-sm text-mute">{t(`note_${activeKey}`)}</p>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className={cx(inputCls, "w-64 pl-9")}
          />
        </div>

        <div className="flex items-center gap-2">
          <Badge>{t("depotActive")}: {activeCount}</Badge>
          <Badge tone="gray">{t("depotPassive")}: {passiveCount}</Badge>
        </div>

        <div className="ml-auto flex gap-2">
          {addingColumn ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addColumn();
              }}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                value={newColumnLabel}
                onChange={(e) => setNewColumnLabel(e.target.value)}
                placeholder={t("depotColumnName")}
                maxLength={40}
                aria-label={t("depotColumnName")}
                className={cx(inputCls, "w-44")}
              />
              <Btn type="submit" disabled={!newColumnLabel.trim()}>{t("depotAdd")}</Btn>
              <Btn
                type="button"
                v="ghost"
                onClick={() => {
                  setAddingColumn(false);
                  setNewColumnLabel("");
                }}
              >
                {t("cancel")}
              </Btn>
            </form>
          ) : (
            <Btn v="ghost" onClick={() => setAddingColumn(true)} disabled={depot.columns.length >= MAX_COLUMNS}>
              <Columns3 className="h-4 w-4" /> {t("depotNewColumn")}
            </Btn>
          )}
          <Btn onClick={addItem}>
            <Plus className="h-4 w-4" /> {t("depotAddObject")}
          </Btn>
        </div>
      </div>

      <p className="text-xs text-mute">{t("depotRenameHint")}</p>

      {/* table */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_2px_12px_rgba(60,90,140,0.06)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-brand-50 text-left text-ink">
              <th className="w-14 px-3 py-2.5 font-semibold text-mute">№</th>
              {BASE_COLUMNS.map((c) => (
                <th key={c.key} className="px-1.5 py-1.5 font-semibold">
                  <LabelInput value={headerLabel(c)} label={headerLabel(c)} onCommit={(v) => renameBase(c.key, v, t(c.tk))} allowEmpty />
                </th>
              ))}
              <th className="px-1.5 py-1.5 font-semibold">
                <LabelInput
                  value={headerLabel(ACTIVE_COLUMN)}
                  label={headerLabel(ACTIVE_COLUMN)}
                  onCommit={(v) => renameBase(ACTIVE_COLUMN.key, v, t(ACTIVE_COLUMN.tk))}
                  allowEmpty
                />
              </th>
              {depot.columns.map((c) => (
                <th key={c.key} className="px-1.5 py-1.5 font-semibold">
                  <div className="flex items-center gap-1">
                    <LabelInput value={c.label} label={c.label} onCommit={(v) => renameColumn(c.key, v)} />
                    <button
                      onClick={() => removeColumn(c.key)}
                      title={t("delete")}
                      aria-label={`${t("delete")}: ${c.label}`}
                      className="rounded-lg p-1 text-mute hover:bg-rose-50 hover:text-rose-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="w-12 px-2" aria-label={t("depotActions")} />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-12 text-center text-mute">
                  {depot.items.length === 0 ? (
                    <>
                      {t("depotEmpty")}{" "}
                      <button onClick={addItem} className="font-medium text-brand-600 underline underline-offset-2">
                        {t("depotAddFirst")}
                      </button>
                    </>
                  ) : (
                    t("empty")
                  )}
                </td>
              </tr>
            )}
            {visible.map(({ item, number }) => (
              <tr key={item.id} className="border-b border-line last:border-0 hover:bg-brand-50/50">
                <td className="px-3 py-1.5 tabular-nums text-mute">{number}</td>
                {BASE_COLUMNS.map((c) => (
                  <td key={c.key} className="px-1.5 py-1">
                    <Cell value={item[c.key]} onChange={(v) => setField(item.id, c.key, v)} label={`${headerLabel(c)}, ${t("depotRow")} ${number}`} />
                  </td>
                ))}
                <td className="px-3 py-1.5">
                  <button
                    role="switch"
                    aria-checked={item.active}
                    onClick={() => setField(item.id, "active", !item.active)}
                    className={cx(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition",
                      item.active ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    <span className={cx("h-2 w-2 rounded-full", item.active ? "bg-brand-500" : "bg-slate-400")} />
                    {item.active ? t("depotActive") : t("depotPassive")}
                  </button>
                </td>
                {depot.columns.map((c) => (
                  <td key={c.key} className="px-1.5 py-1">
                    <Cell value={item.props?.[c.key] ?? ""} onChange={(v) => setProp(item.id, c.key, v)} label={`${c.label}, ${t("depotRow")} ${number}`} />
                  </td>
                ))}
                <td className="px-2 py-1 text-right">
                  <button
                    onClick={() => removeItem(item.id)}
                    title={t("delete")}
                    aria-label={`${t("delete")} ${number}`}
                    className="rounded-lg p-1.5 text-mute hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Header that can be renamed: saved on blur / Enter, Escape cancels.
function LabelInput({ value, label, onCommit, allowEmpty = false }) {
  const [v, setV] = useState(value);
  const cancelled = useRef(false);
  useEffect(() => setV(value), [value]);
  return (
    <input
      value={v}
      maxLength={40}
      aria-label={label}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        if (cancelled.current) {
          cancelled.current = false;
          setV(value);
          return;
        }
        if (v === value) return;
        if (!allowEmpty && !v.trim()) return setV(value);
        onCommit(v);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          cancelled.current = true;
          e.currentTarget.blur();
        }
      }}
      className="w-full min-w-24 rounded-lg border border-transparent bg-transparent px-2 py-1.5 font-semibold hover:border-line focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
    />
  );
}

function Cell({ value, onChange, label }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      maxLength={200}
      className="w-full min-w-28 rounded-lg border border-transparent bg-transparent px-2 py-1.5 outline-none hover:border-line focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
    />
  );
}

function SaveStatus({ status, t }) {
  if (status === "saving")
    return (
      <span className="flex items-center gap-1.5 text-sm text-mute">
        <Loader2 className="h-4 w-4 animate-spin" /> {t("depotSaving")}
      </span>
    );
  if (status === "saved")
    return (
      <span className="flex items-center gap-1.5 text-sm text-brand-600">
        <Check className="h-4 w-4" /> {t("saved")}
      </span>
    );
  if (status === "error")
    return (
      <span className="flex items-center gap-1.5 text-sm text-rose-500">
        <AlertCircle className="h-4 w-4" /> {t("depotSaveError")} · {t("depotRetry")}
      </span>
    );
  return null;
}
