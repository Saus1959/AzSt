'use client';
import { useApi } from '@/lib/client';
import { useT } from '@/lib/i18n';
import { LABEL, POSITIONS } from '@/lib/constants';
import { Badge, PageHead } from '@/components/ui';
import MemberCard from '@/components/MemberCard';

export default function TeamPage() {
  const t = useT();
  const { data } = useApi('/api/users');
  const users = data?.users || [];
  const vacancies = data?.vacancies || [];

  return (
    <>
      <PageHead title="Team" sub={t('teamSub')} />
      {!data && <p className="text-mute">{t('loading')}</p>}
      {POSITIONS.map((p) => {
        const list = users.filter((u) => u.position === p);
        const free = vacancies.filter((v) => v.position === p);
        if (!list.length && !free.length) return null;
        return (
          <section key={p} className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-mute">
              {LABEL[p]} <Badge>{list.length}</Badge>
              {free.length > 0 && <Badge tone="gray">{free.length} {t('vacancies')}</Badge>}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {list.map((u) => <MemberCard key={u.id} u={u} />)}
              {free.map((v) => <MemberCard key={v.id} vacancy={v} />)}
            </div>
          </section>
        );
      })}
    </>
  );
}
