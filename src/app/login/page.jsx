"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { useT } from "@/lib/i18n";
import { Btn, Field, inputCls, LangSwitch } from "@/components/ui";

export default function Login() {
  const t = useT();
  const [f, setF] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/api/auth/login", { method: "POST", body: f });
      location.href = "/groups";
    } catch (e) {
      setErr(e.status === 401 ? t("badLogin") : e.message);
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-100 via-white to-brand-50 p-4">
      <div className="absolute right-6 top-6">
        <LangSwitch />
      </div>
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-3xl border border-line bg-white p-8 shadow-[0_10px_40px_rgba(60,90,140,0.10)]"
      >
        <div className="mb-2 text-center">
          <div
            className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl"
            style={{
              backgroundImage: "url('/logov1.jpg')",
              backgroundSize: "cover",
            }}
          ></div>
          <h1 className="text-xl font-semibold">Team Dashboard</h1>
          <p className="mt-1 text-sm text-mute">{t("signInSub")}</p>
        </div>
        <Field label={t("username")}>
          <input
            required
            autoFocus
            autoCapitalize="none"
            className={inputCls}
            value={f.username}
            onChange={(e) => setF({ ...f, username: e.target.value })}
          />
        </Field>
        <Field label={t("password")}>
          <input
            required
            type="password"
            className={inputCls}
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
          />
        </Field>
        {err && <p className="text-sm text-rose-500">{err}</p>}
        <Btn type="submit" disabled={busy} className="w-full">
          {t("signIn")}
        </Btn>
      </form>
    </div>
  );
}
