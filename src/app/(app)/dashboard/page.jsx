"use client";
import Link from "next/link";
import { Boxes, PauseCircle, FileText, Users, Clock } from "lucide-react";
import { useApi, avatarUrl, isActive } from "@/lib/client";
import { useT } from "@/lib/i18n";
import { useUser } from "@/components/Shell";
import { groupName } from "@/lib/constants";
import { Card, Badge, Avatar, PageHead, Stat, cx } from "@/components/ui";
import { isDoneFor, isOverdue } from "@/lib/taskUtils";

export default function Dashboard() {
  const t = useT();
  const user = useUser();
  const depots = useApi("/api/depots").data?.depots || [];
  const docs = useApi("/api/docs").data?.docs || [];
  const team = useApi("/api/users").data?.users || [];

  const total = depots.reduce((n, d) => n + d.items.length, 0);
  const passive = depots.flatMap((d) =>
    d.items.filter((i) => !i.active).map((i) => ({ ...i, depot: d.key })),
  );
  const depotName = (k) => t("depot_" + k);
  const onDuty = team.filter((u) => isActive(u));

  // My open tasks: nearest deadline first, no-deadline tasks last
  const myTasks = (useApi("/api/tasks").data?.tasks || [])
    .filter((x) => x.mine && !isDoneFor(x, user.id))
    .sort((a, b) => (a.dueDate ? new Date(a.dueDate) : Infinity) - (b.dueDate ? new Date(b.dueDate) : Infinity));

  return (
    <>
      <PageHead
        title={`${t("welcome")}, ${user.name.split(" ")[0]}`}
        sub={`${groupName(user.group)} · ${user.title}`}
      >
        <Link
          href={`/team/${user.username}`}
          className="rounded-xl bg-brand-100 px-3.5 py-2 text-sm font-medium text-brand-600 hover:bg-brand-200"
        >
          {t("myPage")}
        </Link>
      </PageHead>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Boxes} label={t("dashObjects")} value={total} />
        <Stat
          icon={PauseCircle}
          label={t("dashPassive")}
          value={passive.length}
        />
        <Stat icon={FileText} label={t("statDocs")} value={docs.length} />
        <Stat icon={Users} label={t("statTeam")} value={team.length} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 font-semibold">{t("dashDepots")}</h2>
          {!depots.length ? (
            <p className="text-sm text-mute">{t("dashNoDepots")}</p>
          ) : (
            <ul className="space-y-4">
              {depots.map((d) => {
                const act = d.items.filter((i) => i.active).length;
                return (
                  <li key={d.key}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium">{depotName(d.key)}</span>
                      <span className="text-mute">
                        {d.items.length} {t("adminObjects")}
                      </span>
                    </div>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="bg-brand-400"
                        style={{
                          width: d.items.length
                            ? `${(act / d.items.length) * 100}%`
                            : 0,
                        }}
                      />
                    </div>
                    <div className="mt-1.5 flex gap-2">
                      <Badge>
                        {t("depotActive")} · {act}
                      </Badge>
                      <Badge tone="gray">
                        {t("depotPassive")} · {d.items.length - act}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <h2 className="mb-3 mt-6 font-semibold">{t("dashPassiveList")}</h2>
          {!passive.length ? (
            <p className="text-sm text-mute">{t("allGood")}</p>
          ) : (
            <ul className="divide-y divide-line">
              {passive.slice(0, 6).map((i) => (
                <li
                  key={i.depot + i.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <span>
                    {i.name || t("unnamed")}{" "}
                    <span className="text-mute">· {depotName(i.depot)}</span>
                  </span>
                  <Badge tone="gray">{t("depotPassive")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              {t("myTasks")} {myTasks.length > 0 && <Badge tone={myTasks.some(isOverdue) ? "rose" : "blue"}>{myTasks.length}</Badge>}
            </h2>
            <Link href="/tasks" className="text-xs text-brand-600 hover:underline">{t("viewAll")}</Link>
          </div>
          {!myTasks.length ? (
            <p className="text-sm text-mute">{t("noOpenTasks")}</p>
          ) : (
            <ul className="space-y-2.5">
              {myTasks.slice(0, 5).map((x) => {
                const late = isOverdue(x);
                return (
                  <li key={x._id}>
                    <Link href="/tasks" className={cx("block rounded-xl border px-3 py-2 text-sm", late ? "border-rose-300 bg-rose-50" : "border-line hover:bg-brand-50")}>
                      <div className="truncate font-medium">{x.title}</div>
                      <div className={cx("mt-0.5 flex items-center text-xs", late ? "font-semibold text-rose-600" : "text-mute")}>
                        <Clock size={12} className="mr-1" />
                        {x.dueDate ? new Date(x.dueDate).toLocaleDateString() : t("noDeadline")}
                        {late && ` · ${t("overdue")}`}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-semibold">{t("onDuty")} <Badge tone="green">{onDuty.length}</Badge></h2>
          {!onDuty.length ? (
            <p className="text-sm text-mute">{t("nobodyOnDuty")}</p>
          ) : (
            <ul className="space-y-2.5">
              {onDuty.map((u) => (
                <li key={u.id} className="flex items-center gap-3 text-sm">
                  <Avatar name={u.name} src={avatarUrl(u)} size={30} active />
                  <span className="min-w-0 flex-1 truncate font-medium">{u.name}</span>
                  <span className="text-xs text-mute">{new Date(u.activeUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">{t("recentDocs")}</h2>
          {!docs.length ? (
            <p className="text-sm text-mute">{t("empty")}</p>
          ) : (
            <ul className="space-y-3">
              {docs.slice(0, 6).map((d) => (
                <li key={d._id} className="text-sm">
                  <div className="font-medium">{d.title}</div>
                  <div className="text-xs text-mute">
                    {d.author?.name} ·{" "}
                    {new Date(d.updatedAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        </div>
      </div>
    </>
  );
}
