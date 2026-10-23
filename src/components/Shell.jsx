"use client";
import { createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Cpu,
  Wrench,
  Code2,
  Warehouse,
  Crown,
  FileText,
  Users,
  LogOut,
  ShieldCheck,
  ArrowLeftRight,
} from "lucide-react";
import { api, avatarUrl } from "@/lib/client";
import { useT } from "@/lib/i18n";
import { LABEL, canSee, groupName, visibleDepots } from "@/lib/constants";
import { Avatar, LangSwitch, cx } from "./ui";

const UserCtx = createContext(null);
export const useUser = () => useContext(UserCtx);
const ICON = {
  electronics: Cpu,
  mechanics: Wrench,
  programming: Code2,
  leadership: Crown,
};

export default function Shell({ user, children }) {
  const path = usePathname();
  const t = useT();
  const sec = (p) =>
    canSee(user, p) && {
      href: `/section/${p}`,
      label: LABEL[p],
      Icon: ICON[p],
    };
  const nav = [
    { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    sec("electronics"),
    sec("mechanics"),
    sec("programming"),
    visibleDepots(user).length > 0 && {
      href: "/depo",
      label: "Depo",
      Icon: Warehouse,
    },
    sec("leadership"),
    { href: "/docs", label: "Docs", Icon: FileText },
    { href: "/team", label: "Team", Icon: Users },
    user.isAdmin && { href: "/admin", label: "Admin", Icon: ShieldCheck },
  ].filter(Boolean);

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    location.href = "/login";
  };

  return (
    <UserCtx.Provider value={user}>
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="border-b border-line bg-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
          <div className="flex items-center gap-2.5 px-5 py-4 md:py-6">
            <div
              className="grid h-9 w-9 place-items-center rounded-xl font-bold text-white"
              style={{
                backgroundImage: "url('/logov1.jpg')",
                backgroundSize: "cover",
              }}
            ></div>
            <span className="font-semibold">AzSt</span>
          </div>
          <Link
            href="/groups"
            title={t("switchGroup")}
            className="mx-3 mb-3 flex items-center justify-between gap-2 rounded-xl border border-line bg-brand-50 px-3 py-2 text-sm hover:bg-brand-100"
          >
            <span className="min-w-0">
              <span className="block truncate font-semibold">{groupName(user.group)}</span>
              <span className="block truncate text-xs text-mute">{user.title}</span>
            </span>
            <ArrowLeftRight size={16} className="shrink-0 text-brand-600" />
          </Link>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
            {nav.map(({ href, label, Icon }) => {
              const active = path === href || path.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cx(
                    "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-brand-100 text-brand-600"
                      : "text-mute hover:bg-brand-50",
                  )}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-end gap-3 px-6 py-4">
            <LangSwitch />
            <Link
              href={`/team/${user.username}`}
              className="flex items-center gap-2 rounded-xl border border-line bg-white px-2.5 py-1.5"
            >
              <Avatar name={user.name} src={avatarUrl(user)} size={28} />
              <span className="text-sm font-medium">{user.name}</span>
            </Link>
            <button
              onClick={logout}
              title={t("signOut")}
              className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white text-mute hover:bg-brand-50"
            >
              <LogOut size={16} />
            </button>
          </header>
          <main className="px-6 pb-10">{children}</main>
        </div>
      </div>
    </UserCtx.Provider>
  );
}
