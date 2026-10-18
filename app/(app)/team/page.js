'use client';
import { useRouter } from 'next/navigation';
import { useApi, api } from '@/lib/client';
import { useT } from '@/lib/i18n';
import { useUser } from '@/components/Shell';
import { LABEL, TITLES } from '@/lib/constants';
import { Badge, PageHead } from '@/components/ui';
import MemberCard from '@/components/MemberCard';

const ORDER = ['leadership', 'electronics', 'mechanics', 'programming'];

export default function TeamPage() {
  const t = useT();
  const me = useUser();
  const router = useRouter();
  const { data, reload } = useApi('/api/users');
  const users = (data?.users || []).sort((a, b) => TITLES.indexOf(a.title) - TITLES.indexOf(b.title) || a.name.localeCompare(b.name));

  const move = async (u, position) => {
    await api(`/api/users/${u.id}`, { method: 'PATCH', body: { position } });
    reload();
    router.refresh();
  };

  return (
    <>
      <PageHead title="Team" sub={t('teamSub')} />
      {ORDER.map((p) => {
        const list = users.filter((u) => u.position === p);
        if (!list.length) return null;
        return (
          <section key={p} className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-mute">{LABEL[p]} <Badge>{list.length}</Badge></h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {list.map((u) => <MemberCard key={u.id} u={u} onMove={me.isAdmin ? move : undefined} />)}
            </div>
          </section>
        );
      })}
    </>
  );
}
