"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  X,
  Search,
  Columns3,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useT } from "@/lib/i18n";

const BASE_COLUMNS = [
  { key: "stock", label: "Stock", tk: "depotStock", width: "w-32" },
  { key: "seriya", label: "Seriya", tk: "depotSeriya", width: "w-36" },
  { key: "name", label: "Name", tk: "fName", width: "w-64" },
  { key: "position", label: "Position", tk: "position", width: "w-40" },
];

const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export default function DepotBoard() {
  const t = useT();
  const depotLabel = (d) => {
    const k = "depot_" + d.key;
    const v = t(k);
    return v === k ? d.name : v;
  };
  const [depots, setDepots] = useState([]);
  const [activeKey, setActiveKey] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState("");

  const timers = useRef({});
  const latest = useRef({});

  // ── загрузка ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetch("/api/depots")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setDepots(data.depots);
        setActiveKey(data.depots[0]?.key ?? null);
      })
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // ── автосохранение (debounce 700мс на каждое депо) ─────────
  const save = useCallback(async (depot) => {
    setStatus("saving");
    try {
      const res = await fetch(`/api/depots/${depot.key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columns: depot.columns, items: depot.items }),
      });
      if (!res.ok) throw new Error();
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, []);

  const update = useCallback(
    (key, fn) => {
      setDepots((prev) =>
        prev.map((d) => {
          if (d.key !== key) return d;
          const next = fn(d);
          latest.current[key] = next;
          clearTimeout(timers.current[key]);
          timers.current[key] = setTimeout(
            () => save(latest.current[key]),
            700,
          );
          return next;
        }),
      );
    },
    [save],
  );

  // сохранить несохранённое при уходе со страницы
  useEffect(() => {
    const flush = () => {
      for (const key of Object.keys(timers.current)) {
        if (!timers.current[key]) continue;
        clearTimeout(timers.current[key]);
        const d = latest.current[key];
        if (d) {
          navigator.sendBeacon?.(
            `/api/depots/${key}`,
            new Blob([JSON.stringify({ columns: d.columns, items: d.items })], {
              type: "application/json",
            }),
          );
        }
      }
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  const depot = depots.find((d) => d.key === activeKey);

  // ── действия ───────────────────────────────────────────────
  const addItem = () =>
    update(activeKey, (d) => ({
      ...d,
      items: [
        ...d.items,
        {
          id: uid(),
          stock: "",
          seriya: "",
          name: "",
          position: "",
          active: true,
          props: {},
        },
      ],
    }));

  const removeItem = (id) =>
    update(activeKey, (d) => ({
      ...d,
      items: d.items.filter((i) => i.id !== id),
    }));

  const setField = (id, field, value) =>
    update(activeKey, (d) => ({
      ...d,
      items: d.items.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    }));

  const setProp = (id, colKey, value) =>
    update(activeKey, (d) => ({
      ...d,
      items: d.items.map((i) =>
        i.id === id ? { ...i, props: { ...i.props, [colKey]: value } } : i,
      ),
    }));

  const addColumn = () => {
    const label = newColumnLabel.trim();
    if (!label) return;
    update(activeKey, (d) => {
      if (d.columns.length >= 30) return d;
      return { ...d, columns: [...d.columns, { key: "c_" + uid(), label }] };
    });
    setNewColumnLabel("");
    setAddingColumn(false);
  };

  const removeColumn = (colKey) => {
    const col = depot.columns.find((c) => c.key === colKey);
    const filled = depot.items.filter((i) => i.props?.[colKey]).length;
    const msg =
      `${t("delete")}: ${col.label}\n${t("confirm")}` +
      (filled ? `\n${t("depotValuesLost")} (${filled})` : "");
    if (!window.confirm(msg)) return;
    update(activeKey, (d) => ({
      ...d,
      columns: d.columns.filter((c) => c.key !== colKey),
      items: d.items.map((i) => {
        const { [colKey]: _removed, ...rest } = i.props || {};
        return { ...i, props: rest };
      }),
    }));
  };

  const renameColumn = (colKey, label) =>
    update(activeKey, (d) => ({
      ...d,
      columns: d.columns.map((c) =>
        c.key === colKey ? { ...c, label: label.slice(0, 40) } : c,
      ),
    }));

  // ── фильтр и счётчики ──────────────────────────────────────
  const visible = useMemo(() => {
    if (!depot) return [];
    const q = query.trim().toLowerCase();
    const rows = depot.items.map((item, index) => ({
      item,
      number: index + 1,
    }));
    if (!q) return rows;
    return rows.filter(({ item }) =>
      [
        item.stock,
        item.seriya,
        item.name,
        item.position,
        ...Object.values(item.props || {}),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [depot, query]);

  const activeCount = depot?.items.filter((i) => i.active).length ?? 0;
  const passiveCount = (depot?.items.length ?? 0) - activeCount;

  if (loadError)
    return (
      <p className="rounded-lg bg-red-50 p-4 text-red-700">
        {t("depotLoadError")}
      </p>
    );
  if (!depot) return <p className="p-4 text-stone-500">{t("loading")}</p>;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            {t("depotTitle")}
          </h1>
          <p className="text-sm text-stone-500">{t("depoSub")}</p>
        </div>
        <SaveStatus status={status} t={t} />
      </header>

      {/* Вкладки депо */}
      <nav
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label={t("fDepo")}
      >
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
              className={
                "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 " +
                (selected
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:border-stone-500")
              }
            >
              {depotLabel(d)}
              <span
                className={
                  "rounded-md px-1.5 py-0.5 text-xs tabular-nums " +
                  (selected
                    ? "bg-white/20 text-white"
                    : "bg-stone-100 text-stone-600")
                }
              >
                {d.items.length}
              </span>
            </button>
          );
        })}
      </nav>

      <p className="text-sm text-stone-500">{t(`note_${activeKey}`)}</p>

      {/* Панель инструментов */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="w-64 rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        <div className="flex items-center gap-4 text-sm text-stone-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-teal-600" />{" "}
            {t("depotActive")}: <b className="tabular-nums">{activeCount}</b>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-stone-400" />{" "}
            {t("depotPassive")}: <b className="tabular-nums">{passiveCount}</b>
          </span>
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
                className="w-44 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              />
              <button
                type="submit"
                disabled={!newColumnLabel.trim()}
                className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-40"
              >
                {t("depotAdd")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingColumn(false);
                  setNewColumnLabel("");
                }}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
              >
                {t("cancel")}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setAddingColumn(true)}
              className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-stone-500"
            >
              <Columns3 className="h-4 w-4" /> {t("depotNewColumn")}
            </button>
          )}
          <button
            onClick={addItem}
            className="flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" /> {t("depotAddObject")}
          </button>
        </div>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto rounded-xl border border-stone-300 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 bg-stone-100 text-left text-stone-700">
              <th className="w-14 px-3 py-2.5 font-semibold">№</th>
              {BASE_COLUMNS.map((c) => (
                <th key={c.key} className="px-3 py-2.5 font-semibold">
                  {t(c.tk)}
                </th>
              ))}
              <th className="px-3 py-2.5 font-semibold">
                {t("depotActivePassive")}
              </th>
              {depot.columns.map((c) => (
                <th key={c.key} className="px-3 py-1.5 font-semibold">
                  <div className="flex items-center gap-1">
                    <input
                      value={c.label}
                      onChange={(e) => renameColumn(c.key, e.target.value)}
                      aria-label={c.label}
                      className="w-full min-w-24 rounded border border-transparent bg-transparent px-1 py-1 font-semibold hover:border-stone-300 focus:border-teal-600 focus:bg-white focus:outline-none"
                    />
                    <button
                      onClick={() => removeColumn(c.key)}
                      title={t("delete")}
                      aria-label={`${t("delete")}: ${c.label}`}
                      className="rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-red-600"
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
                <td
                  colSpan={BASE_COLUMNS.length + depot.columns.length + 3}
                  className="px-4 py-12 text-center text-stone-500"
                >
                  {depot.items.length === 0 ? (
                    <>
                      {t("depotEmpty")}{" "}
                      <button
                        onClick={addItem}
                        className="font-medium text-teal-700 underline underline-offset-2"
                      >
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
              <tr
                key={item.id}
                className="border-b border-stone-200 last:border-0 hover:bg-stone-50"
              >
                <td className="px-3 py-1.5 tabular-nums text-stone-500">
                  {number}
                </td>
                {BASE_COLUMNS.map((c) => (
                  <td key={c.key} className="px-1.5 py-1">
                    <Cell
                      value={item[c.key]}
                      onChange={(v) => setField(item.id, c.key, v)}
                      label={`${t(c.tk)}, ${t("depotRow")} ${number}`}
                    />
                  </td>
                ))}
                <td className="px-3 py-1.5">
                  <button
                    role="switch"
                    aria-checked={item.active}
                    onClick={() => setField(item.id, "active", !item.active)}
                    className={
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                      (item.active
                        ? "border-teal-600/40 bg-teal-50 text-teal-800"
                        : "border-stone-300 bg-stone-100 text-stone-600")
                    }
                  >
                    <span
                      className={
                        "h-2 w-2 rounded-full " +
                        (item.active ? "bg-teal-600" : "bg-stone-400")
                      }
                    />
                    {item.active ? t("depotActive") : t("depotPassive")}
                  </button>
                </td>
                {depot.columns.map((c) => (
                  <td key={c.key} className="px-1.5 py-1">
                    <Cell
                      value={item.props?.[c.key] ?? ""}
                      onChange={(v) => setProp(item.id, c.key, v)}
                      label={`${c.label}, ${t("depotRow")} ${number}`}
                    />
                  </td>
                ))}
                <td className="px-2 py-1 text-right">
                  <button
                    onClick={() => removeItem(item.id)}
                    title={t("delete")}
                    aria-label={`${t("delete")} ${number}`}
                    className="rounded p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
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

function Cell({ value, onChange, label }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      maxLength={200}
      className="w-full min-w-28 rounded-md border border-transparent bg-transparent px-2 py-1.5 outline-none hover:border-stone-300 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
    />
  );
}

function SaveStatus({ status, t }) {
  if (status === "saving")
    return (
      <span className="flex items-center gap-1.5 text-sm text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin" /> {t("depotSaving")}
      </span>
    );
  if (status === "saved")
    return (
      <span className="flex items-center gap-1.5 text-sm text-teal-700">
        <Check className="h-4 w-4" /> {t("saved")}
      </span>
    );
  if (status === "error")
    return (
      <span className="flex items-center gap-1.5 text-sm text-red-600">
        <AlertCircle className="h-4 w-4" /> {t("depotSaveError")}
      </span>
    );
  return null;
}
