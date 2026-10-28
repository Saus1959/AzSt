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
  Users,
  LogOut,
  ShieldCheck,
  ArrowLeftRight,
  CheckSquare,
  FileText,
} from "lucide-react";
import { api, avatarUrl, useUnreadNews } from "@/lib/client";
import { useT } from "@/lib/i18n";
import { LABEL, canSee, groupName, visibleDepots } from "@/lib/constants";
import { Avatar, LangSwitch, cx } from "./ui";
import {
  usePresence,
  PresenceChip,
  PresenceNudge,
  PresenceModal,
} from "./Presence";

const UserCtx = createContext(null);
export const useUser = () => useContext(UserCtx);
const ICON = {
  electronics: Cpu,
  mechanics: Wrench,
  programming: Code2,
};

export default function Shell({ user, children }) {
  const path = usePathname();
  const t = useT();
  const p = usePresence(user);
  const unreadNews = useUnreadNews(path);

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
    { href: "/tasks", label: t("tasksAndNews"), Icon: CheckSquare, badge: unreadNews },
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
            <span className="font-semibold">AzST</span>
          </div>
          <Link
            href="/groups"
            title={t("switchGroup")}
            className="mx-3 mb-3 flex items-center justify-between gap-2 rounded-xl border border-line bg-brand-50 px-3 py-2 text-sm hover:bg-brand-100"
          >
            <span className="min-w-0">
              <span className="block truncate font-semibold">
                {groupName(user.group)}
              </span>
              <span className="block truncate text-xs text-mute">
                {user.title}
              </span>
            </span>
            <ArrowLeftRight size={16} className="shrink-0 text-brand-600" />
          </Link>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
            {nav.map(({ href, label, Icon, badge }) => {
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
                  {badge > 0 && (
                    <span
                      title={t("unreadNews")}
                      className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold leading-none text-white"
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 px-4 py-3 md:px-6 md:py-4">
            <PresenceChip p={p} />
            <LangSwitch />
            <Link
              href={`/team/${user.username}`}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-line bg-white px-2 sm:px-2.5 py-1.5"
            >
              <Avatar
                name={user.name}
                src={avatarUrl(user)}
                size={28}
                active={p.active}
              />
              <span className="hidden sm:block text-sm font-medium">
                {user.name}
              </span>
            </Link>
            <button
              onClick={logout}
              title={t("signOut")}
              className="grid shrink-0 h-9 w-9 place-items-center rounded-xl border border-line bg-white text-mute hover:bg-brand-50"
            >
              <LogOut size={16} />
            </button>
          </header>
          <main className="px-6 pb-10">
            <PresenceNudge p={p} />
            {children}
          </main>
          <PresenceModal p={p} />
        </div>
      </div>
    </UserCtx.Provider>
  );
}
