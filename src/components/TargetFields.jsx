"use client";
import { useT } from "@/lib/i18n";
import { POSITIONS, DEPOS } from "@/lib/constants";
import { Field, inputCls } from "./ui";

// Scope / area / depot selects shared by the task and news forms.
// form = { targetScope, targetArea, targetDepot }, set(key) → onChange handler.
export default function TargetFields({ form, set, isAdmin }) {
  const t = useT();
  return (
    <>
      <Field label={t("target")}>
        <select className={inputCls} value={form.targetScope} onChange={set("targetScope")}>
          <option value="GROUP">{t("scopeGroup")}</option>
          <option value="AREA">{t("scopeArea")}</option>
          <option value="DEPO">{t("scopeDepo")}</option>
          {isAdmin && <option value="GLOBAL">{t("scopeGlobal")}</option>}
        </select>
      </Field>
      {form.targetScope === "AREA" && (
        <Field label={t("selectArea")}>
          <select className={inputCls} value={form.targetArea} onChange={set("targetArea")}>
            {POSITIONS.map((p) => <option key={p} value={p}>{t("area_" + p)}</option>)}
          </select>
        </Field>
      )}
      {form.targetScope === "DEPO" && (
        <Field label={t("selectDepo")}>
          <select className={inputCls} value={form.targetDepot} onChange={set("targetDepot")}>
            {DEPOS.map((d) => <option key={d} value={d}>{t("depot_" + d)}</option>)}
          </select>
        </Field>
      )}
    </>
  );
}
