'use client';
import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { Card, Avatar } from './ui';

// u === null → vacancy ("npc"): { title } only
export default function MemberCard({ u, vacancy }) {
  const t = useT();
  if (vacancy) {
    return (
      <Card className="flex items-center gap-3 border-dashed bg-white/60">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400"><UserRound size={18} /></div>
        <div className="min-w-0">
          <div className="truncate font-medium text-mute">{t('npcTitle')}</div>
          <div className="truncate text-sm text-mute">{vacancy.title}</div>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <Link href={`/team/${u.username}`} className="flex items-center gap-3">
        <Avatar name={u.name} />
        <div className="min-w-0">
          <div className="truncate font-medium">{u.name}</div>
          <div className="text-sm text-mute">{u.title}</div>
        </div>
      </Link>
    </Card>
  );
}
