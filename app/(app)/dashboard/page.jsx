'use client';
import Link from 'next/link';
import { Boxes, AlertTriangle, FileText, Users } from 'lucide-react';
import { useApi } from '@/lib/client';
import { useT } from '@/lib/i18n';
import { useUser } from '@/components/Shell';
import { LABEL, STATUSES } from '@/lib/constants';
import { Card, Badge, PageHead, Stat, STATUS_TONE, STATUS_BAR } from '@/components/ui';

export default function Dashboard() {
  const t = useT();
  const user = useUser();
  const res = useApi('/api/resources').data?.resources || [];
  const docs = useApi('/api/docs').data?.docs || [];
  const team = useApi('/api/users').data?.users || [];

  const bad = res.filter((r) => ['low', 'out', 'broken'].includes(r.status));
  const count = (s) => res.filter((r) => r.status === s).length;

  return (
    <>
      <PageHead title={`${t('welcome')}, ${user.name.split(' ')[0]}`} sub={`${user.title} · ${LABEL[user.position]}`}>
        <Link href={`/team/${user.username}`} className="rounded-xl bg-brand-100 px-3.5 py-2 text-sm font-medium text-brand-600 hover:bg-brand-200">{t('myPage')}</Link>
      </PageHead>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Boxes} label={t('statResources')} value={res.length} />
        <Stat icon={AlertTriangle} label={t('statLow')} value={bad.length} />
        <Stat icon={FileText} label={t('statDocs')} value={docs.length} />
        <Stat icon={Users} label={t('statTeam')} value={team.length} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 font-semibold">{t('stockStatus')}</h2>
          <div className="flex h-3 overflow-hidden rounded-full bg-brand-50">
            {STATUSES.map((s) => count(s) > 0 && <div key={s} className={STATUS_BAR[s]} style={{ width: `${(count(s) / res.length) * 100}%` }} />)}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-mute">
            {STATUSES.map((s) => (
              <span key={s} className="flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-full ${STATUS_BAR[s]}`} />{t('s_' + s)} · {count(s)}</span>
            ))}
          </div>

          <h2 className="mb-3 mt-6 font-semibold">{t('needsAttention')}</h2>
          {!bad.length ? <p className="text-sm text-mute">{t('allGood')}</p> : (
            <ul className="divide-y divide-line">
              {bad.slice(0, 6).map((r) => (
                <li key={r._id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>{r.name} <span className="text-mute">· {LABEL[r.depo]} Depo · {r.quantity}</span></span>
                  <Badge tone={STATUS_TONE[r.status]}>{t('s_' + r.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">{t('recentDocs')}</h2>
          {!docs.length ? <p className="text-sm text-mute">{t('empty')}</p> : (
            <ul className="space-y-3">
              {docs.slice(0, 6).map((d) => (
                <li key={d._id} className="text-sm">
                  <div className="font-medium">{d.title}</div>
                  <div className="text-xs text-mute">{d.author?.name} · {new Date(d.updatedAt).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
