'use client';
import { useParams } from 'next/navigation';
import { useApi } from '@/lib/client';
import { useT } from '@/lib/i18n';
import { useUser } from '@/components/Shell';
import { POSITIONS, LABEL, TITLES, canSee } from '@/lib/constants';
import { Card, PageHead } from '@/components/ui';
import MemberCard from '@/components/MemberCard';
import DocsPanel from '@/components/DocsPanel';

export default function Section() {
  const { key } = useParams();
  const t = useT();
  const user = useUser();
  const users = useApi('/api/users').data?.users || [];

  if (!POSITIONS.includes(key) || !canSee(user, key)) return <Card>{t('noAccess')}</Card>;
  const members = users.filter((u) => u.position === key).sort((a, b) => TITLES.indexOf(a.title) - TITLES.indexOf(b.title));

  return (
    <>
      <PageHead title={LABEL[key]} sub={`${members.length} ${t('members').toLowerCase()}`} />
      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {members.map((u) => <MemberCard key={u.id} u={u} />)}
      </div>
      <h2 className="mb-3 font-semibold">Docs</h2>
      <DocsPanel dept={key} />
    </>
  );
}
